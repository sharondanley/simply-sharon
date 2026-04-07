import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CommentReaction = "like" | "dislike" | null;

interface Comment {
  id: number;
  parentId: number | null;
  author: string;
  initials: string;
  avatarUrl?: string;
  content: string;
  timestamp: string;
  timestampMs: number;
  likes: number;
  dislikes: number;
  userReaction: CommentReaction;
  replies: Comment[];
}

interface ApiComment {
  id: number;
  postId: number;
  parentId: number | null;
  authorName: string;
  authorEmail?: string | null;
  avatarUrl?: string | null;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: string;
}

const T = {
  fontFamily: "Helvetica, Arial, sans-serif",
  body: { fontSize: "36px", lineHeight: "46px" },
  author: { fontSize: "32px", lineHeight: "40px", fontWeight: 700 },
  meta: { fontSize: "28px", lineHeight: "36px" },
  heading: { fontSize: "44px", lineHeight: "54px", fontWeight: 700 },
  toolbar: { fontSize: "30px", lineHeight: "1" },
  sendBtn: { fontSize: "28px", lineHeight: "36px", fontWeight: 600 },
  sortBtn: { fontSize: "26px", lineHeight: "32px", fontWeight: 500 },
  menu: { fontSize: "28px", lineHeight: "36px" },
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
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "GU";
}

function normalizeComments(rows: ApiComment[]): Comment[] {
  const byId = new Map<number, Comment>();
  rows.forEach((row) => {
    const ts = new Date(row.createdAt).getTime();
    byId.set(row.id, {
      id: row.id,
      parentId: row.parentId,
      author: row.authorName,
      initials: initialsFromName(row.authorName),
      avatarUrl: row.avatarUrl || undefined,
      content: row.content,
      timestamp: toRelativeTime(row.createdAt),
      timestampMs: ts,
      likes: row.likes || 0,
      dislikes: row.dislikes || 0,
      userReaction: null,
      replies: [],
    });
  });

  const roots: Comment[] = [];
  byId.forEach((comment) => {
    if (comment.parentId && byId.has(comment.parentId)) {
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

function ThumbUpIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbDownIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

function ReactionPill({ likes, dislikes, userReaction, onReact }: { likes: number; dislikes: number; userReaction: CommentReaction; onReact: (r: "like" | "dislike") => void; }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 0, border: "1px solid #d1d5db", borderRadius: 100, padding: "6px 16px", height: 52, userSelect: "none" }}>
      <button
        onClick={() => onReact("like")}
        title="Like"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: userReaction === "like" ? "#1d4ed8" : "#6b7280", transition: "color 0.15s, transform 0.1s", lineHeight: 1 }}
      >
        <ThumbUpIcon size={28} />
      </button>
      <span style={{ ...T.meta, fontFamily: T.fontFamily, color: userReaction === "like" ? "#1d4ed8" : "#374151", fontWeight: userReaction === "like" ? 700 : 400, marginLeft: 8, minWidth: 20 }}>
        {likes}
      </span>
      <span style={{ width: 1, height: 22, background: "#d1d5db", margin: "0 12px", display: "inline-block" }} />
      <button
        onClick={() => onReact("dislike")}
        title="Dislike"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: userReaction === "dislike" ? "#dc2626" : "#6b7280", transition: "color 0.15s, transform 0.1s", lineHeight: 1 }}
      >
        <ThumbDownIcon size={28} />
      </button>
      <span style={{ ...T.meta, fontFamily: T.fontFamily, color: userReaction === "dislike" ? "#dc2626" : "#374151", fontWeight: userReaction === "dislike" ? 700 : 400, marginLeft: 8, minWidth: 20 }}>
        {dislikes}
      </span>
    </div>
  );
}

