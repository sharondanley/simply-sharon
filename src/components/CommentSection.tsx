import { useEffect, useMemo, useRef, useState } from "react";

type ReactionType = "like" | "heart";

type UserReaction = ReactionType | null;

type AuthUser = {
  name: string;
  role: string;
};

interface ApiComment {
  id: number | string;
  postId: number | string;
  parentId: number | string | null;
  authorName: string;
  content: string;
  createdAt: string;
  likesCount: number | string;
  heartsCount: number | string;
  isVerifiedAuthor: number | string;
}

interface Comment {
  id: number;
  parentId: number | null;
  authorName: string;
  initials: string;
  content: string;
  timestamp: string;
  timestampMs: number;
  likes: number;
  hearts: number;
  isVerifiedAuthor: boolean;
  userReaction: UserReaction;
  replies: Comment[];
}

const AUTHOR_NAME_STORAGE_KEY = "blog-comment-author-name";

const T = {
  fontFamily: "Helvetica, Arial, sans-serif",
  body: { fontSize: "36px", lineHeight: "46px" },
  author: { fontSize: "32px", lineHeight: "40px", fontWeight: 700 },
  meta: { fontSize: "28px", lineHeight: "36px" },
  heading: { fontSize: "44px", lineHeight: "54px", fontWeight: 700 },
  toolbar: { fontSize: "30px", lineHeight: "1" },
  sendBtn: { fontSize: "28px", lineHeight: "36px", fontWeight: 600 },
  sortBtn: { fontSize: "26px", lineHeight: "32px", fontWeight: 500 },
  inputLabel: { fontSize: "24px", lineHeight: "30px", fontWeight: 600 },
  inputText: { fontSize: "28px", lineHeight: "34px" },
};

function toRelativeTime(input: string | number | Date) {
  const ts = new Date(input).getTime();
  const diff = Math.max(1, Date.now() - ts);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
  return `${Math.floor(diff / day)} days ago`;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "GU";
}

function normalizeComments(rows: ApiComment[]): Comment[] {
  const byId = new Map<number, Comment>();
  rows.forEach((row) => {
    const id = Number(row.id);
    if (!Number.isFinite(id)) return;

    const parentId = row.parentId == null ? null : Number(row.parentId);
    const safeParentId = Number.isFinite(parentId as number) ? (parentId as number) : null;
    const likes = Number(row.likesCount);
    const hearts = Number(row.heartsCount);
    const isVerifiedAuthor = Number(row.isVerifiedAuthor);

    const ts = new Date(row.createdAt).getTime();
    byId.set(id, {
      id,
      parentId: safeParentId,
      authorName: row.authorName,
      initials: initialsFromName(row.authorName),
      content: row.content,
      timestamp: toRelativeTime(row.createdAt),
      timestampMs: ts,
      likes: Number.isFinite(likes) ? likes : 0,
      hearts: Number.isFinite(hearts) ? hearts : 0,
      isVerifiedAuthor: Number.isFinite(isVerifiedAuthor) && isVerifiedAuthor > 0,
      userReaction: null,
      replies: [],
    });
  });

  const roots: Comment[] = [];
  byId.forEach((comment) => {
    if (comment.parentId != null && byId.has(comment.parentId)) {
      byId.get(comment.parentId)!.replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  const sortRec = (list: Comment[]) => {
    list.sort((a, b) => a.timestampMs - b.timestampMs);
    list.forEach((c) => sortRec(c.replies));
  };
  sortRec(roots);

  return roots;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function ThumbUpIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function HeartIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 8.6c0 6.1-8.8 11.4-8.8 11.4S3.2 14.7 3.2 8.6A4.8 4.8 0 0 1 12 5.8a4.8 4.8 0 0 1 8.8 2.8z" />
    </svg>
  );
}

function ReactionPill({
  likes,
  hearts,
  userReaction,
  onReact,
}: {
  likes: number;
  hearts: number;
  userReaction: UserReaction;
  onReact: (reaction: ReactionType) => void;
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 0, border: "1px solid #d1d5db", borderRadius: 100, padding: "6px 16px", height: 52, userSelect: "none" }}>
      <button
        onClick={() => onReact("like")}
        title="Like"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: userReaction === "like" ? "#1d4ed8" : "#6b7280", lineHeight: 1 }}
      >
        <ThumbUpIcon size={28} />
      </button>
      <span style={{ ...T.meta, fontFamily: T.fontFamily, color: userReaction === "like" ? "#1d4ed8" : "#374151", fontWeight: userReaction === "like" ? 700 : 400, marginLeft: 8, minWidth: 20 }}>
        {likes}
      </span>
      <span style={{ width: 1, height: 22, background: "#d1d5db", margin: "0 12px", display: "inline-block" }} />
      <button
        onClick={() => onReact("heart")}
        title="Heart"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: userReaction === "heart" ? "#dc2626" : "#6b7280", lineHeight: 1 }}
      >
        <HeartIcon size={28} />
      </button>
      <span style={{ ...T.meta, fontFamily: T.fontFamily, color: userReaction === "heart" ? "#dc2626" : "#374151", fontWeight: userReaction === "heart" ? 700 : 400, marginLeft: 8, minWidth: 20 }}>
        {hearts}
      </span>
    </div>
  );
}

