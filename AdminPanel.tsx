/**
 * Admin Dashboard — Isolated UI
 *
 * Self-contained. Only needs:
 *   react · sonner · lucide-react · tailwindcss
 *
 * ── CONNECTING YOUR BACKEND ──────────────────────────────────────────────────
 * Implement the functions inside the `API` object below.
 * Every function should throw an Error with a message on failure.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, GripVertical, Image, Type, Quote, Video,
  Bold, Italic, Underline, Hash, Eye, EyeOff, Save, ArrowLeft, Upload,
  FileText, Settings, LogOut, X, Heading1, Heading2, Heading3, Moon, Sun, SplitSquareHorizontal, Pencil, MessageSquare, ExternalLink, Search,
} from "lucide-react";

// ─── Domain types ─────────────────────────────────────────────────────────────

type AuthUser = {
  name: string;
  email: string | null;
  role: string;
};

type PostItem = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  topic?: string | null;
  readUrl?: string | null;
  listenUrl?: string | null;
  watchUrl?: string | null;
  showReadButton?: boolean;
  showListenButton?: boolean;
  showWatchButton?: boolean;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

type CreatePostInput = {
  title: string;
  summary?: string;
  topic?: string;
  readUrl?: string;
  listenUrl?: string;
  watchUrl?: string;
  showReadButton: boolean;
  showListenButton: boolean;
  showWatchButton: boolean;
  hashtags: string[];
  blocks: Block[];
  thumbnailUrl?: string;
  published: boolean;
};

type PostDetail = PostItem & {
  summary?: string | null;
  hashtags: string[];
  blocks: Block[];
  published: boolean;
  authorName?: string | null;
};

type GridCellContentType = "paragraph" | "image" | "thumbnail";

type GridLayout = "1x3" | "3x3";

type GridCell = {
  id: string;
  contentType: GridCellContentType;
  content?: string;
  url?: string;
  caption?: string;
};

type PostActionKey = "read" | "listen" | "watch";

type CommentItem = {
  id: number;
  postId: number;
  parentId: number | null;
  authorName: string;
  content: string;
  createdAt: string;
  likesCount?: number;
  heartsCount?: number;
  isVerifiedAuthor?: number;
  status?: string;
  postTitle: string;
  postSlug: string;
};

type DashboardStats = {
  total: number;
  published: number;
  drafts: number;
  commentsTotal?: number;
  commentsByPost?: Array<{ postId: number; postTitle: string; postSlug: string; commentsCount: number }>;
};

type AdminPersonalization = {
  displayName: string;
  role: string;
  profilePhotoUrl: string;
  inspirationQuote: string;
  inspirationQuoteAuthor: string;
  inspirationImageUrl: string;
};

const DEFAULT_PERSONALIZATION: AdminPersonalization = {
  displayName: "Sharon Danley",
  role: "Master Beauty Mentor",
  profilePhotoUrl: "",
  inspirationQuote: "Style is a way to say who you are without having to speak.",
  inspirationQuoteAuthor: "Ralph Waldo Emerson",
  inspirationImageUrl: "",
};

// ─── API stubs — replace each body with your actual backend call ──────────────

const API = {
  /** Sign in using the user's email as the username. */
  async login(username: string, password: string): Promise<AuthUser> {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Invalid credentials");
    return data;
  },

  /** Sign out. */
  async logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  },

  /**
   * Return the current session user, or null when unauthenticated.
   * Called once on mount to restore an existing session.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const r = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!r.ok) return null;
    return r.json();
  },

  /** Return all posts (published + drafts) for the admin list. */
  async listPosts(
    page: number,
    limit: number,
    search = "",
    status: "all" | "published" | "draft" = "all",
    date = "",
    sort = ""
  ): Promise<{ items: PostItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (date.trim()) params.set("date", date.trim());
    if (sort.trim()) params.set("sort", sort.trim());
    const r = await fetch(`/api/admin/posts?${params}`, {
      credentials: "same-origin",
    });
    if (!r.ok) throw new Error("Failed to load posts");
    return r.json();
  },

  /** Create a new post. */
  async createPost(data: CreatePostInput): Promise<{ slug: string }> {
    const r = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(data),
    });
    const result = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(result.error || "Failed to save post");
    return result;
  },

  /** Load a single post into the editor. */
  async getPost(id: number): Promise<PostDetail> {
    const r = await fetch(`/api/admin/posts/${id}`, {
      credentials: "same-origin",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Failed to load post");
    return data;
  },

  /** Update an existing post. */
  async updatePost(id: number, data: CreatePostInput): Promise<{ slug: string }> {
    const r = await fetch(`/api/admin/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(data),
    });
    const result = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(result.error || "Failed to update post");
    return result;
  },

  /** Hard-delete a post (soft-delete in DB). */
  async deletePost(id: number): Promise<void> {
    const r = await fetch(`/api/admin/posts/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete post");
    }
  },

  /** Remove a post from public view (set to draft) without deleting it. */
  async unlistPost(id: number): Promise<void> {
    const r = await fetch(`/api/admin/posts/${id}/unlist`, {
      method: "PATCH",
      credentials: "same-origin",
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error || "Failed to unlist post");
    }
  },

  /** Return post counts for the dashboard. */
  async getStats(): Promise<DashboardStats> {
    const r = await fetch("/api/admin/stats", { credentials: "same-origin" });
    if (!r.ok) throw new Error("Failed to load stats");
    return r.json();
  },

  async listComments(): Promise<{ items: CommentItem[] }> {
    const r = await fetch("/api/admin/comments", { credentials: "same-origin" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string }).error || "Failed to load comments");
    return data as { items: CommentItem[] };
  },

  async approveComment(id: number): Promise<void> {
    const r = await fetch(`/api/admin/comments/${id}/approve`, {
      method: "PATCH",
      credentials: "same-origin",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string }).error || "Failed to approve comment");
  },

  async deleteComment(id: number): Promise<void> {
    const r = await fetch(`/api/admin/comments/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string }).error || "Failed to delete comment");
  },

  /**
   * Upload a thumbnail.
   * `dataBase64` is the raw base64 string (no data-URI prefix).
   * Return the public URL of the stored image.
   */
  async uploadThumbnail(
    dataBase64: string,
    contentType: string,
    filename: string
  ): Promise<{ url: string }> {
    const r = await fetch("/api/admin/upload/thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ dataBase64, contentType, filename }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Upload failed");
    return data;
  },

  async getPersonalization(): Promise<AdminPersonalization> {
    const r = await fetch("/api/admin/personalization", { credentials: "same-origin" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string }).error || "Failed to load personalization");
    return { ...DEFAULT_PERSONALIZATION, ...(data as Partial<AdminPersonalization>) };
  },

  async updatePersonalization(payload: AdminPersonalization): Promise<AdminPersonalization> {
    const r = await fetch("/api/admin/personalization", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string }).error || "Failed to save personalization");
    return { ...DEFAULT_PERSONALIZATION, ...(data as Partial<AdminPersonalization>) };
  },
};

async function uploadImageFile(file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string | undefined;
      const encoded = result?.split(",")[1];
      if (!encoded) {
        reject(new Error("Failed to read file"));
        return;
      }
      resolve(encoded);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const uploaded = await API.uploadThumbnail(base64, file.type, file.name);
  return uploaded.url;
}

// ─── Dark-mode hook ───────────────────────────────────────────────────────────

function useAdminDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem("admin-dark-mode") === "true"; } catch { return false; }
  });
  const toggle = () => setDark((d) => {
    const next = !d;
    try { localStorage.setItem("admin-dark-mode", String(next)); } catch {}
    return next;
  });
  return { dark, toggle };
}

function useAdminTextScale() {
  const [scale, setScale] = useState<number>(() => {
    try {
      const stored = Number(localStorage.getItem("admin-text-scale") || "1");
      return Number.isFinite(stored) && stored >= 0.95 && stored <= 1.2 ? stored : 1;
    } catch {
      return 1;
    }
  });

  const adjust = (direction: "down" | "up") => {
    setScale((current) => {
      const next = direction === "up"
        ? Math.min(1.2, Number((current + 0.05).toFixed(2)))
        : Math.max(0.95, Number((current - 0.05).toFixed(2)));
      try { localStorage.setItem("admin-text-scale", String(next)); } catch {}
      return next;
    });
  };

  const reset = () => {
    try { localStorage.setItem("admin-text-scale", "1"); } catch {}
    setScale(1);
  };

  return { scale, adjust, reset };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function extractYouTubeVideoId(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getYouTubeThumbnailUrl(rawUrl: string) {
  const videoId = extractYouTubeVideoId(rawUrl);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

function getYouTubeEmbedUrl(rawUrl: string) {
  const videoId = extractYouTubeVideoId(rawUrl);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : rawUrl.trim() || null;
}

function normalizeThumbnailUrl(rawUrl: string) {
  return getYouTubeThumbnailUrl(rawUrl) || rawUrl.trim();
}

// ─── Block types ──────────────────────────────────────────────────────────────

type BlockType = "paragraph" | "heading" | "quote" | "image" | "video" | "divider" | "customGrid";

type Block = {
  id: string;
  type: BlockType;
  content?: string;
  url?: string;
  caption?: string;
  layout?: GridLayout;
  cells?: GridCell[];
};

const GRID_LAYOUT_OPTIONS: Array<{ value: GridLayout; label: string }> = [
  { value: "1x3", label: "1 × 3" },
  { value: "3x3", label: "3 × 3" },
];

function generateId() {
  return Math.random().toString(36).slice(2);
}

function getGridColumnCount(layout: GridLayout) {
  return layout === "3x3" ? 3 : 3;
}

function getGridCellCount(layout: GridLayout) {
  return layout === "3x3" ? 9 : 3;
}

function ensureGridCells(layout: GridLayout, cells?: GridCell[]) {
  const count = getGridCellCount(layout);
  return Array.from({ length: count }, (_, index) => {
    const existing = cells?.[index];
    return {
      id: existing?.id || generateId(),
      contentType: existing?.contentType || "paragraph",
      content: existing?.content || "",
      url: existing?.url || "",
      caption: existing?.caption || "",
    } satisfies GridCell;
  });
}

function createBlock(type: BlockType): Block {
  if (type === "customGrid") {
    return {
      id: generateId(),
      type,
      layout: "1x3",
      cells: ensureGridCells("1x3"),
    };
  }

  return { id: generateId(), type };
}

// ─── Rich-text toolbar ────────────────────────────────────────────────────────

function RichTextToolbar({
  editorRef,
  dark,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  dark: boolean;
}) {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    const block = document.queryCommandValue("formatBlock");
    if (block) formats.add(block.toLowerCase());
    setActiveFormats(formats);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    updateActiveFormats();
  };

  const ToolBtn = ({
    cmd, value, title, children, active,
  }: {
    cmd: string; value?: string; title: string;
    children: React.ReactNode; active?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, value); }}
      title={title}
      className={`p-2 rounded text-base transition-colors ${
        active
          ? dark ? "bg-white text-black" : "bg-black text-white"
          : dark
            ? "text-gray-300 hover:bg-gray-600 hover:text-white"
            : "text-gray-700 hover:bg-gray-200 hover:text-black"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className={`flex items-center gap-0.5 px-3 py-2 border-b flex-wrap ${dark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-200"}`}>
      <ToolBtn cmd="bold" title="Bold (Ctrl+B)" active={activeFormats.has("bold")}><Bold size={16} /></ToolBtn>
      <ToolBtn cmd="italic" title="Italic (Ctrl+I)" active={activeFormats.has("italic")}><Italic size={16} /></ToolBtn>
      <ToolBtn cmd="underline" title="Underline (Ctrl+U)" active={activeFormats.has("underline")}><Underline size={16} /></ToolBtn>
      <div className={`w-px h-6 mx-1 ${dark ? "bg-gray-500" : "bg-gray-300"}`} />
      <ToolBtn cmd="formatBlock" value="h1" title="Heading 1" active={activeFormats.has("h1")}><Heading1 size={16} /></ToolBtn>
      <ToolBtn cmd="formatBlock" value="h2" title="Heading 2" active={activeFormats.has("h2")}><Heading2 size={16} /></ToolBtn>
      <ToolBtn cmd="formatBlock" value="h3" title="Heading 3" active={activeFormats.has("h3")}><Heading3 size={16} /></ToolBtn>
      <ToolBtn cmd="formatBlock" value="p" title="Normal text" active={activeFormats.has("p")}><Type size={16} /></ToolBtn>
      <div className={`w-px h-6 mx-1 ${dark ? "bg-gray-500" : "bg-gray-300"}`} />
      <ToolBtn cmd="insertUnorderedList" title="Bullet list"><span className="text-sm font-bold leading-none">••</span></ToolBtn>
      <ToolBtn cmd="insertOrderedList" title="Numbered list"><span className="text-sm font-bold leading-none">1.</span></ToolBtn>
      <div className={`w-px h-6 mx-1 ${dark ? "bg-gray-500" : "bg-gray-300"}`} />
      <ToolBtn cmd="justifyLeft" title="Align left"><span className="text-sm leading-none">≡</span></ToolBtn>
      <ToolBtn cmd="justifyCenter" title="Align center"><span className="text-sm leading-none">≡</span></ToolBtn>
      <ToolBtn cmd="justifyRight" title="Align right"><span className="text-sm leading-none">≡</span></ToolBtn>
      <div className={`w-px h-6 mx-1 ${dark ? "bg-gray-500" : "bg-gray-300"}`} />
      <ToolBtn cmd="removeFormat" title="Clear formatting"><span className="text-sm font-bold leading-none">Tx</span></ToolBtn>
    </div>
  );
}

// ─── Rich-text block editor ───────────────────────────────────────────────────

function RichTextBlock({
  block,
  onChange,
  dark,
}: {
  block: Block;
  onChange: (updated: Block) => void;
  dark: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== (block.content || "")) {
        editorRef.current.innerHTML = block.content || "";
      }
    }
    isInternalUpdate.current = false;
  }, [block.content]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange({ ...block, content: editorRef.current.innerHTML });
    }
  };

  const blockStyles: Record<string, string> = {
    paragraph: "text-lg leading-relaxed",
    heading: "text-3xl font-bold leading-tight",
    quote: "text-xl italic border-l-4 pl-4",
  };

  const placeholders: Record<string, string> = {
    paragraph: "Start writing...",
    heading: "Heading text...",
    quote: "Quote text...",
  };

  const borderColor = dark ? "border-gray-600 focus-within:border-gray-400" : "border-gray-200 focus-within:border-black";
  const quoteColor = dark ? "border-gray-400 text-gray-300" : "border-gray-500 text-gray-700";
  const textColor = dark ? "text-gray-100" : "text-gray-900";
  const placeholderColor = dark ? "empty:before:text-gray-500" : "empty:before:text-gray-400";

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${borderColor}`}>
      {focused && <RichTextToolbar editorRef={editorRef} dark={dark} />}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        data-placeholder={placeholders[block.type] || "Write here..."}
        className={`min-h-[100px] px-4 py-3 outline-none font-['Source_Sans_3'] ${blockStyles[block.type] || "text-lg"} ${textColor} ${block.type === "quote" ? quoteColor : ""} ${placeholderColor} empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none`}
      />
    </div>
  );
}

// ─── Block editor ─────────────────────────────────────────────────────────────

function BlockIcon({ type }: { type: BlockType }) {
  const icons: Record<BlockType, React.ReactNode> = {
    paragraph: <Type size={15} />,
    heading: <Hash size={15} />,
    quote: <Quote size={15} />,
    image: <Image size={15} />,
    video: <Video size={15} />,
    divider: <span className="text-sm font-bold">—</span>,
    customGrid: <SplitSquareHorizontal size={15} />,
  };
  return <>{icons[type]}</>;
}

function BlockEditor({
  block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast, dark,
}: {
  block: Block; onChange: (updated: Block) => void; onDelete: () => void;
  onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean; dark: boolean;
}) {
  const inputClass = `w-full px-4 py-3 border rounded-lg text-base font-['Source_Sans_3'] focus:outline-none focus:ring-2 transition-colors ${
    dark
      ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-gray-400"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-black"
  }`;
  const helperClass = `text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-gray-500" : "text-gray-400"}`;
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const gridFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingCellId, setUploadingCellId] = useState<string | null>(null);

  const handleBlockImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageFile(file);
      onChange({ ...block, url });
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGridCellUpload = async (cellId: string, file?: File) => {
    if (!file) return;
    setUploadingCellId(cellId);
    try {
      const url = await uploadImageFile(file);
      onChange({
        ...block,
        cells: ensureGridCells(block.layout || "1x3", block.cells).map((cell) => cell.id === cellId ? { ...cell, url } : cell),
      });
      toast.success("Grid image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingCellId(null);
    }
  };

  const renderInput = () => {
    if (block.type === "divider") {
      return <div className={`w-full h-0.5 rounded my-3 ${dark ? "bg-gray-600" : "bg-gray-300"}`} />;
    }
    if (block.type === "image" || block.type === "video") {
      return (
        <div className="flex flex-col gap-3">
          {block.type === "image" && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold font-['Source_Sans_3'] transition-colors ${dark ? "border-gray-500 text-gray-200 hover:border-white hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"}`}
                >
                  <Upload size={16} /> {uploadingImage ? "Uploading..." : "Upload from device"}
                </button>
                <span className={helperClass}>or paste an image URL</span>
              </div>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleBlockImageUpload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </>
          )}
          <input
            type="text"
            value={block.url || ""}
            onChange={(e) => onChange({ ...block, url: block.type === "video" ? (getYouTubeEmbedUrl(e.target.value) || e.target.value) : e.target.value })}
            placeholder={block.type === "image" ? "Image URL..." : "YouTube URL or embed URL..."}
            className={inputClass}
          />
          <input
            type="text"
            value={block.caption || ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputClass}
          />
          {block.type === "image" && block.url && (
            <img src={block.url} alt={block.caption || ""} className="max-h-56 object-cover rounded-lg" />
          )}
          {block.type === "video" && block.url && (
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <iframe src={getYouTubeEmbedUrl(block.url) || block.url} className="w-full h-full" allowFullScreen title="Video preview" />
            </div>
          )}
        </div>
      );
    }
    if (block.type === "quote") {
      return (
        <div className="flex flex-col gap-3">
          <RichTextBlock block={block} onChange={onChange} dark={dark} />
          <label className="block">
            <span className={`block text-sm font-semibold mb-2 ${dark ? "text-gray-300" : "text-gray-700"}`}>Author Name</span>
            <input
              type="text"
              value={block.caption || ""}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
              placeholder="— Author Name"
              className={inputClass}
            />
          </label>
        </div>
      );
    }
    if (block.type === "customGrid") {
      const layout = block.layout || "1x3";
      const cells = ensureGridCells(layout, block.cells);
      const columns = getGridColumnCount(layout);
      return (
        <div className="flex flex-col gap-4">
          <div>
            <span className={`block text-sm font-semibold mb-2 ${dark ? "text-gray-300" : "text-gray-700"}`}>Grid Layout</span>
            <select
              value={layout}
              onChange={(e) => {
                const nextLayout = e.target.value as GridLayout;
                onChange({ ...block, layout: nextLayout, cells: ensureGridCells(nextLayout, cells) });
              }}
              className={inputClass}
            >
              {GRID_LAYOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {cells.map((cell, index) => (
              <div key={cell.id} className={`rounded-2xl border p-4 flex flex-col gap-3 ${dark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-bold font-['Source_Sans_3'] ${dark ? "text-gray-200" : "text-gray-800"}`}>Cell {index + 1}</span>
                  <select
                    value={cell.contentType}
                    onChange={(e) => onChange({
                      ...block,
                      cells: cells.map((existing) => existing.id === cell.id ? { ...existing, contentType: e.target.value as GridCellContentType, content: existing.content || "", url: existing.url || "", caption: existing.caption || "" } : existing),
                    })}
                    className={`px-3 py-2 border rounded-lg text-sm font-['Source_Sans_3'] ${dark ? "border-gray-500 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                  >
                    <option value="paragraph">Paragraph</option>
                    <option value="image">Image</option>
                    <option value="thumbnail">Thumbnail</option>
                  </select>
                </div>

                {cell.contentType === "paragraph" ? (
                  <textarea
                    value={cell.content || ""}
                    onChange={(e) => onChange({ ...block, cells: cells.map((existing) => existing.id === cell.id ? { ...existing, content: e.target.value } : existing) })}
                    placeholder="Write paragraph content for this cell..."
                    rows={5}
                    className={inputClass + " resize-y"}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => gridFileInputRefs.current[cell.id]?.click()}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold font-['Source_Sans_3'] transition-colors ${dark ? "border-gray-500 text-gray-200 hover:border-white hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"}`}
                      >
                        <Upload size={16} /> {uploadingCellId === cell.id ? "Uploading..." : "Upload image"}
                      </button>
                      <span className={helperClass}>or paste an image URL</span>
                    </div>
                    <input
                      ref={(node) => { gridFileInputRefs.current[cell.id] = node; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void handleGridCellUpload(cell.id, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <input
                      type="text"
                      value={cell.url || ""}
                      onChange={(e) => onChange({ ...block, cells: cells.map((existing) => existing.id === cell.id ? { ...existing, url: e.target.value } : existing) })}
                      placeholder="Image URL..."
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={cell.caption || ""}
                      onChange={(e) => onChange({ ...block, cells: cells.map((existing) => existing.id === cell.id ? { ...existing, caption: e.target.value } : existing) })}
                      placeholder={cell.contentType === "thumbnail" ? "Thumbnail label (optional)" : "Caption (optional)"}
                      className={inputClass}
                    />
                    {cell.url ? <img src={cell.url} alt={cell.caption || ""} className={`w-full rounded-xl object-cover ${cell.contentType === "thumbnail" ? "h-28" : "max-h-56"}`} /> : null}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <RichTextBlock block={block} onChange={onChange} dark={dark} />;
  };

  const hoverBg = dark ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const badgeBg = dark ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600";
  const arrowColor = dark ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-black";
  const gripColor = dark ? "text-gray-600" : "text-gray-300";
  const deleteColor = dark ? "text-gray-600 hover:text-red-400" : "text-gray-300 hover:text-red-500";

  return (
    <div className={`group relative flex gap-3 items-start p-3 rounded-xl transition-all ${hoverBg}`}>
      <div className="flex flex-col items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onMoveUp} disabled={isFirst} className={`p-1 disabled:opacity-20 transition-colors ${arrowColor}`} title="Move up">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 10V4M4 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <GripVertical size={18} className={`cursor-grab ${gripColor}`} />
        <button onClick={onMoveDown} disabled={isLast} className={`p-1 disabled:opacity-20 transition-colors ${arrowColor}`} title="Move down">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 4v6M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div className={`shrink-0 mt-2 w-7 h-7 rounded flex items-center justify-center ${badgeBg}`}>
        <BlockIcon type={block.type} />
      </div>
      <div className="flex-1 min-w-0">{renderInput()}</div>
      <button onClick={onDelete} className={`shrink-0 mt-2 p-1.5 opacity-0 group-hover:opacity-100 transition-all ${deleteColor}`} title="Delete block">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// ─── Add-block menu ───────────────────────────────────────────────────────────

function AddBlockMenu({ onAdd, dark }: { onAdd: (type: BlockType) => void; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const blockTypes: { type: BlockType; label: string; icon: React.ReactNode }[] = [
    { type: "paragraph", label: "Paragraph", icon: <Type size={18} /> },
    { type: "heading", label: "Heading", icon: <Hash size={18} /> },
    { type: "quote", label: "Quote", icon: <Quote size={18} /> },
    { type: "image", label: "Image", icon: <Image size={18} /> },
    { type: "video", label: "Video", icon: <Video size={18} /> },
    { type: "customGrid", label: "Custom Grid", icon: <SplitSquareHorizontal size={18} /> },
    { type: "divider", label: "Divider", icon: <span className="font-bold text-base">—</span> },
  ];

  const btnClass = dark
    ? "border-gray-600 text-gray-400 hover:border-gray-300 hover:text-white"
    : "border-gray-300 text-gray-500 hover:border-black hover:text-black";
  const menuClass = dark ? "bg-gray-800 border-gray-600 shadow-xl" : "bg-white border-gray-200 shadow-lg";
  const itemClass = dark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700";

  return (
    <div className="relative mt-2">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl transition-colors w-full justify-center font-['Source_Sans_3'] text-base ${btnClass}`}
      >
        <Plus size={18} /> Add Block
      </button>
      {open && (
        <div className={`absolute top-full left-0 mt-1 border rounded-xl p-2 z-10 grid grid-cols-3 gap-1 w-64 ${menuClass}`}>
          {blockTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => { onAdd(type); setOpen(false); }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors text-sm font-['Source_Sans_3'] ${itemClass}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post-preview panel ───────────────────────────────────────────────────────

function PostPreview({
  title, thumbnailUrl, blocks, dark,
}: {
  title: string; thumbnailUrl: string; blocks: Block[]; dark: boolean;
}) {
  const panelBg = dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  const titleColor = dark ? "text-white" : "text-gray-900";
  const subColor = dark ? "text-gray-300" : "text-gray-600";
  const bodyColor = dark ? "text-gray-200" : "text-gray-800";
  const dividerColor = dark ? "border-gray-700" : "border-gray-200";

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case "heading":
        return (
          <h2
            key={block.id}
            className={`text-3xl font-bold font-['Source_Sans_3'] leading-tight mb-4 ${titleColor}`}
            dangerouslySetInnerHTML={{ __html: block.content || "<em>Heading</em>" }}
          />
        );
      case "quote":
        return (
          <div key={block.id} className={`my-5 rounded-[28px] px-8 py-10 text-center ${dark ? "bg-gray-800" : "bg-gray-200"}`}>
            <blockquote
              className={`text-2xl font-bold leading-relaxed font-['Source_Sans_3'] ${dark ? "text-white" : "text-black"}`}
              dangerouslySetInnerHTML={{ __html: block.content || "<em>Quote</em>" }}
            />
            {block.caption && (
              <div className={`mt-5 pr-4 text-right text-3xl leading-none font-['Italianno'] ${dark ? "text-gray-200" : "text-gray-800"}`}>
                {block.caption}
              </div>
            )}
          </div>
        );
      case "customGrid": {
        const layout = block.layout || "1x3";
        const cells = ensureGridCells(layout, block.cells);
        const columns = getGridColumnCount(layout);
        return (
          <div key={block.id} className="my-6 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {cells.map((cell) => (
              <div key={cell.id} className={`min-h-36 rounded-2xl border p-4 ${dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                {cell.contentType === "paragraph" && (
                  <div
                    className={`text-base leading-relaxed font-['Source_Sans_3'] ${bodyColor}`}
                    dangerouslySetInnerHTML={{ __html: cell.content || "<em>Paragraph cell</em>" }}
                  />
                )}
                {(cell.contentType === "image" || cell.contentType === "thumbnail") && cell.url ? (
                  <div className="flex h-full flex-col gap-2">
                    <img src={cell.url} alt={cell.caption || "Grid image"} className={`w-full rounded-xl object-cover ${cell.contentType === "thumbnail" ? "h-32" : "min-h-[180px] max-h-72"}`} />
                    {cell.caption ? <span className={`text-sm font-['Source_Sans_3'] ${subColor}`}>{cell.caption}</span> : null}
                  </div>
                ) : null}
                {(cell.contentType === "image" || cell.contentType === "thumbnail") && !cell.url ? (
                  <div className={`flex min-h-28 items-center justify-center rounded-xl ${dark ? "bg-gray-700 text-gray-500" : "bg-white text-gray-400"}`}>
                    <Image size={28} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        );
      }
      case "image":
        return block.url ? (
          <figure key={block.id} className="my-5">
            <img src={block.url} alt={block.caption || ""} className="w-full rounded-lg object-cover max-h-80" />
            {block.caption && <figcaption className={`text-sm text-center mt-2 font-['Source_Sans_3'] ${subColor}`}>{block.caption}</figcaption>}
          </figure>
        ) : (
          <div key={block.id} className={`w-full h-32 rounded-lg flex items-center justify-center my-5 ${dark ? "bg-gray-700 text-gray-500" : "bg-gray-100 text-gray-400"}`}>
            <Image size={32} />
          </div>
        );
      case "video":
        return block.url ? (
          <div key={block.id} className="aspect-video rounded-lg overflow-hidden my-5">
            <iframe src={getYouTubeEmbedUrl(block.url) || block.url} className="w-full h-full" allowFullScreen title="Video" />
          </div>
        ) : null;
      case "divider":
        return <hr key={block.id} className={`my-6 ${dividerColor}`} />;
      default:
        return (
          <div
            key={block.id}
            className={`text-lg leading-relaxed mb-4 font-['Source_Sans_3'] ${bodyColor}`}
            dangerouslySetInnerHTML={{ __html: block.content || "" }}
          />
        );
    }
  };

  return (
    <div className={`rounded-xl border p-6 h-full overflow-y-auto ${panelBg}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-4 font-['Source_Sans_3'] ${dark ? "text-gray-500" : "text-gray-400"}`}>
        Live Preview
      </p>
      {thumbnailUrl && (
        <img src={thumbnailUrl} alt="Thumbnail" className="w-full aspect-video object-cover rounded-lg mb-5" />
      )}
      <h1 className={`text-4xl font-bold font-['Source_Sans_3'] leading-tight mb-3 ${titleColor}`}>
        {title || <span className={dark ? "text-gray-600" : "text-gray-300"}>Post title will appear here…</span>}
      </h1>
      <div className={`border-t pt-5 ${dividerColor}`}>
        {blocks.map(renderBlock)}
        {blocks.length === 0 && (
          <p className={`text-base font-['Source_Sans_3'] ${dark ? "text-gray-600" : "text-gray-400"}`}>
            Add blocks on the left to see the preview here.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Post editor ──────────────────────────────────────────────────────────────

function PostEditor({
  postId,
  onBack,
  dark,
  onSaved,
}: {
  postId?: number;
  onBack: () => void;
  dark: boolean;
  onSaved?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [topic, setTopic] = useState("");
  const [readUrl, setReadUrl] = useState("");
  const [listenUrl, setListenUrl] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [showReadButton, setShowReadButton] = useState(true);
  const [showListenButton, setShowListenButton] = useState(true);
  const [showWatchButton, setShowWatchButton] = useState(true);
  const [hashtags, setHashtags] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([{ id: generateId(), type: "paragraph", content: "" }]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPost, setLoadingPost] = useState(Boolean(postId));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    API.listPosts(1, 100, "", "all", "", "category")
      .then((result) => {
        if (cancelled) return;
        const categories = Array.from(new Set((result.items || [])
          .map((item) => (item.topic || "").trim())
          .filter(Boolean)))
          .sort((a, b) => a.localeCompare(b));
        setCategoryOptions(categories);
      })
      .catch(() => {
        if (!cancelled) setCategoryOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!postId) {
      setLoadingPost(false);
      return;
    }

    let cancelled = false;
    setLoadingPost(true);

    API.getPost(postId)
      .then((post) => {
        if (cancelled) return;
        setTitle(post.title || "");
        setSummary(post.summary || "");
        setTopic(post.topic || "");
        setReadUrl(post.readUrl || "");
        setListenUrl(post.listenUrl || "");
        setWatchUrl(post.watchUrl || "");
        setShowReadButton(post.showReadButton !== false);
        setShowListenButton(post.showListenButton !== false);
        setShowWatchButton(post.showWatchButton !== false);
        setHashtags((post.hashtags || []).join(", "));
        setThumbnailUrl(post.thumbnailUrl || "");
        setThumbnailPreview(post.thumbnailUrl || "");
        setBlocks(post.blocks?.length ? post.blocks.map((block) => block.type === "customGrid" ? { ...block, layout: block.layout || "1x3", cells: ensureGridCells(block.layout || "1x3", block.cells) } : block) : [{ id: generateId(), type: "paragraph", content: "" }]);
        setPublished(Boolean(post.published));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to load post: ${msg}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingPost(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await API.uploadThumbnail(base64, file.type, file.name);
        setThumbnailUrl(result.url);
        setThumbnailPreview(result.url);
        toast.success("Thumbnail uploaded!");
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailUrlChange = (url: string) => {
    const normalized = normalizeThumbnailUrl(url);
    setThumbnailUrl(normalized);
    setThumbnailPreview(normalized);
  };
  const addBlock = (type: BlockType) => setBlocks((prev) => [...prev, createBlock(type)]);
  const updateBlock = (id: string, updated: Block) => setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  const deleteBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newBlocks = [...prev];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newBlocks.length) return prev;
      [newBlocks[idx], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[idx]];
      return newBlocks;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const hashtagArray = hashtags.split(",").map((h) => h.trim()).filter(Boolean);
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        topic: topic.trim() || undefined,
        readUrl: readUrl.trim() || undefined,
        listenUrl: listenUrl.trim() || undefined,
        watchUrl: watchUrl.trim() || undefined,
        showReadButton,
        showListenButton,
        showWatchButton,
        hashtags: hashtagArray,
        thumbnailUrl: thumbnailUrl || undefined,
        blocks,
        published,
      };
      if (postId) {
        await API.updatePost(postId, payload);
      } else {
        await API.createPost(payload);
      }
      toast.success(postId ? "Post updated successfully!" : "Post saved successfully!");
      onSaved?.();
      onBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to save: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-4 py-3 border rounded-lg text-base font-['Source_Sans_3'] focus:outline-none focus:ring-2 transition-colors ${
    dark
      ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-gray-400"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-black"
  }`;
  const labelClass = `text-sm font-semibold font-['Source_Sans_3'] block mb-1.5 ${dark ? "text-gray-300" : "text-gray-700"}`;
  const cardClass = `border rounded-xl p-5 flex flex-col gap-4 ${dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`;
  const cardTitleClass = `text-base font-bold font-['Source_Sans_3'] flex items-center gap-2 ${dark ? "text-gray-100" : "text-gray-900"}`;

  if (loadingPost) {
    return (
      <div className={`rounded-xl border p-10 flex items-center justify-center min-h-80 ${dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${dark ? "border-gray-300" : "border-black"}`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 transition-colors font-['Source_Sans_3'] text-base ${dark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"}`}
        >
          <ArrowLeft size={18} /> Back to Posts
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-base font-['Source_Sans_3'] transition-colors ${
              showPreview
                ? dark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                : dark ? "border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"
            }`}
          >
            <SplitSquareHorizontal size={18} />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <span className={`text-base font-['Source_Sans_3'] ${dark ? "text-gray-300" : "text-gray-700"}`}>Published</span>
            <div
              onClick={() => setPublished(!published)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${published ? dark ? "bg-white" : "bg-black" : dark ? "bg-gray-600" : "bg-gray-300"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${published ? "translate-x-7" : "translate-x-1"} ${published && dark ? "bg-black" : "bg-white"}`} />
            </div>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 text-base font-bold font-['Source_Sans_3'] rounded-lg disabled:opacity-50 transition-colors ${
              dark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            <Save size={18} />
            {saving ? (postId ? "Updating…" : "Saving…") : (postId ? "Update Post" : "Save Post")}
          </button>
        </div>
      </div>

      {/* Editor + optional preview */}
      <div className={`grid gap-6 ${showPreview ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"}`}>
        {/* Main editor */}
        <div className={`flex flex-col gap-5 ${showPreview ? "" : "lg:col-span-2"}`}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title…"
            className={`w-full px-4 py-3 text-4xl font-bold font-['Source_Sans_3'] border-b-2 focus:outline-none bg-transparent transition-colors ${
              dark ? "border-gray-600 text-white placeholder-gray-600 focus:border-gray-400" : "border-gray-200 text-gray-900 placeholder-gray-300 focus:border-black"
            }`}
          />

          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary for the archive listing…"
            rows={2}
            className={inputClass + " resize-none"}
          />
          <div className={`border rounded-xl p-4 flex flex-col min-h-80 ${dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
            <p className={`text-sm font-semibold font-['Source_Sans_3'] mb-3 ${dark ? "text-gray-400" : "text-gray-500"}`}>Content Blocks</p>
            {blocks.map((block, idx) => (
              <BlockEditor
                key={block.id}
                block={block}
                onChange={(updated) => updateBlock(block.id, updated)}
                onDelete={() => deleteBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, "up")}
                onMoveDown={() => moveBlock(block.id, "down")}
                isFirst={idx === 0}
                isLast={idx === blocks.length - 1}
                dark={dark}
              />
            ))}
            <AddBlockMenu onAdd={addBlock} dark={dark} />
          </div>
        </div>

        {/* Preview panel (when active) or Sidebar (when not) */}
        {showPreview ? (
          <PostPreview
            title={title}
            thumbnailUrl={thumbnailPreview}
            blocks={blocks}
            dark={dark}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {/* Thumbnail */}
            <div className={cardClass}>
              <h3 className={cardTitleClass}><Image size={16} /> Thumbnail</h3>
              {thumbnailPreview ? (
                <div className="relative">
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full aspect-video object-cover rounded-lg" />
                  <button
                    onClick={() => { setThumbnailUrl(""); setThumbnailPreview(""); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full aspect-video rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    dark ? "bg-gray-700 hover:bg-gray-600 text-gray-400" : "bg-gray-100 hover:bg-gray-200 text-gray-400"
                  }`}
                >
                  {uploading
                    ? <div className={`w-7 h-7 border-2 border-t-transparent rounded-full animate-spin ${dark ? "border-gray-300" : "border-black"}`} />
                    : <><Upload size={24} /><span className="text-sm font-['Source_Sans_3']">Click to upload</span></>
                  }
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => handleThumbnailUrlChange(e.target.value)}
                placeholder="Or paste image URL or YouTube link…"
                className={inputClass}
              />
            </div>

            {/* Metadata */}
            <div className={cardClass}>
              <h3 className={cardTitleClass}><Settings size={16} /> Post Settings</h3>
              <div className="relative">
                <label className={labelClass}>Topic / Category</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setCategoryMenuOpen(true);
                  }}
                  onFocus={() => setCategoryMenuOpen(true)}
                  onBlur={() => window.setTimeout(() => setCategoryMenuOpen(false), 120)}
                  placeholder="Search existing categories or type a new one"
                  className={inputClass}
                />
                {categoryMenuOpen && (
                  <div className={`absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border ${dark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"}`}>
                    {categoryOptions.filter((category) => {
                      const query = topic.trim().toLowerCase();
                      return !query || category.toLowerCase().includes(query);
                    }).slice(0, 8).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setTopic(category);
                          setCategoryMenuOpen(false);
                        }}
                        className={`block w-full px-4 py-3 text-left text-base font-['Source_Sans_3'] transition-colors ${dark ? "text-gray-100 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-50"}`}
                      >
                        {category}
                      </button>
                    ))}
                    {topic.trim() && !categoryOptions.some((category) => category.toLowerCase() === topic.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setTopic(topic.trim());
                          setCategoryMenuOpen(false);
                        }}
                        className={`block w-full border-t px-4 py-3 text-left text-base font-['Source_Sans_3'] transition-colors ${dark ? "border-gray-700 text-gray-300 hover:bg-gray-700" : "border-gray-100 text-gray-700 hover:bg-gray-50"}`}
                      >
                        Create "{topic.trim()}"
                      </button>
                    )}
                    {!categoryOptions.filter((category) => {
                      const query = topic.trim().toLowerCase();
                      return !query || category.toLowerCase().includes(query);
                    }).length && !topic.trim() && (
                      <div className={`px-4 py-3 text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-500"}`}>
                        No saved categories yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {([
                {
                  key: "read" as PostActionKey,
                  label: "Read",
                  value: readUrl,
                  setValue: setReadUrl,
                  visible: showReadButton,
                  setVisible: setShowReadButton,
                  placeholder: "Leave blank to use the article page",
                },
                {
                  key: "listen" as PostActionKey,
                  label: "Listen",
                  value: listenUrl,
                  setValue: setListenUrl,
                  visible: showListenButton,
                  setVisible: setShowListenButton,
                  placeholder: "Paste an audio, podcast, or playlist URL",
                },
                {
                  key: "watch" as PostActionKey,
                  label: "Watch",
                  value: watchUrl,
                  setValue: setWatchUrl,
                  visible: showWatchButton,
                  setVisible: setShowWatchButton,
                  placeholder: "Paste a video URL",
                },
              ]).map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <label className={labelClass} style={{ marginBottom: 0 }}>{field.label}</label>
                    <button
                      type="button"
                      onClick={() => field.setVisible((current: boolean) => !current)}
                      title={field.visible ? `Hide ${field.label} button` : `Show ${field.label} button`}
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${dark ? "border-gray-600 text-gray-300 hover:border-white hover:text-white" : "border-gray-300 text-gray-600 hover:border-black hover:text-black"}`}
                    >
                      {field.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
              <div>
                <label className={labelClass}>Hashtags (comma-separated)</label>
                <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#GrayHair, #BeautyTips" className={inputClass} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteDialog({
  postTitle,
  onCancel,
  onUnlist,
  onDelete,
  dark,
}: {
  postTitle: string;
  onCancel: () => void;
  onUnlist: () => void;
  onDelete: () => void;
  dark: boolean;
}) {
  const panelBg = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const titleColor = dark ? "text-gray-100" : "text-gray-900";
  const subColor = dark ? "text-gray-400" : "text-gray-500";
  const cancelColor = dark
    ? "text-gray-400 hover:text-white"
    : "text-gray-500 hover:text-black";
  const unlistColor = dark
    ? "border-gray-500 text-gray-200 hover:border-white hover:text-white"
    : "border-gray-300 text-gray-700 hover:border-black hover:text-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className={`rounded-2xl border p-8 shadow-2xl w-full max-w-md mx-4 ${panelBg}`}>
        <h3 className={`text-xl font-bold font-['Source_Sans_3'] mb-2 ${titleColor}`}>
          Remove Post
        </h3>
        <p className={`text-base font-['Source_Sans_3'] font-semibold mb-1 truncate ${titleColor}`}>
          "{postTitle}"
        </p>
        <p className={`text-sm font-['Source_Sans_3'] mb-6 ${subColor}`}>
          Unlisting hides the post from the public but keeps it as a draft you can re-publish later.
          Deleting permanently removes it.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onUnlist}
            className={`w-full py-3 rounded-lg text-base font-bold font-['Source_Sans_3'] border-2 transition-colors ${unlistColor}`}
          >
            Unlist (keep as draft)
          </button>
          <button
            onClick={onDelete}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base font-bold font-['Source_Sans_3'] transition-colors"
          >
            Delete Permanently
          </button>
          <button
            onClick={onCancel}
            className={`w-full py-2 text-base font-['Source_Sans_3'] transition-colors ${cancelColor}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Posts list ───────────────────────────────────────────────────────────────

function PostsList({
  onEdit,
  dark,
  refreshKey,
}: {
  onEdit: (id: number) => void;
  onNew: () => void;
  dark: boolean;
  refreshKey?: number;
}) {
  const PAGE_SIZE = 10;
  const [data, setData] = useState<{ items: PostItem[]; total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortFilter, setSortFilter] = useState<"recent" | "category">("recent");
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await API.listPosts(page, PAGE_SIZE, search, statusFilter, dateFilter, sortFilter === "category" ? "category" : "");
      setData(result);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, dateFilter, sortFilter]);

  useEffect(() => {
    const tid = window.setTimeout(() => {
      void loadPosts();
    }, 200);
    return () => window.clearTimeout(tid);
  }, [loadPosts, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFilter, sortFilter]);

  const confirmPost = confirmId !== null
    ? data?.items.find((p) => p.id === confirmId) ?? null
    : null;

  const handleUnlist = async () => {
    if (confirmId === null) return;
    const id = confirmId;
    setConfirmId(null);
    try {
      await API.unlistPost(id);
      await loadPosts();
      toast.success("Post unlisted (saved as draft)");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to unlist: ${msg}`);
    }
  };

  const handleDelete = async () => {
    if (confirmId === null) return;
    const id = confirmId;
    setConfirmId(null);
    try {
      await API.deletePost(id);
      await loadPosts();
      toast.success("Post deleted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to delete: ${msg}`);
    }
  };

  const inputClass = `w-full px-4 py-2.5 border rounded-lg text-base font-['Source_Sans_3'] focus:outline-none focus:ring-2 transition-colors ${
    dark
      ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-gray-400"
      : "border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-black"
  }`;

  const buttonClass = dark
    ? "border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600"
    : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50";

  const totalPages = Math.max(1, data?.totalPages || 1);
  const hasFilters = Boolean(search.trim() || statusFilter !== "all" || dateFilter);

  return (
    <>
      {confirmPost && (
        <DeleteDialog
          postTitle={confirmPost.title}
          onCancel={() => setConfirmId(null)}
          onUnlist={handleUnlist}
          onDelete={handleDelete}
          dark={dark}
        />
      )}

      <div className="mb-5 grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_220px_220px_220px_auto] gap-3 items-center">
        <div className="relative">
          <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? "text-gray-400" : "text-gray-500"}`} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, topic, or tag…"
            className={`${inputClass} pl-11`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
          className={inputClass}
          aria-label="Filter posts by status"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={inputClass}
          aria-label="Filter posts by date"
        />

        <select
          value={sortFilter}
          onChange={(e) => setSortFilter(e.target.value as "recent" | "category")}
          className={inputClass}
          aria-label="Sort posts"
        >
          <option value="recent">Sort by newest</option>
          <option value="category">Sort by category</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatusFilter("all");
            setDateFilter("");
            setSortFilter("recent");
          }}
          className={`px-4 py-2.5 rounded-lg border text-sm font-bold font-['Source_Sans_3'] transition-colors ${buttonClass}`}
        >
          Clear Filters
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-20 rounded-xl animate-pulse ${dark ? "bg-gray-700" : "bg-gray-100"}`} />
          ))}
        </div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className={`text-center py-16 ${dark ? "text-gray-500" : "text-gray-400"}`}>
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-['Source_Sans_3'] text-lg">
            {hasFilters ? "No posts matched the current filters." : "No posts yet. Create your first post!"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {(data?.items ?? []).map((post) => {
              const displayDate = post.publishedAt || post.createdAt;
              return (
                <div
                  key={post.id}
                  className={`flex items-center gap-4 p-5 border rounded-xl hover:shadow-sm transition-shadow ${
                    dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}
                >
                  {post.thumbnailUrl && (
                    <img src={post.thumbnailUrl} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onEdit(post.id)}
                      className={`font-bold text-base font-['Source_Sans_3'] truncate text-left w-full hover:underline ${dark ? "text-gray-100" : "text-gray-900"}`}
                    >
                      {post.title}
                    </button>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {post.topic && <span className={`text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-600"}`}>{post.topic}</span>}
                      {post.episode && <span className={`text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-600"}`}>Ep. {post.episode}</span>}
                      {displayDate && (
                        <span className={`text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-600"}`}>
                          {new Date(displayDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className={`text-sm px-2.5 py-0.5 rounded-full font-['Source_Sans_3'] font-semibold ${
                        post.publishedAt
                          ? dark ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                          : dark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
                      }`}>
                        {post.publishedAt ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(post.id)}
                      className={`p-2.5 transition-colors ${dark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"}`}
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <a href={`/blogcast/${post.slug}`} target="_blank" rel="noreferrer">
                      <button className={`p-2.5 transition-colors ${dark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"}`} title="Preview">
                        <Eye size={18} />
                      </button>
                    </a>
                    <button
                      onClick={() => setConfirmId(post.id)}
                      className={`p-2.5 transition-colors ${dark ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className={`text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-600"}`}>
              Showing {data?.items.length || 0} of {data?.total || 0} posts
            </p>
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className={`px-3.5 py-2 rounded-lg border text-sm font-bold font-['Source_Sans_3'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((n) => Math.abs(n - page) <= 1 || n === 1 || n === totalPages)
                .map((n, index, arr) => (
                  <div key={n} className="flex items-center gap-2">
                    {index > 0 && arr[index - 1] !== n - 1 ? (
                      <span className={`px-1 text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>…</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPage(n)}
                      className={`w-10 h-10 rounded-full border text-sm font-bold font-['Source_Sans_3'] transition-colors ${
                        page === n
                          ? dark ? "bg-white text-black border-gray-400" : "bg-black text-white border-gray-400"
                          : buttonClass
                      }`}
                    >
                      {n}
                    </button>
                  </div>
                ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className={`px-3.5 py-2 rounded-lg border text-sm font-bold font-['Source_Sans_3'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function CommentsModerationTable({ dark, refreshKey, onChanged }: { dark: boolean; refreshKey?: number; onChanged?: () => void }) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(true);
    API.listComments()
      .then((data) => setItems(data.items || []))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load comments";
        toast.error(msg);
        setItems([]);
      })
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [item.authorName, stripHtml(item.content), item.postTitle].join(" ").toLowerCase().includes(q);
  });

  const parentAuthorById = new Map(items.map((item) => [item.id, item.authorName]));

  const approveComment = async (id: number) => {
    setPendingActionId(id);
    try {
      await API.approveComment(id);
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: "Posted" } : item));
      toast.success("Comment approved");
      onChanged?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve comment";
      toast.error(msg);
    } finally {
      setPendingActionId(null);
    }
  };

  const deleteComment = async (id: number) => {
    const next = window.confirm("Delete this comment permanently?");
    if (!next) return;
    setPendingActionId(id);
    try {
      await API.deleteComment(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Comment deleted");
      onChanged?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete comment";
      toast.error(msg);
    } finally {
      setPendingActionId(null);
    }
  };

  const inputClass = `w-full px-4 py-2.5 border rounded-lg text-base font-['Source_Sans_3'] focus:outline-none focus:ring-2 transition-colors ${
    dark
      ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-gray-400"
      : "border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-black"
  }`;

  const tableShell = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const tableHead = dark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700";
  const rowDivider = dark ? "border-gray-700" : "border-gray-200";
  const textMain = dark ? "text-gray-100" : "text-gray-900";
  const textMuted = dark ? "text-gray-400" : "text-gray-600";

  return (
    <div>
      <div className="mb-4 relative">
        <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? "text-gray-400" : "text-gray-500"}`} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search comments by author, content, or post..."
          className={`${inputClass} pl-11`}
        />
      </div>

      <div className={`rounded-xl border overflow-hidden ${tableShell}`}>
        <div className={`grid grid-cols-[220px_1.3fr_180px_1fr_200px] gap-4 px-5 py-3 text-sm font-bold font-['Source_Sans_3'] ${tableHead}`}>
          <div>Author</div>
          <div>Comment Thread</div>
          <div>Date</div>
          <div>Post Title</div>
          <div>Actions</div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-14 rounded-lg animate-pulse ${dark ? "bg-gray-700" : "bg-gray-100"}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={`p-10 text-center font-['Source_Sans_3'] ${textMuted}`}>
            No comments found.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className={`grid grid-cols-[220px_1.3fr_180px_1fr_200px] gap-4 px-5 py-4 border-t ${rowDivider}`}>
              <div className="min-w-0">
                <div className={`font-semibold font-['Source_Sans_3'] ${textMain}`}>{item.authorName}</div>
                <div className={`mt-1 text-sm font-['Source_Sans_3'] ${textMuted}`}>
                  {Number(item.isVerifiedAuthor || 0) > 0 ? "Verified author" : "Community member"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold font-['Source_Sans_3'] ${item.parentId ? (dark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700') : (dark ? 'bg-white/10 text-white' : 'bg-black text-white')}`}>
                    {item.parentId ? `Reply to ${parentAuthorById.get(item.parentId) || 'original comment'}` : 'Top-level comment'}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold font-['Source_Sans_3'] ${String(item.status || '').toLowerCase() === 'pending approval' ? (dark ? 'bg-amber-900/40 text-amber-200' : 'bg-amber-100 text-amber-800') : (dark ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-100 text-emerald-800')}`}>
                    {item.status || 'Posted'}
                  </span>
                  <span className={`text-xs font-['Source_Sans_3'] ${textMuted}`}>
                    Likes {Number(item.likesCount || 0)} · Hearts {Number(item.heartsCount || 0)}
                  </span>
                </div>
                <div className={`font-['Source_Sans_3'] ${textMain}`} style={{ paddingLeft: item.parentId ? '18px' : '0', borderLeft: item.parentId ? `3px solid ${dark ? '#4b5563' : '#d1d5db'}` : 'none' }}>
                  {stripHtml(item.content).slice(0, 220) || "(empty)"}
                </div>
              </div>
              <div className={`font-['Source_Sans_3'] ${textMuted}`}>{formatDateTime(item.createdAt)}</div>
              <div className={`font-['Source_Sans_3'] ${textMain}`}>{item.postTitle}</div>
              <div className="flex items-center gap-2 flex-wrap">
                {String(item.status || '').toLowerCase() === 'pending approval' && (
                  <button
                    onClick={() => { void approveComment(item.id); }}
                    disabled={pendingActionId === item.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded text-sm font-bold font-['Source_Sans_3'] border transition-colors disabled:opacity-60 ${
                      dark
                        ? "border-emerald-600 text-emerald-200 hover:bg-emerald-900/30"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <Eye size={14} /> {pendingActionId === item.id ? 'Working…' : 'Approve'}
                  </button>
                )}
                <a
                  href={`/blogcast/${item.postSlug}#comment-${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded text-sm font-bold font-['Source_Sans_3'] border transition-colors ${
                    dark
                      ? "border-gray-500 text-gray-200 hover:border-white hover:text-white"
                      : "border-gray-300 text-gray-700 hover:border-black hover:text-black"
                  }`}
                >
                  <ExternalLink size={14} /> View on Post
                </a>
                <button
                  onClick={() => { void deleteComment(item.id); }}
                  disabled={pendingActionId === item.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded text-sm font-bold font-['Source_Sans_3'] border transition-colors disabled:opacity-60 ${
                    dark
                      ? "border-red-700 text-red-300 hover:bg-red-900/30"
                      : "border-red-300 text-red-600 hover:bg-red-50"
                  }`}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function AdminLoginForm({ onLoginSuccess }: { onLoginSuccess: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const user = await API.login(username, password);
      onLoginSuccess(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setError(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-normal font-['Italianno'] text-black mb-2">Simply Sharon</h1>
          <p className="text-gray-600 text-base" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>Admin Dashboard</p>
        </div>
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
          <Settings size={30} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-black mb-6 text-center" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>Email or Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-black transition-colors"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
              placeholder="Enter email or username"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-black transition-colors"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-red-600 text-base text-center font-semibold" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 bg-black text-white text-base font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>
        {/* Replace href with your site's home URL */}
        <a href="/">
          <p className="mt-5 text-base text-gray-500 hover:text-black cursor-pointer transition-colors text-center" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
            ← Back to website
          </p>
        </a>
      </div>
    </div>
  );
}

// ─── Main admin page ──────────────────────────────────────────────────────────

type AdminView = "dashboard" | "posts" | "comments" | "preferences" | "new-post" | "edit-post";

export default function AdminPanel() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AdminView>("dashboard");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);
  const [personalization, setPersonalization] = useState<AdminPersonalization>(DEFAULT_PERSONALIZATION);
  const [savingPersonalization, setSavingPersonalization] = useState(false);
  const [uploadingPersonalizationImage, setUploadingPersonalizationImage] = useState<null | "profile" | "inspiration">(null);
  const { dark, toggle: toggleDark } = useAdminDarkMode();
  const { scale: textScale, adjust: adjustTextScale, reset: resetTextScale } = useAdminTextScale();

  useEffect(() => {
    API.getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    API.getStats()
      .then(setStats)
      .catch(() => {/* stats are non-critical; UI shows "—" on failure */});
  }, [postsRefreshKey]);

  useEffect(() => {
    if (!user) return;
    API.getPersonalization()
      .then((data) => setPersonalization({ ...DEFAULT_PERSONALIZATION, ...data }))
      .catch(() => {/* personalization falls back locally */});
  }, [user]);

  const savePersonalization = async () => {
    setSavingPersonalization(true);
    try {
      const saved = await API.updatePersonalization(personalization);
      setPersonalization(saved);
      toast.success("Personal preferences updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences.");
    } finally {
      setSavingPersonalization(false);
    }
  };

  const handlePersonalizationImageUpload = async (kind: "profile" | "inspiration", file?: File) => {
    if (!file) return;
    setUploadingPersonalizationImage(kind);
    try {
      const url = await uploadImageFile(file);
      setPersonalization((current) => ({
        ...current,
        profilePhotoUrl: kind === "profile" ? url : current.profilePhotoUrl,
        inspirationImageUrl: kind === "inspiration" ? url : current.inspirationImageUrl,
      }));
      toast.success(kind === "profile" ? "Profile photo uploaded." : "Banner image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingPersonalizationImage(null);
    }
  };

  const displayName = personalization.displayName?.trim() || user?.name || "Sharon Danley";
  const displayRole = personalization.role?.trim() || DEFAULT_PERSONALIZATION.role;
  const quoteAuthor = personalization.inspirationQuoteAuthor?.trim() || DEFAULT_PERSONALIZATION.inspirationQuoteAuthor;

  const logout = async () => {
    try { await API.logout(); } finally { setUser(null); }
  };

  const startNewPost = () => {
    setEditingPostId(null);
    setView("new-post");
  };

  const startEditingPost = (id: number) => {
    setEditingPostId(id);
    setView("edit-post");
  };

  const isAuthenticated = user !== null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLoginForm onLoginSuccess={setUser} />;

  const isAdmin = user.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <X size={30} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold font-['Source_Sans_3'] text-black mb-3">Access Denied</h2>
          <p className="text-gray-600 text-base font-['Source_Sans_3'] mb-6">You don't have admin privileges.</p>
          <p className="text-sm text-gray-500 font-['Source_Sans_3'] mb-5">Signed in as: {user.name || user.email}</p>
          <button onClick={logout} className="w-full py-3.5 border-2 border-gray-300 text-black font-bold font-['Source_Sans_3'] rounded-lg hover:bg-gray-50 transition-colors text-base">
            Sign Out
          </button>
          {/* Replace href with your site's home URL */}
          <a href="/"><p className="mt-5 text-base text-gray-500 hover:text-black cursor-pointer font-['Source_Sans_3'] transition-colors">← Back to website</p></a>
        </div>
      </div>
    );
  }

  // Dark-mode colour tokens
  const bg = dark ? "bg-gray-900" : "bg-gray-100";
  const sidebarBg = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const mainBg = dark ? "bg-gray-900" : "bg-gray-100";
  const textPrimary = dark ? "text-gray-100" : "text-gray-900";
  const textMuted = dark ? "text-gray-400" : "text-gray-600";
  const navActive = dark ? "bg-white text-black" : "bg-black text-white";
  const navInactive = dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100";
  const dividerColor = dark ? "border-gray-700" : "border-gray-100";
  const cardBg = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const statIconBg = dark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600";

  return (
    <div className={`admin-root min-h-screen ${bg} flex`} style={{ fontFamily: "Helvetica, Arial, sans-serif", zoom: textScale as unknown as number }}>
      <style>{`
        .admin-root, .admin-root * { font-family: Helvetica, Arial, sans-serif !important; }
        .admin-root .admin-script { font-family: Italianno, cursive !important; }
      `}</style>
      {/* Sidebar */}
      <aside className={`w-64 border-r shrink-0 self-start sticky top-0 h-screen flex flex-col overflow-hidden ${sidebarBg}`}>
        <div className={`p-6 border-b ${dividerColor}`}>
          <h1 className={`admin-script text-4xl font-normal ${textPrimary}`}>Simply Sharon</h1>
          <p className={`text-sm font-['Source_Sans_3'] mt-1 ${textMuted}`}>Admin Dashboard</p>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-1">
          {([
            { id: "dashboard" as AdminView, label: "Dashboard", icon: <Settings size={18} /> },
            { id: "posts" as AdminView, label: "All Posts", icon: <FileText size={18} /> },
            { id: "comments" as AdminView, label: "Comments", icon: <MessageSquare size={18} /> },
            { id: "new-post" as AdminView, label: "New Post", icon: <Plus size={18} /> },
          ] as const).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-['Source_Sans_3'] transition-colors text-left ${
                view === id ? navActive : navInactive
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t ${dividerColor}`}>
          <div className={`mb-3 rounded-xl border p-3 ${dark ? "border-gray-600 bg-gray-700/50" : "border-gray-200 bg-gray-50"}`}>
            <div className={`text-sm font-semibold mb-3 ${textPrimary}`}>Text Size</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustTextScale("down")}
                className={`flex-1 px-3 py-2.5 rounded-lg border text-lg font-bold transition-colors ${dark ? "border-gray-500 text-gray-100 hover:bg-gray-600" : "border-gray-300 text-gray-900 hover:bg-gray-100"}`}
                title="Decrease dashboard text size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => adjustTextScale("up")}
                className={`flex-1 px-3 py-2.5 rounded-lg border text-lg font-bold transition-colors ${dark ? "border-gray-500 text-gray-100 hover:bg-gray-600" : "border-gray-300 text-gray-900 hover:bg-gray-100"}`}
                title="Increase dashboard text size"
              >
                A+
              </button>
            </div>
            <button
              type="button"
              onClick={resetTextScale}
              className={`mt-2 w-full text-xs transition-colors ${textMuted}`}
              title="Reset dashboard text size"
            >
              Reset to default
            </button>
          </div>

          <button
            onClick={toggleDark}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base transition-colors mb-3 ${navInactive}`}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            onClick={() => setView("preferences")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base transition-colors mb-3 text-left ${view === "preferences" ? navActive : navInactive}`}
            title="Open personal preferences"
          >
            <Settings size={18} />
            Personal Preferences
          </button>

          {/* User info */}
          <div className={`flex items-center gap-3 mb-3 p-3 rounded-lg ${dark ? "bg-gray-700" : "bg-gray-50"}`}>
            <img
              src={personalization.profilePhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || "Sharon Danley")}`}
              alt={displayName}
              className="w-12 h-12 rounded-full shrink-0 object-cover"
            />
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${textPrimary}`}>{displayName}</p>
              <p className={`text-xs truncate ${textMuted}`}>{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Replace href with your site's home URL */}
            <a href="/" className="flex-1">
              <button className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm border rounded-lg transition-colors font-['Source_Sans_3'] ${
                dark ? "text-gray-400 hover:text-white border-gray-600 hover:border-gray-400" : "text-gray-600 hover:text-black border-gray-200 hover:border-gray-400"
              }`}>
                <Eye size={14} /> Site
              </button>
            </a>
            <button
              onClick={logout}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm border rounded-lg transition-colors font-['Source_Sans_3'] ${
                dark ? "text-gray-400 hover:text-red-400 border-gray-600 hover:border-red-700" : "text-gray-600 hover:text-red-500 border-gray-200 hover:border-red-300"
              }`}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 overflow-auto p-8 ${mainBg}`}>
        {view === "dashboard" && (
          <div>
            <h2 className={`text-3xl font-bold mb-2 ${textPrimary}`}>Welcome back, {displayName.split(" ")[0] || "Sharon"}</h2>
            <p className={`text-base mb-8 ${textMuted}`}>Here's an overview of your content.</p>
            <div className={`rounded-[28px] border overflow-hidden mb-8 ${cardBg}`}>
              <div className="relative h-[280px] md:h-[340px] lg:h-[380px]">
                {personalization.inspirationImageUrl ? (
                  <img
                    src={personalization.inspirationImageUrl}
                    alt="Dashboard banner"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className={`absolute inset-0 ${dark ? "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900" : "bg-gradient-to-br from-stone-200 via-white to-stone-300"}`} />
                )}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute left-8 right-8 bottom-8 flex items-end justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={personalization.profilePhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`}
                      alt={displayName}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-white/50 shadow-lg"
                    />
                    <div className="min-w-0">
                      <p className="text-white/80 text-sm uppercase tracking-[0.22em]">Dashboard</p>
                      <h3 className="text-white text-3xl md:text-4xl font-semibold truncate">{displayName}</h3>
                      <p className="text-white/80 text-sm md:text-base truncate">{displayRole}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setView("preferences")}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/90 text-black font-semibold hover:bg-white transition-colors"
                  >
                    <Settings size={16} /> Edit
                  </button>
                </div>
              </div>
              <div className={`px-8 py-5 border-t ${dark ? "border-gray-700 bg-gray-900/95" : "border-gray-200 bg-white"}`}>
                <p className={`text-[10px] uppercase tracking-[0.28em] mb-2 text-center ${textMuted}`}>Quote of the Week</p>
                <div className="flex flex-col items-center text-center gap-2">
                  <blockquote className={`max-w-3xl text-[1.1rem] md:text-[1.35rem] leading-[1.45] font-semibold ${textPrimary}`}>
                    “{personalization.inspirationQuote || DEFAULT_PERSONALIZATION.inspirationQuote}”
                  </blockquote>
                  <div className="admin-script text-[1.8rem] md:text-[2.2rem] leading-none text-black dark:text-white">
                    — {quoteAuthor}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              {[
                { label: "Total Posts", value: stats ? String(stats.total) : "—", icon: <FileText size={22} /> },
                { label: "Published", value: stats ? String(stats.published) : "—", icon: <Eye size={22} /> },
                { label: "Drafts", value: stats ? String(stats.drafts) : "—", icon: <EyeOff size={22} /> },
                { label: "Total Comments", value: stats ? String(stats.commentsTotal || 0) : "—", icon: <MessageSquare size={22} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className={`rounded-xl border p-6 flex items-center gap-4 ${cardBg}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statIconBg}`}>{icon}</div>
                  <div>
                    <p className={`text-3xl font-bold font-['Source_Sans_3'] ${textPrimary}`}>{value}</p>
                    <p className={`text-sm font-['Source_Sans_3'] mt-0.5 ${textMuted}`}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={`rounded-xl border p-6 mb-8 ${cardBg}`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-lg font-bold font-['Source_Sans_3'] ${textPrimary}`}>Recent Posts</h3>
                <button onClick={() => setView("posts")} className={`text-base font-['Source_Sans_3'] transition-colors ${textMuted}`}>
                  View all →
                </button>
              </div>
              <PostsList onEdit={startEditingPost} onNew={startNewPost} dark={dark} refreshKey={postsRefreshKey} />
            </div>
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-lg font-bold font-['Source_Sans_3'] ${textPrimary}`}>Top Posts by Comment Count</h3>
                <button onClick={() => setView("comments")} className={`text-base font-['Source_Sans_3'] transition-colors ${textMuted}`}>
                  Moderate comments →
                </button>
              </div>
              {(stats?.commentsByPost || []).length === 0 ? (
                <p className={`font-['Source_Sans_3'] ${textMuted}`}>No comment activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {(stats?.commentsByPost || []).map((item) => (
                    <div key={item.postId} className={`flex items-center justify-between p-4 rounded-lg border ${dark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
                      <a href={`/blogcast/${item.postSlug}`} target="_blank" rel="noreferrer" className={`font-bold font-['Source_Sans_3'] hover:underline ${textPrimary}`}>
                        {item.postTitle}
                      </a>
                      <span className={`text-sm px-2.5 py-1 rounded-full font-bold font-['Source_Sans_3'] ${dark ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-700"}`}>
                        {item.commentsCount} comments
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "posts" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-3xl font-bold font-['Source_Sans_3'] ${textPrimary}`}>All Posts</h2>
              <button
                onClick={startNewPost}
                className={`flex items-center gap-2 px-5 py-3 text-base font-bold font-['Source_Sans_3'] rounded-lg transition-colors ${
                  dark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                <Plus size={18} /> New Post
              </button>
            </div>
            <PostsList onEdit={startEditingPost} onNew={startNewPost} dark={dark} refreshKey={postsRefreshKey} />
          </div>
        )}

        {view === "comments" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-3xl font-bold font-['Source_Sans_3'] ${textPrimary}`}>Comments</h2>
              <button
                onClick={() => {
                  setCommentsRefreshKey((k) => k + 1);
                  setPostsRefreshKey((k) => k + 1);
                }}
                className={`flex items-center gap-2 px-5 py-3 text-base font-bold font-['Source_Sans_3'] rounded-lg transition-colors ${
                  dark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                Refresh
              </button>
            </div>
            <CommentsModerationTable dark={dark} refreshKey={commentsRefreshKey} onChanged={() => setPostsRefreshKey((k) => k + 1)} />
          </div>
        )}

        {view === "preferences" && (
          <div>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className={`text-3xl font-bold font-['Source_Sans_3'] ${textPrimary}`}>Personal Preferences</h2>
                <p className={`text-base mt-2 ${textMuted}`}>Manage Sharon Danley&apos;s profile, weekly quote, and dashboard banner.</p>
              </div>
              <button
                onClick={savePersonalization}
                disabled={savingPersonalization}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-colors ${dark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"} disabled:opacity-60`}
              >
                <Save size={16} /> {savingPersonalization ? "Saving…" : "Save Preferences"}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_420px] gap-6">
              <div className={`rounded-2xl border p-6 ${cardBg}`}>
                <div className="space-y-5">
                  <label className="block">
                    <span className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Profile Name</span>
                    <input
                      value={personalization.displayName}
                      onChange={(e) => setPersonalization((current) => ({ ...current, displayName: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border ${dark ? "bg-gray-900 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}
                      placeholder="Sharon Danley"
                    />
                  </label>

                  <label className="block">
                    <span className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Role</span>
                    <input
                      value={personalization.role}
                      onChange={(e) => setPersonalization((current) => ({ ...current, role: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border ${dark ? "bg-gray-900 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}
                      placeholder="Master Beauty Mentor"
                    />
                  </label>

                  <label className="block">
                    <span className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Quote of the Week</span>
                    <textarea
                      value={personalization.inspirationQuote}
                      onChange={(e) => setPersonalization((current) => ({ ...current, inspirationQuote: e.target.value }))}
                      className={`w-full min-h-[150px] px-4 py-3 rounded-xl border ${dark ? "bg-gray-900 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}
                      placeholder="Enter the weekly quote"
                    />
                  </label>

                  <div>
                    <span className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Banner Image</span>
                    <p className={`text-sm mb-4 ${textMuted}`}>Upload a banner image to feature at the top of the dashboard.</p>
                    <div className="flex flex-wrap gap-3">
                      <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${dark ? "border-gray-500 text-white hover:bg-gray-700" : "border-gray-300 text-black hover:bg-gray-100"}`}>
                        <Image size={16} />
                        {uploadingPersonalizationImage === "inspiration" ? "Uploading banner image…" : "Upload Banner Image"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePersonalizationImageUpload("inspiration", e.target.files?.[0])} />
                      </label>
                      {personalization.inspirationImageUrl && (
                        <button
                          type="button"
                          onClick={() => setPersonalization((current) => ({ ...current, inspirationImageUrl: "" }))}
                          className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${dark ? "border-gray-500 text-white hover:bg-gray-700" : "border-gray-300 text-black hover:bg-gray-100"}`}
                        >
                          <X size={16} /> Remove Banner
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Profile Photo</span>
                    <div className="flex flex-wrap gap-3">
                      <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${dark ? "border-gray-500 text-white hover:bg-gray-700" : "border-gray-300 text-black hover:bg-gray-100"}`}>
                        <Upload size={16} />
                        {uploadingPersonalizationImage === "profile" ? "Uploading profile photo…" : "Upload Profile Photo"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePersonalizationImageUpload("profile", e.target.files?.[0])} />
                      </label>
                      {personalization.profilePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setPersonalization((current) => ({ ...current, profilePhotoUrl: "" }))}
                          className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${dark ? "border-gray-500 text-white hover:bg-gray-700" : "border-gray-300 text-black hover:bg-gray-100"}`}
                        >
                          <X size={16} /> Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                <div className="relative h-56">
                  {personalization.inspirationImageUrl ? (
                    <img src={personalization.inspirationImageUrl} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className={`absolute inset-0 ${dark ? "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900" : "bg-gradient-to-br from-stone-200 via-white to-stone-300"}`} />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute left-5 bottom-5 flex items-center gap-3">
                    <img
                      src={personalization.profilePhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`}
                      alt={displayName}
                      className="w-14 h-14 rounded-xl object-cover border border-white/60"
                    />
                    <div>
                      <p className="text-white text-lg font-semibold">{displayName}</p>
                      <p className="text-white/80 text-sm">{displayRole}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className={`text-xs uppercase tracking-[0.22em] mb-2 text-center ${textMuted}`}>Quote of the Week</p>
                  <div className="flex flex-col items-center text-center gap-2">
                    <blockquote className={`text-lg leading-8 font-semibold ${textPrimary}`}>
                      “{personalization.inspirationQuote || DEFAULT_PERSONALIZATION.inspirationQuote}”
                    </blockquote>
                    <div className="admin-script text-3xl leading-none text-black dark:text-white">
                      — {quoteAuthor}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "new-post" && (
          <div>
            <h2 className={`text-3xl font-bold font-['Source_Sans_3'] mb-6 ${textPrimary}`}>New Post</h2>
            <PostEditor
              onBack={() => setView("posts")}
              dark={dark}
              onSaved={() => setPostsRefreshKey((k) => k + 1)}
            />
          </div>
        )}

        {view === "edit-post" && editingPostId !== null && (
          <div>
            <h2 className={`text-3xl font-bold font-['Source_Sans_3'] mb-6 ${textPrimary}`}>Edit Post</h2>
            <PostEditor
              postId={editingPostId}
              onBack={() => setView("posts")}
              dark={dark}
              onSaved={() => setPostsRefreshKey((k) => k + 1)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
