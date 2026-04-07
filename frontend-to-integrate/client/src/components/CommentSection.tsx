import { useState, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  author: string;
  initials: string;
  avatarUrl?: string;
  verified?: boolean;
  content: string; // HTML string
  timestamp: string;
  timestampMs: number;
  likes: number;
  dislikes: number;
  userReaction: "like" | "dislike" | null;
  replies: Comment[];
}

// ─── Typography constants (matching blog post body) ───────────────────────────
// Blog post body: Helvetica 36px / 41px line-height
// We scale proportionally inside the 1920px transform container.
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

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SHARON_AVATAR =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/81-436_a928ba59.webp";

const INITIAL_COMMENTS: Comment[] = [
  {
    id: "1",
    author: "Floyd Miles",
    initials: "FM",
    content:
      "Actually, now that I try out the links on my message, above, none of them take me to the secure site. Only my shortcut on my desktop, which I created years ago.",
    timestamp: "6 hours ago",
    timestampMs: Date.now() - 6 * 60 * 60 * 1000,
    likes: 4,
    dislikes: 1,
    userReaction: null,
    replies: [],
  },
  {
    id: "2",
    author: "Albert Flores",
    initials: "AF",
    content:
      "Before installing this plugin please put back again your wordpress and site url back to http.",
    timestamp: "2 min ago",
    timestampMs: Date.now() - 2 * 60 * 1000,
    likes: 0,
    dislikes: 0,
    userReaction: null,
    replies: [
      {
        id: "2-1",
        author: "Sharon Danley",
        initials: "SD",
        avatarUrl: SHARON_AVATAR,
        verified: true,
        content:
          'Hi <span class="comment-mention">@Albert Flores</span> .Thanks for your reply.',
        timestamp: "18 sec ago",
        timestampMs: Date.now() - 18 * 1000,
        likes: 2,
        dislikes: 0,
        userReaction: null,
        replies: [],
      },
    ],
  },
  {
    id: "3",
    author: "Esther Howard",
    initials: "EH",
    content:
      "Thank you Sharon! This was incredibly helpful. I've been going gray for two years and your tips have given me so much confidence.",
    timestamp: "1 day ago",
    timestampMs: Date.now() - 24 * 60 * 60 * 1000,
    likes: 12,
    dislikes: 0,
    userReaction: null,
    replies: [],
  },
];

// ─── Thumb Icons ─────────────────────────────────────────────────────────────

function ThumbUpIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbDownIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

// ─── Reaction Pill ────────────────────────────────────────────────────────────

function ReactionPill({
  likes,
  dislikes,
  userReaction,
  onReact,
}: {
  likes: number;
  dislikes: number;
  userReaction: "like" | "dislike" | null;
  onReact: (r: "like" | "dislike") => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        border: "1px solid #d1d5db",
        borderRadius: 100,
        padding: "6px 16px",
        height: 52,
        userSelect: "none",
      }}
    >
      {/* Thumbs Up */}
      <button
        onClick={() => onReact("like")}
        title="Like"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: userReaction === "like" ? "#1d4ed8" : "#6b7280",
          transition: "color 0.15s, transform 0.1s",
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.15)";
          (e.currentTarget as HTMLElement).style.color = "#1d4ed8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.color =
            userReaction === "like" ? "#1d4ed8" : "#6b7280";
        }}
      >
        <ThumbUpIcon size={28} />
      </button>

      {/* Like count — always rendered, 0 when empty */}
      <span
        style={{
          ...T.meta,
          fontFamily: T.fontFamily,
          color: userReaction === "like" ? "#1d4ed8" : "#374151",
          fontWeight: userReaction === "like" ? 700 : 400,
          marginLeft: 8,
          minWidth: 20,
        }}
      >
        {likes}
      </span>

      {/* Divider */}
      <span
        style={{
          width: 1,
          height: 22,
          background: "#d1d5db",
          margin: "0 12px",
          display: "inline-block",
        }}
      />

      {/* Thumbs Down */}
      <button
        onClick={() => onReact("dislike")}
        title="Dislike"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: userReaction === "dislike" ? "#dc2626" : "#6b7280",
          transition: "color 0.15s, transform 0.1s",
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.15)";
          (e.currentTarget as HTMLElement).style.color = "#dc2626";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.color =
            userReaction === "dislike" ? "#dc2626" : "#6b7280";
        }}
      >
        <ThumbDownIcon size={28} />
      </button>

      {/* Dislike count — always rendered, 0 when empty */}
      <span
        style={{
          ...T.meta,
          fontFamily: T.fontFamily,
          color: userReaction === "dislike" ? "#dc2626" : "#374151",
          fontWeight: userReaction === "dislike" ? 700 : 400,
          marginLeft: 8,
          minWidth: 20,
        }}
      >
        {dislikes}
      </span>
    </div>
  );
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────