function RichTextEditor({ placeholder, onSend, autoFocus = false, compact = false }: { placeholder: string; onSend: (html: string) => void; autoFocus?: boolean; compact?: boolean; }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const execCmd = useCallback((cmd: string) => {
    document.execCommand(cmd, false, undefined);
    editorRef.current?.focus();
  }, []);

  const handleInput = () => {
    const text = editorRef.current?.innerText ?? "";
    setIsEmpty(text.trim().length === 0);
  };

  const handleSend = () => {
    const html = editorRef.current?.innerHTML ?? "";
    const text = editorRef.current?.innerText ?? "";
    if (!text.trim()) return;
    onSend(html);
    if (editorRef.current) editorRef.current.innerHTML = "";
    setIsEmpty(true);
  };

  return (
    <div style={{ border: "1px solid #d1d5db", borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        autoFocus={autoFocus}
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight: compact ? 80 : 120, padding: "18px 20px", outline: "none", ...T.body, fontFamily: T.fontFamily, color: "#111827" }}
        className="comment-editor"
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[
            { cmd: "bold", label: "B", extra: { fontWeight: 700 } },
            { cmd: "italic", label: "I", extra: { fontStyle: "italic" as const } },
            { cmd: "underline", label: "U", extra: { textDecoration: "underline" } },
            { cmd: "insertUnorderedList", label: "≡", extra: {} },
          ].map(({ cmd, label, extra }) => (
            <button
              key={cmd}
              onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
              title={cmd}
              style={{ width: 44, height: 44, border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", ...T.toolbar, fontFamily: T.fontFamily, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", ...extra }}
            >
              {label}
            </button>
          ))}
          <button
            onMouseDown={(e) => e.preventDefault()}
            title="Mention"
            style={{ width: 44, height: 44, border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", ...T.toolbar, fontFamily: T.fontFamily, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 12 }}
          >
            @
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={isEmpty}
          style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: isEmpty ? "#9ca3af" : "#374151", color: "#fff", ...T.sendBtn, fontFamily: T.fontFamily, cursor: isEmpty ? "not-allowed" : "pointer", transition: "background 0.15s" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const AVATAR_COLORS: Record<string, string> = { FM: "#6b7280", AF: "#8b5cf6", EH: "#ec4899", SD: "#374151", YO: "#0ea5e9", GU: "#4b5563" };

function Avatar({ author, initials, avatarUrl, size = 56 }: { author: string; initials: string; avatarUrl?: string; size?: number; }) {
  const bg = AVATAR_COLORS[initials] ?? "#6b7280";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={author} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, fontFamily: T.fontFamily }}>
          {initials}
        </div>
      )}
    </div>
  );
}

function ThreeDotMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px 10px", borderRadius: 6, fontSize: 26, lineHeight: 1, letterSpacing: "0.05em" }}>
        ···
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", zIndex: 20, minWidth: 180, overflow: "hidden" }}>
          {["Report", "Copy link", "Hide"].map((item) => (
            <button key={item} onClick={() => setOpen(false)} style={{ display: "block", width: "100%", padding: "12px 20px", background: "none", border: "none", textAlign: "left", ...T.menu, fontFamily: T.fontFamily, cursor: "pointer", color: "#374151" }}>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, depth = 0, onReply, onReact }: { comment: Comment; depth?: number; onReply: (parentId: number, html: string) => void; onReact: (id: number, reaction: "like" | "dislike") => void; }) {
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const handleReplySend = (html: string) => {
    onReply(comment.id, html);
    setShowReplyEditor(false);
  };
  const avatarSize = depth > 0 ? 48 : 56;

  return (
    <div style={{ marginLeft: depth > 0 ? avatarSize + 16 : 0 }}>
      <div style={{ display: "flex", gap: 16, paddingTop: 24, paddingBottom: 16 }}>
        <Avatar author={comment.author} initials={comment.initials} avatarUrl={comment.avatarUrl} size={avatarSize} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...T.author, fontFamily: T.fontFamily, color: "#111827" }}>{comment.author}</span>
            </div>
            <ThreeDotMenu />
          </div>

          <div style={{ ...T.body, fontFamily: T.fontFamily, color: "#111827", marginBottom: 14 }} dangerouslySetInnerHTML={{ __html: comment.content }} />

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ReactionPill likes={comment.likes} dislikes={comment.dislikes} userReaction={comment.userReaction} onReact={(r) => onReact(comment.id, r)} />
            <button onClick={() => setShowReplyEditor((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", ...T.meta, fontFamily: T.fontFamily, color: "#6b7280", padding: 0, fontWeight: 500 }}>
              Reply
            </button>
            <span style={{ ...T.meta, fontFamily: T.fontFamily, color: "#9ca3af", borderLeft: "1px solid #e5e7eb", paddingLeft: 20 }}>{comment.timestamp}</span>
          </div>

          {showReplyEditor && (
            <div style={{ marginTop: 16 }}>
              <RichTextEditor placeholder={`Reply to ${comment.author}...`} onSend={handleReplySend} autoFocus compact />
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/blogcast/comments?postId=${postId}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to load comments");
      setComments(normalizeComments(data.items || []));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const totalCount = useMemo(() => {
    const count = (list: Comment[]): number => list.reduce((acc, c) => acc + 1 + count(c.replies), 0);
    return count(comments);
  }, [comments]);

  const sorted = useMemo(() => {
    const top = [...comments];
    if (sortBy === "latest") {
      top.sort((a, b) => b.timestampMs - a.timestampMs);
    } else {
      top.sort((a, b) => b.likes - b.dislikes - (a.likes - a.dislikes));
    }
    return top;
  }, [comments, sortBy]);

  const postComment = async (html: string, parentId: number | null = null) => {
    if (!postId) return;
    const r = await fetch("/api/blogcast/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, parentId, authorName: "You", content: html }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Failed to post comment");
    await loadComments();
  };

  const addComment = async (html: string) => {
    try {
      await postComment(html, null);
    } catch {
      // keep UI stable on failure
    }
  };

  const addReply = async (parentId: number, html: string) => {
    try {
      await postComment(html, parentId);
    } catch {
      // keep UI stable on failure
    }
  };

  const handleReact = async (id: number, reaction: "like" | "dislike") => {
    const updateReaction = (list: Comment[]): Comment[] =>
      list.map((c) => {
        if (c.id === id) {
          const isSame = c.userReaction === reaction;
          const wasOpposite = c.userReaction !== null && c.userReaction !== reaction;
          return {
            ...c,
            userReaction: isSame ? null : reaction,
            likes: reaction === "like" ? (isSame ? c.likes - 1 : c.likes + 1) : wasOpposite ? c.likes - 1 : c.likes,
            dislikes: reaction === "dislike" ? (isSame ? c.dislikes - 1 : c.dislikes + 1) : wasOpposite ? c.dislikes - 1 : c.dislikes,
          };
        }
        if (c.replies.length > 0) return { ...c, replies: updateReaction(c.replies) };
        return c;
      });

    setComments((prev) => updateReaction(prev));
    await fetch(`/api/blogcast/comments/${id}/reaction`, {
      method: "PATCH",
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
          {(["latest", "popular"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              style={{ padding: "10px 26px", border: "none", background: sortBy === opt ? "#374151" : "#fff", color: sortBy === opt ? "#fff" : "#374151", ...T.sortBtn, fontFamily: T.fontFamily, cursor: "pointer", transition: "background 0.15s, color 0.15s" }}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 36 }}>
        <RichTextEditor placeholder="Hi @Sharon" onSend={addComment} />
      </div>

      <div>
        {sorted.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onReply={addReply} onReact={handleReact} />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 32, ...T.meta, fontFamily: T.fontFamily, color: "#9ca3af" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? "cs-spin 1s linear infinite" : "none" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
        {loading ? "Loading" : "Loaded"}
      </div>
    </div>
  );
}