function RichTextEditor({
  disabled,
  onSend,
  placeholder,
  compact = false,
}: {
  disabled?: boolean;
  onSend: (html: string) => Promise<void> | void;
  placeholder: string;
  compact?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const execCommand = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    const text = editorRef.current?.innerText ?? "";
    setIsEmpty(text.trim().length === 0);
  };

  const handleSend = async () => {
    if (disabled) return;
    const html = editorRef.current?.innerHTML ?? "";
    const text = editorRef.current?.innerText ?? "";
    if (!text.trim()) return;

    await onSend(html);

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setIsEmpty(true);
  };

  return (
    <div style={{ border: "1px solid #d1d5db", borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="comment-editor"
        style={{ minHeight: compact ? 80 : 120, padding: "18px 20px", outline: "none", opacity: disabled ? 0.7 : 1, ...T.body, fontFamily: T.fontFamily, color: "#111827" }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[
            { command: "bold", label: "B", extra: { fontWeight: 700 } },
            { command: "italic", label: "I", extra: { fontStyle: "italic" as const } },
            { command: "underline", label: "U", extra: { textDecoration: "underline" } },
            { command: "insertUnorderedList", label: "≡", extra: {} },
          ].map(({ command, label, extra }) => (
            <button
              key={command}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                execCommand(command);
              }}
              disabled={disabled}
              style={{ width: 44, height: 44, border: "none", background: "transparent", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", ...T.toolbar, fontFamily: T.fontFamily, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", ...extra }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            void handleSend();
          }}
          disabled={disabled || isEmpty}
          style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: disabled || isEmpty ? "#9ca3af" : "#374151", color: "#fff", ...T.sendBtn, fontFamily: T.fontFamily, cursor: disabled || isEmpty ? "not-allowed" : "pointer" }}
        >
          {disabled ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

const AVATAR_COLORS: Record<string, string> = { FM: "#6b7280", AF: "#8b5cf6", EH: "#ec4899", SD: "#374151", YO: "#0ea5e9", GU: "#4b5563" };

function Avatar({ authorName, initials, size = 56 }: { authorName: string; initials: string; size?: number }) {
  const bg = AVATAR_COLORS[initials] ?? "#6b7280";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div aria-label={authorName} style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, fontFamily: T.fontFamily }}>
        {initials}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  depth = 0,
  onReply,
  onReact,
}: {
  comment: Comment;
  depth?: number;
  onReply: (parentId: number, html: string) => Promise<void>;
  onReact: (id: number, reaction: ReactionType) => Promise<void>;
}) {
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [replyPending, setReplyPending] = useState(false);

  const handleReplySend = async (html: string) => {
    setReplyPending(true);
    try {
      await onReply(comment.id, html);
      setShowReplyEditor(false);
    } finally {
      setReplyPending(false);
    }
  };

  const avatarSize = depth > 0 ? 48 : 56;

  return (
    <div id={`comment-${comment.id}`} style={{ marginLeft: depth > 0 ? avatarSize + 16 : 0, scrollMarginTop: 140 }}>
      <div style={{ display: "flex", gap: 16, paddingTop: 24, paddingBottom: 16 }}>
        <Avatar authorName={comment.authorName} initials={comment.initials} size={avatarSize} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...T.author, fontFamily: T.fontFamily, color: "#111827" }}>{comment.authorName}</span>
              {comment.isVerifiedAuthor && (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-label="Verified Author">
                  <circle cx="8" cy="8" r="8" fill="#3b82f6" />
                  <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ ...T.meta, fontFamily: T.fontFamily, color: "#9ca3af" }}>{comment.timestamp}</span>
          </div>

          <div style={{ ...T.body, fontFamily: T.fontFamily, color: "#111827", marginBottom: 14 }} dangerouslySetInnerHTML={{ __html: comment.content }} />

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ReactionPill likes={comment.likes} hearts={comment.hearts} userReaction={comment.userReaction} onReact={(reaction) => { void onReact(comment.id, reaction); }} />
            <button onClick={() => setShowReplyEditor((value) => !value)} style={{ background: "none", border: "none", cursor: "pointer", ...T.meta, fontFamily: T.fontFamily, color: "#6b7280", padding: 0, fontWeight: 500 }}>
              Reply
            </button>
          </div>

          {showReplyEditor && (
            <div style={{ marginTop: 16 }}>
              <RichTextEditor disabled={replyPending} placeholder={`Reply to ${comment.authorName}...`} onSend={handleReplySend} compact />
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: "#f3f4f6" }} />
      {comment.replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} onReact={onReact} />
      ))}
    </div>
  );
}