function RichTextEditor({
  placeholder,
  onSend,
  autoFocus = false,
  compact = false,
}: {
  placeholder: string;
  onSend: (html: string) => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: 10,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        autoFocus={autoFocus}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{
          minHeight: compact ? 80 : 120,
          padding: "18px 20px",
          outline: "none",
          ...T.body,
          fontFamily: T.fontFamily,
          color: "#111827",
        }}
        className="comment-editor"
      />
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderTop: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[
            { cmd: "bold",                label: "B",  extra: { fontWeight: 700 } },
            { cmd: "italic",              label: "I",  extra: { fontStyle: "italic" as const } },
            { cmd: "underline",           label: "U",  extra: { textDecoration: "underline" } },
            { cmd: "insertUnorderedList", label: "≡",  extra: {} },
          ].map(({ cmd, label, extra }) => (
            <button
              key={cmd}
              onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
              title={cmd}
              style={{
                width: 44,
                height: 44,
                border: "none",
                background: "transparent",
                borderRadius: 6,
                cursor: "pointer",
                ...T.toolbar,
                fontFamily: T.fontFamily,
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...extra,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "#e5e7eb")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "transparent")
              }
            >
              {label}
            </button>
          ))}
          {/* @ mention */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            title="Mention"
            style={{
              width: 44,
              height: 44,
              border: "none",
              background: "transparent",
              borderRadius: 6,
              cursor: "pointer",
              ...T.toolbar,
              fontFamily: T.fontFamily,
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 12,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "#e5e7eb")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            @
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={isEmpty}
          style={{
            padding: "10px 28px",
            borderRadius: 8,
            border: "none",
            background: isEmpty ? "#9ca3af" : "#374151",
            color: "#fff",
            ...T.sendBtn,
            fontFamily: T.fontFamily,
            cursor: isEmpty ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, string> = {
  FM: "#6b7280",
  AF: "#8b5cf6",
  EH: "#ec4899",
  SD: "#374151",
  YO: "#0ea5e9",
};

function Avatar({
  author,
  initials,
  avatarUrl,
  size = 56,
}: {
  author: string;
  initials: string;
  avatarUrl?: string;
  size?: number;
}) {
  const bg = AVATAR_COLORS[initials] ?? "#6b7280";

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={author}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: bg,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.36,
            fontWeight: 700,
            fontFamily: T.fontFamily,
          }}
        >
          {initials}
        </div>
      )}
      {/* No online/offline dot */}
    </div>
  );
}

// ─── Three-dot Menu ───────────────────────────────────────────────────────────

function ThreeDotMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#9ca3af",
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 26,
          lineHeight: 1,
          letterSpacing: "0.05em",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "#374151")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "#9ca3af")
        }
      >
        ···
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            zIndex: 20,
            minWidth: 180,
            overflow: "hidden",
          }}
        >
          {["Report", "Copy link", "Hide"].map((item) => (
            <button
              key={item}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 20px",
                background: "none",
                border: "none",
                textAlign: "left",
                ...T.menu,
                fontFamily: T.fontFamily,
                cursor: "pointer",
                color: "#374151",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "#f3f4f6")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "none")
              }
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single Comment ───────────────────────────────────────────────────────────

function CommentItem({
  comment,
  depth = 0,
  onReply,
  onReact,
}: {
  comment: Comment;
  depth?: number;
  onReply: (parentId: string, html: string) => void;
  onReact: (id: string, reaction: "like" | "dislike") => void;
}) {
  const [showReplyEditor, setShowReplyEditor] = useState(false);

  const handleReplySend = (html: string) => {
    onReply(comment.id, html);
    setShowReplyEditor(false);
  };

  const avatarSize = depth > 0 ? 48 : 56;

  return (
    <div style={{ marginLeft: depth > 0 ? avatarSize + 16 : 0 }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          paddingTop: 24,
          paddingBottom: 16,
        }}
      >
        <Avatar
          author={comment.author}
          initials={comment.initials}
          avatarUrl={comment.avatarUrl}
          size={avatarSize}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  ...T.author,
                  fontFamily: T.fontFamily,
                  color: "#111827",
                }}
              >
                {comment.author}
              </span>
              {comment.verified && (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#3b82f6" />
                  <path
                    d="M5 8l2 2 4-4"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <ThreeDotMenu />
          </div>

          {/* Content */}
          <div
            style={{
              ...T.body,
              fontFamily: T.fontFamily,
              color: "#111827",
              marginBottom: 14,
            }}
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {/* Action row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <ReactionPill
              likes={comment.likes}
              dislikes={comment.dislikes}
              userReaction={comment.userReaction}
              onReact={(r) => onReact(comment.id, r)}
            />

            <button
              onClick={() => setShowReplyEditor((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                ...T.meta,
                fontFamily: T.fontFamily,
                color: "#6b7280",
                padding: 0,
                fontWeight: 500,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#111827")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#6b7280")
              }
            >
              Reply
            </button>

            <span
              style={{
                ...T.meta,
                fontFamily: T.fontFamily,
                color: "#9ca3af",
                borderLeft: "1px solid #e5e7eb",
                paddingLeft: 20,
              }}
            >
              {comment.timestamp}
            </span>
          </div>

          {/* Reply editor */}
          {showReplyEditor && (
            <div style={{ marginTop: 16 }}>
              <RichTextEditor
                placeholder={`Reply to ${comment.author}...`}
                onSend={handleReplySend}
                autoFocus
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "#f3f4f6" }} />

      {/* Nested replies */}
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
          onReact={onReact}
        />
      ))}
    </div>
  );
}

