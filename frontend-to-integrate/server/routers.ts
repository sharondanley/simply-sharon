import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createComment,
  createPost,
  deletePost,
  getAllPosts,
  getCommentsByPostId,
  getPostById,
  getPostBySlug,
  getPublishedPosts,
  getReactionsByCommentIds,
  likeComment,
  toggleReaction,
  updatePost,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    adminLogin: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { username, password } = input;
        // Validate against env-configured credentials
        if (
          !ENV.adminPassword ||
          username !== ENV.adminUsername ||
          password !== ENV.adminPassword
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }
        // Issue a JWT session cookie for the local admin
        const token = await sdk.signSession(
          { openId: "local:admin", appId: "local", name: "Admin" },
          { expiresInMs: 7 * 24 * 60 * 60 * 1000 } // 7 days
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true } as const;
      }),
  }),

  posts: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(15),
          search: z.string().optional(),
          sortBy: z.enum(["title", "date", "topic"]).optional(),
        })
      )
      .query(({ input }) => getPublishedPosts(input)),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await getPostBySlug(input.slug);
        if (!post || !post.published) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        return post;
      }),
  }),

  comments: router({
    byPost: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        const allComments = await getCommentsByPostId(input.postId);
        const ids = allComments.map((c) => c.id);
        const reactions = await getReactionsByCommentIds(ids);
        const reactionMap: Record<number, Record<string, number>> = {};
        for (const r of reactions) {
          if (!reactionMap[r.commentId]) reactionMap[r.commentId] = {};
          reactionMap[r.commentId][r.emoji] = (reactionMap[r.commentId][r.emoji] ?? 0) + 1;
        }
        return allComments.map((c) => ({ ...c, reactions: reactionMap[c.id] ?? {} }));
      }),

    create: publicProcedure
      .input(
        z.object({
          postId: z.number(),
          parentId: z.number().optional(),
          authorName: z.string().min(1).max(100),
          authorEmail: z.string().email().optional(),
          content: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ input }) => {
        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.authorName)}`;
        return createComment({
          postId: input.postId,
          parentId: input.parentId ?? null,
          authorName: input.authorName,
          authorEmail: input.authorEmail ?? null,
          avatarUrl,
          content: input.content,
          likeCount: 0,
        });
      }),

    like: publicProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input }) => {
        await likeComment(input.commentId);
        return { success: true };
      }),

    react: publicProcedure
      .input(
        z.object({
          commentId: z.number(),
          sessionId: z.string(),
          emoji: z.enum(["\u2764\ufe0f", "\ud83d\udc4d", "\ud83d\ude02"]),
        })
      )
      .mutation(async ({ input }) => {
        return toggleReaction(input.commentId, input.sessionId, input.emoji);
      }),
  }),

  admin: router({
    listPosts: adminProcedure
      .input(z.object({ page: z.number().min(1).default(1), limit: z.number().default(20) }))
      .query(({ input }) => getAllPosts(input)),

    getPost: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await getPostById(input.id);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        return post;
      }),

    createPost: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(500),
          subtitle: z.string().max(500).optional(),
          summary: z.string().optional(),
          topic: z.string().max(100).optional(),
          episode: z.number().optional(),
          hashtags: z.array(z.string()).optional(),
          blocks: z.any().optional(),
          thumbnailUrl: z.string().optional(),
          thumbnailKey: z.string().optional(),
          published: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const baseSlug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const slug = `${baseSlug}-${nanoid(6)}`;
        await createPost({
          slug,
          title: input.title,
          subtitle: input.subtitle ?? null,
          summary: input.summary ?? null,
          topic: input.topic ?? null,
          episode: input.episode ?? null,
          hashtags: input.hashtags ?? [],
          blocks: input.blocks ?? [],
          thumbnailUrl: input.thumbnailUrl ?? null,
          thumbnailKey: input.thumbnailKey ?? null,
          published: input.published,
          publishedAt: input.published ? new Date() : null,
        });
        return { success: true, slug };
      }),

    updatePost: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(500).optional(),
          subtitle: z.string().max(500).optional(),
          summary: z.string().optional(),
          topic: z.string().max(100).optional(),
          episode: z.number().optional(),
          hashtags: z.array(z.string()).optional(),
          blocks: z.any().optional(),
          thumbnailUrl: z.string().optional(),
          thumbnailKey: z.string().optional(),
          published: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        if (data.published === true) {
          const existing = await getPostById(id);
          if (!existing?.publishedAt) updateData.publishedAt = new Date();
        }
        await updatePost(id, updateData as any);
        return { success: true };
      }),

    deletePost: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePost(input.id);
        return { success: true };
      }),

    uploadThumbnail: adminProcedure
      .input(
        z.object({
          filename: z.string(),
          contentType: z.string(),
          dataBase64: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.dataBase64, "base64");
        const ext = input.filename.split(".").pop() ?? "jpg";
        const key = `thumbnails/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),
});

export type AppRouter = typeof appRouter;