export function CommentSection({ postId }: { postId?: number }) {
  const [authorName, setAuthorName] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [submitting, setSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const isAdmin = authUser?.role === "admin";

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return null;
        const user = (await response.json()) as AuthUser;
        return user;
      })
      .then((user) => {
        if (!user) return;
        setAuthUser(user);
        if (user.role === "admin") {
          setAuthorName(user.name || "Verified Author");
          return;
        }

        const stored = window.localStorage.getItem(AUTHOR_NAME_STORAGE_KEY);
        if (stored) setAuthorName(stored);
      })
      .catch(() => {
        const stored = window.localStorage.getItem(AUTHOR_NAME_STORAGE_KEY);
        if (stored) setAuthorName(stored);
      });
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    if (!authorName.trim()) return;
    window.localStorage.setItem(AUTHOR_NAME_STORAGE_KEY, authorName.trim());
  }, [authorName, isAdmin]);

  const loadComments = async () => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/blogcast/comments?postId=${postId}`, { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to load comments");
      }
      setComments(normalizeComments((data as { items?: ApiComment[] }).items || []));
    } catch (loadError) {
      setComments([]);
      setError(loadError instanceof Error ? loadError.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, [postId]);

  const totalCount = useMemo(() => {
    const countRec = (list: Comment[]): number => list.reduce((acc, item) => acc + 1 + countRec(item.replies), 0);
    return countRec(comments);
  }, [comments]);

  const sortedComments = useMemo(() => {
    const top = [...comments];
    if (sortBy === "latest") {
      top.sort((a, b) => b.timestampMs - a.timestampMs);
    } else {
      top.sort((a, b) => (b.likes + b.hearts) - (a.likes + a.hearts));
    }
    return top;
  }, [comments, sortBy]);

  const postComment = async (html: string, parentId: number | null) => {
    if (!postId) throw new Error("No post selected");

    const name = authorName.trim();
    const plainText = stripHtml(html);

    if (!name) throw new Error("Author name is required");
    if (!plainText) throw new Error("Comment content is required");

    const response = await fetch("/api/blogcast/comments", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, parentId, authorName: name, content: html }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || "Failed to save comment");
    }

    await loadComments();
  };

  const addComment = async (html: string) => {
    setSubmitting(true);
    setError("");
    try {
      await postComment(html, null);
      if (!isAdmin) {
        setAuthorName("");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save comment");
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const addReply = async (parentId: number, html: string) => {
    setError("");
    try {
      await postComment(html, parentId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save reply");
      throw submitError;
    }
  };

  const handleReact = async (id: number, reaction: ReactionType) => {
    const updateRec = (list: Comment[]): Comment[] =>
      list.map((comment) => {
        if (comment.id === id) {
          if (comment.userReaction === reaction) return comment;
          return {
            ...comment,
            userReaction: reaction,
            likes: reaction === "like" ? comment.likes + 1 : comment.likes,
            hearts: reaction === "heart" ? comment.hearts + 1 : comment.hearts,
          };
        }
        if (comment.replies.length > 0) {
          return { ...comment, replies: updateRec(comment.replies) };
        }
        return comment;
      });

    setComments((prev) => updateRec(prev));

    await fetch(`/api/blogcast/comments/${id}/reaction`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    }).catch(() => undefined);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 80px", fontFamily: T.fontFamily }}>
      <style>{`
        .comment-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .comment-mention {
          background: #e5e7eb;
          color: #374151;
          border-radius: 5px;
          padding: 2px 7px;
          font-weight: 500;
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ ...T.heading, fontFamily: T.fontFamily, color: "#111827" }}>Comments</span>
          <span style={{ ...T.body, fontFamily: T.fontFamily, color: "#6b7280", fontWeight: 400 }}>{totalCount}</span>
        </div>

        <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: 10, overflow: "hidden" }}>
          {(["latest", "popular"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              style={{ padding: "10px 26px", border: "none", background: sortBy === option ? "#374151" : "#fff", color: sortBy === option ? "#fff" : "#374151", ...T.sortBtn, fontFamily: T.fontFamily, cursor: "pointer" }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 36, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="comment-author-name" style={{ ...T.inputLabel, fontFamily: T.fontFamily, color: "#111827" }}>
            Name
          </label>
          <input
            id="comment-author-name"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="Your name"
            maxLength={100}
            readOnly={isAdmin}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "16px 18px",
              ...T.inputText,
              fontFamily: T.fontFamily,
              color: "#111827",
              background: isAdmin ? "#f3f4f6" : "#fff",
              outline: "none",
            }}
          />
          {isAdmin && (
            <div style={{ ...T.meta, fontFamily: T.fontFamily, color: "#2563eb" }}>
              Posting as verified author.
            </div>
          )}
        </div>

        <RichTextEditor disabled={submitting} onSend={addComment} placeholder="Add a comment" />

        {error && (
          <div style={{ ...T.meta, fontFamily: T.fontFamily, color: "#991b1b" }}>
            {error}
          </div>
        )}
      </div>

      {!loading && sortedComments.length === 0 && !error && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "28px 24px", background: "#f9fafb", ...T.meta, fontFamily: T.fontFamily, color: "#6b7280" }}>
          Be the first to comment on this post.
        </div>
      )}

      <div>
        {sortedComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onReply={addReply} onReact={handleReact} />
        ))}
      </div>
    </div>
  );
}
