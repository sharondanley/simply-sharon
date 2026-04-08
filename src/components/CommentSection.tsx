import { useEffect, useMemo, useRef, useState } from "react";

interface ApiComment {
  id: number;
  postId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Comment {
  id: number;
  authorName: string;
  initials: string;
  content: string;
  timestamp: string;
  timestampMs: number;
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
  const timestamp = new Date(input).getTime();
  const diff = Math.max(1, Date.now() - timestamp);
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
  return rows
    .map((row) => {
      const timestampMs = new Date(row.createdAt).getTime();
      return {
        id: row.id,
        authorName: row.authorName,
        initials: initialsFromName(row.authorName),
        content: row.content,
        timestamp: toRelativeTime(row.createdAt),
        timestampMs,
      };
    })
    .sort((left, right) => left.timestampMs - right.timestampMs);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function Avatar({ authorName, initials, size = 56 }: { authorName: string; initials: string; size?: number }) {
  const avatarColors: Record<string, string> = {
    AF: "#8b5cf6",
    EH: "#ec4899",
    FM: "#6b7280",
    GU: "#4b5563",
    SD: "#374151",
    YO: "#0ea5e9",
  };

  return (
    <div
      aria-label={authorName}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatarColors[initials] ?? "#6b7280",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        fontFamily: T.fontFamily,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function RichTextEditor({
  disabled,
  onSend,
  placeholder,
}: {
  disabled?: boolean;
  onSend: (html: string) => Promise<void> | void;
  placeholder: string;
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

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      await handleSend();
    }
  };

  return (
    <div style={{ border: "1px solid #d1d5db", borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="comment-editor"
        style={{
          minHeight: 120,
          padding: "18px 20px",
          outline: "none",
          opacity: disabled ? 0.7 : 1,
          ...T.body,
          fontFamily: T.fontFamily,
          color: "#111827",
        }}
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
              style={{
                width: 44,
                height: 44,
                border: "none",
                background: "transparent",
                borderRadius: 6,
                cursor: disabled ? "not-allowed" : "pointer",
                ...T.toolbar,
                fontFamily: T.fontFamily,
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...extra,
              }}
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
          style={{
            padding: "10px 28px",
            borderRadius: 8,
            border: "none",
            background: disabled || isEmpty ? "#9ca3af" : "#374151",
            color: "#fff",
            ...T.sendBtn,
            fontFamily: T.fontFamily,
            cursor: disabled || isEmpty ? "not-allowed" : "pointer",
          }}
        >
          {disabled ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 16, paddingTop: 24, paddingBottom: 16 }}>
        <Avatar authorName={comment.authorName} initials={comment.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
            <span style={{ ...T.author, fontFamily: T.fontFamily, color: "#111827" }}>{comment.authorName}</span>
            <span style={{ ...T.meta, fontFamily: T.fontFamily, color: "#9ca3af", textAlign: "right" }}>{comment.timestamp}</span>
          </div>
          <div style={{ ...T.body, fontFamily: T.fontFamily, color: "#111827" }} dangerouslySetInnerHTML={{ __html: comment.content }} />
        </div>
      </div>
      <div style={{ height: 1, background: "#f3f4f6" }} />
    </div>
  );
}

export function CommentSection({ postId }: { postId?: number }) {
  const [authorName, setAuthorName] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedAuthorName = window.localStorage.getItem(AUTHOR_NAME_STORAGE_KEY);
    if (storedAuthorName) {
      setAuthorName(storedAuthorName);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!authorName.trim()) return;
    window.localStorage.setItem(AUTHOR_NAME_STORAGE_KEY, authorName.trim());
  }, [authorName]);

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

  const sortedComments = useMemo(() => {
    const nextComments = [...comments];
    nextComments.sort((left, right) => (
      sortBy === "latest"
        ? right.timestampMs - left.timestampMs
        : left.timestampMs - right.timestampMs
    ));
    return nextComments;
  }, [comments, sortBy]);

  const submitComment = async (html: string) => {
    if (!postId) {
      throw new Error("No post selected");
    }

    const trimmedAuthorName = authorName.trim();
    const plainText = stripHtml(html);

    if (!trimmedAuthorName) {
      setError("Your name is required before posting a comment.");
      throw new Error("Author name is required");
    }

    if (!plainText) {
      setError("Comment content is required.");
      throw new Error("Comment content is required");
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/blogcast/comments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: trimmedAuthorName,
          content: html,
          postId,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to save comment");
      }

      await loadComments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save comment");
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 80px", fontFamily: T.fontFamily }}>
      <style>{`
        .comment-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ ...T.heading, fontFamily: T.fontFamily, color: "#111827" }}>Comments</span>
          <span style={{ ...T.body, fontFamily: T.fontFamily, color: "#6b7280", fontWeight: 400 }}>{comments.length}</span>
        </div>

        <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: 10, overflow: "hidden" }}>
          {(["latest", "oldest"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSortBy(option)}
              style={{
                padding: "10px 26px",
                border: "none",
                background: sortBy === option ? "#374151" : "#fff",
                color: sortBy === option ? "#fff" : "#374151",
                ...T.sortBtn,
                fontFamily: T.fontFamily,
                cursor: "pointer",
              }}
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
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "16px 18px",
              ...T.inputText,
              fontFamily: T.fontFamily,
              color: "#111827",
              outline: "none",
            }}
          />
        </div>
        <RichTextEditor disabled={submitting} onSend={submitComment} placeholder="Add a comment" />
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
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 32, ...T.meta, fontFamily: T.fontFamily, color: "#9ca3af" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? "cs-spin 1s linear infinite" : "none" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
        {loading ? "Loading" : comments.length > 0 ? "Loaded" : "Ready"}
      </div>
    </div>
  );
}
