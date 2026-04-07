/**
 * Simply Sharon - Posts & Comments Router Tests
 * Uses vi.mock to stub DB helpers so tests run without a live DB connection.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ─── Mock the DB module before importing routers ──────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getPublishedPosts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getAllPosts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getPostBySlug: vi.fn().mockResolvedValue(null),
  getPostById: vi.fn().mockResolvedValue(null),
  createPost: vi.fn().mockResolvedValue({ insertId: 42 }),
  updatePost: vi.fn().mockResolvedValue(undefined),
  deletePost: vi.fn().mockResolvedValue(undefined),
  getCommentsByPostId: vi.fn().mockResolvedValue([]),
  createComment: vi.fn().mockResolvedValue({ insertId: 100 }),
  likeComment: vi.fn().mockResolvedValue(undefined),
  getReactionsByCommentIds: vi.fn().mockResolvedValue([]),
  toggleReaction: vi.fn().mockResolvedValue({ added: true }),
  addReaction: vi.fn().mockResolvedValue(undefined),
}));

// ─── Import after mocking ─────────────────────────────────────────────────────
import { appRouter } from "./routers";
import * as db from "./db";

// ─── Context Factories ────────────────────────────────────────────────────────
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "sharon@simplysharon.ca",
      name: "Sharon Danley",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Sharon Danley");
    expect(result?.role).toBe("admin");
  });

  it("returns user for authenticated regular user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.auth.me();
    expect(result?.role).toBe("user");
  });
});

// ─── Posts Router Tests ───────────────────────────────────────────────────────
describe("posts.list", () => {
  beforeEach(() => {
    vi.mocked(db.getPublishedPosts).mockResolvedValue({ items: [], total: 0 });
  });

  it("returns paginated results for public users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.posts.list({ page: 1, limit: 15 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
    expect(db.getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 15 })
    );
  });

  it("passes search parameter to DB helper", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.posts.list({ page: 1, limit: 15, search: "gray" });
    expect(db.getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ search: "gray" })
    );
  });

  it("passes sortBy parameter to DB helper", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.posts.list({ page: 1, limit: 15, sortBy: "title" });
    expect(db.getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: "title" })
    );
  });

  it("returns mocked posts correctly", async () => {
    const mockPost = {
      id: 1,
      slug: "test-post",
      title: "Test Post",
      subtitle: "Test subtitle",
      summary: "Test summary",
      thumbnailUrl: null,
      thumbnailKey: null,
      hashtags: ["#Test"],
      topic: "Beauty",
      episode: 1,
      authorName: "Sharon Danley",
      blocks: [],
      published: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.getPublishedPosts).mockResolvedValue({ items: [mockPost], total: 1 });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.posts.list({ page: 1, limit: 15 });
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe("Test Post");
  });
});

describe("posts.bySlug", () => {
  it("throws NOT_FOUND for non-existent slug", async () => {
    vi.mocked(db.getPostBySlug).mockResolvedValue(null);
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.posts.bySlug({ slug: "non-existent" })).rejects.toThrow("Post not found");
  });

  it("returns post for valid slug", async () => {
    const mockPost = {
      id: 1, slug: "test-post", title: "Test Post", subtitle: null,
      summary: null, thumbnailUrl: null, thumbnailKey: null,
      hashtags: [], topic: null, episode: null, authorName: "Sharon",
      blocks: [], published: true, publishedAt: new Date(),
      createdAt: new Date(), updatedAt: new Date(),
    };
    vi.mocked(db.getPostBySlug).mockResolvedValue(mockPost);
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.posts.bySlug({ slug: "test-post" });
    expect(result?.title).toBe("Test Post");
  });
});

// ─── Admin Router Tests ───────────────────────────────────────────────────────
describe("admin.createPost", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.admin.createPost({ title: "Test Post", published: false })
    ).rejects.toThrow();
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.admin.createPost({ title: "Test Post", published: false })
    ).rejects.toThrow();
  });

  it("creates a post for admin users and returns slug", async () => {
    vi.mocked(db.createPost).mockResolvedValue({ insertId: 42 });
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.createPost({
      title: "Test Post from Vitest",
      subtitle: "Test subtitle",
      summary: "Test summary",
      topic: "Test",
      hashtags: ["#Test"],
      published: false,
    });
    expect(result.success).toBe(true);
    expect(result.slug).toContain("test-post-from-vitest");
    expect(db.createPost).toHaveBeenCalled();
  });

  it("generates a unique slug from the title", async () => {
    vi.mocked(db.createPost).mockResolvedValue({ insertId: 1 });
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.createPost({
      title: "Gray Is Gorgeous Own Your Way",
      published: true,
    });
    expect(result.slug).toMatch(/gray-is-gorgeous-own-your-way/);
  });
});

describe("admin.listPosts", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.admin.listPosts({ page: 1 })).rejects.toThrow();
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.listPosts({ page: 1 })).rejects.toThrow();
  });

  it("returns all posts for admin users", async () => {
    vi.mocked(db.getAllPosts).mockResolvedValue({ items: [], total: 0 });
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.listPosts({ page: 1, limit: 10 });
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });
});

// ─── Comments Router Tests ────────────────────────────────────────────────────
describe("comments.byPost", () => {
  it("returns comments for a post", async () => {
    vi.mocked(db.getCommentsByPostId).mockResolvedValue([]);
    vi.mocked(db.getReactionsByCommentIds).mockResolvedValue([]);
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.byPost({ postId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("comments.create", () => {
  it("creates a comment for public users", async () => {
    vi.mocked(db.createComment).mockResolvedValue({ insertId: 100 });
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.create({
      postId: 1,
      authorName: "Test User",
      content: "This is a test comment",
    });
    // createComment returns the raw DB result (insertId)
    expect(result).toHaveProperty("insertId", 100);
    expect(db.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ authorName: "Test User", content: "This is a test comment" })
    );
  });

  it("validates that authorName is required (non-empty)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.comments.create({ postId: 1, authorName: "", content: "Test" })
    ).rejects.toThrow();
  });

  it("validates that content is required (non-empty)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.comments.create({ postId: 1, authorName: "User", content: "" })
    ).rejects.toThrow();
  });

  it("validates content max length (2000 chars)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.comments.create({
        postId: 1,
        authorName: "User",
        content: "a".repeat(2001),
      })
    ).rejects.toThrow();
  });

  it("accepts content at exactly max length (2000 chars)", async () => {
    vi.mocked(db.createComment).mockResolvedValue({ insertId: 101 });
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.create({
      postId: 1,
      authorName: "User",
      content: "a".repeat(2000),
    });
    expect(result).toHaveProperty("insertId", 101);
  });
});

describe("comments.like", () => {
  it("increments like count for a comment", async () => {
    vi.mocked(db.likeComment).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.like({ commentId: 1 });
    expect(result.success).toBe(true);
    expect(db.likeComment).toHaveBeenCalledWith(1);
  });
});

describe("comments.react", () => {
  it("toggles an emoji reaction on a comment", async () => {
    vi.mocked(db.toggleReaction).mockResolvedValue({ added: true });
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.react({
      commentId: 1,
      emoji: "❤️",
      sessionId: "test-session-123",
    });
    expect(result).toHaveProperty("added");
    // toggleReaction is called with positional args: (commentId, sessionId, emoji)
    expect(db.toggleReaction).toHaveBeenCalledWith(1, "test-session-123", "❤️");
  });
});