// ─── Main CommentSection ──────────────────────────────────────────────────────

export function CommentSection() {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + c.replies.length,
    0
  );

  const sorted = [...comments].sort((a, b) => {
    if (sortBy === "latest") return b.timestampMs - a.timestampMs;
    return b.likes - b.dislikes - (a.likes - a.dislikes);
  });

  const addComment = (html: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: "You",
      initials: "YO",
      content: html,
      timestamp: "Just now",
      timestampMs: Date.now(),
      likes: 0,
      dislikes: 0,
      userReaction: null,
      replies: [],
    };
    setComments((prev) => [newComment, ...prev]);
  };

  const addReply = (parentId: string, html: string) => {
    const newReply: Comment = {
      id: `r-${Date.now()}`,
      author: "You",
      initials: "YO",
      content: html,
      timestamp: "Just now",
      timestampMs: Date.now(),
      likes: 0,
      dislikes: 0,
      userReaction: null,
      replies: [],
    };

    const updateReplies = (list: Comment[]): Comment[] =>
      list.map((c) => {
        if (c.id === parentId) return { ...c, replies: [...c.replies, newReply] };
        if (c.replies.length > 0) return { ...c, replies: updateReplies(c.replies) };
        return c;
      });

    setComments((prev) => updateReplies(prev));
  };

  const handleReact = (id: string, reaction: "like" | "dislike") => {
    const updateReaction = (list: Comment[]): Comment[] =>
      list.map((c) => {
        if (c.id === id) {
          const isSame = c.userReaction === reaction;
          const wasOpposite = c.userReaction !== null && c.userReaction !== reaction;
          return {
            ...c,
            userReaction: isSame ? null : reaction,
            likes:
              reaction === "like"
                ? isSame ? c.likes - 1 : c.likes + 1
                : wasOpposite ? c.likes - 1 : c.likes,
            dislikes:
              reaction === "dislike"
                ? isSame ? c.dislikes - 1 : c.dislikes + 1
                : wasOpposite ? c.dislikes - 1 : c.dislikes,
          };
        }
        if (c.replies.length > 0) return { ...c, replies: updateReaction(c.replies) };
        return c;
      });

    setComments((prev) => updateReaction(prev));
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 0 80px",
        fontFamily: T.fontFamily,
      }}
    >
      {/* Global styles */}
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

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ ...T.heading, fontFamily: T.fontFamily, color: "#111827" }}>
            Comments
          </span>
          <span style={{ ...T.body, fontFamily: T.fontFamily, color: "#6b7280", fontWeight: 400 }}>
            {totalCount}
          </span>
        </div>

        {/* Sort toggle */}
        <div
          style={{
            display: "flex",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {(["latest", "popular"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              style={{
                padding: "10px 26px",
                border: "none",
                background: sortBy === opt ? "#374151" : "#fff",
                color: sortBy === opt ? "#fff" : "#374151",
                ...T.sortBtn,
                fontFamily: T.fontFamily,
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* New comment editor */}
      <div style={{ marginBottom: 36 }}>
        <RichTextEditor placeholder="Hi @Sharon" onSend={addComment} />
      </div>

      {/* Comment list */}
      <div>
        {sorted.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={addReply}
            onReact={handleReact}
          />
        ))}
      </div>

      {/* Loading indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          paddingTop: 32,
          ...T.meta,
          fontFamily: T.fontFamily,
          color: "#9ca3af",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "cs-spin 1s linear infinite" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
        Loading
      </div>
    </div>
  );
}
