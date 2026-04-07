import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, comments, commentReactions, posts, users, type InsertComment, type InsertPost } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function getPublishedPosts(opts: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: "title" | "date" | "topic";
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { page, limit, search, sortBy = "date" } = opts;
  const offset = (page - 1) * limit;

  const whereClause = and(
    eq(posts.published, true),
    search
      ? or(
          like(posts.title, `%${search}%`),
          like(posts.subtitle, `%${search}%`),
          like(posts.summary, `%${search}%`),
          like(posts.topic, `%${search}%`)
        )
      : undefined
  );

  const orderBy =
    sortBy === "title"
      ? posts.title
      : sortBy === "topic"
      ? posts.topic
      : posts.publishedAt;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        subtitle: posts.subtitle,
        summary: posts.summary,
        thumbnailUrl: posts.thumbnailUrl,
        hashtags: posts.hashtags,
        topic: posts.topic,
        episode: posts.episode,
        authorName: posts.authorName,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(whereClause)
      .orderBy(desc(orderBy))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(whereClause),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAllPosts(opts: { page: number; limit: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { page, limit } = opts;
  const offset = (page - 1) * limit;
  const [items, countResult] = await Promise.all([
    db.select().from(posts).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function createPost(data: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values(data);
  return result;
}

export async function updatePost(id: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(posts).set(data).where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(posts).where(eq(posts.id, id));
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);
}

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(data);
  const id = (result as any)[0]?.insertId as number;
  const created = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return created[0];
}

export async function likeComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(comments)
    .set({ likeCount: sql`${comments.likeCount} + 1` })
    .where(eq(comments.id, commentId));
}

// ─── Comment Reactions ───────────────────────────────────────────────────────

export async function getReactionsByCommentIds(commentIds: number[]) {
  if (commentIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(commentReactions)
    .where(sql`${commentReactions.commentId} IN (${sql.join(commentIds.map(id => sql`${id}`), sql`, `)})`);
}

export async function toggleReaction(commentId: number, sessionId: string, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(commentReactions)
    .where(
      and(
        eq(commentReactions.commentId, commentId),
        eq(commentReactions.sessionId, sessionId),
        eq(commentReactions.emoji, emoji)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(commentReactions).where(eq(commentReactions.id, existing[0].id));
    return { action: "removed" };
  } else {
    await db.insert(commentReactions).values({ commentId, sessionId, emoji });
    return { action: "added" };
  }
}
