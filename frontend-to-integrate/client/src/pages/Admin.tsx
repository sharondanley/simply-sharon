/**
 * Simply Sharon - Admin Dashboard
 * Block-based post editor with drag-and-drop blocks, thumbnail management, and post management.
 * Only accessible to authenticated admin users.
 * Features: larger fonts, high-contrast colours, dark mode toggle, live post preview.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Trash2, GripVertical, Image, Type, Quote, Video,
  Bold, Italic, Underline, Hash, Eye, EyeOff, Save, ArrowLeft, Upload,
  FileText, Settings, LogOut, X, Heading1, Heading2, Heading3, Moon, Sun, SplitSquareHorizontal,
} from "lucide-react";

// ─── Dark mode hook ───────────────────────────────────────────────────────────
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

// ─── Block Types ──────────────────────────────────────────────────────────────
type BlockType = "paragraph" | "heading" | "quote" | "image" | "video" | "divider";

type Block = {
  id: string;
  type: BlockType;
  content?: string;
  url?: string;
  caption?: string;
};

function generateId() {
  return Math.random().toString(36).slice(2);
}

// ─── Rich Text Toolbar ────────────────────────────────────────────────────────
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

// ─── Rich Text Block Editor ────────────────────────────────────────────────────
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

// ─── Block Editor ──────────────────────────────────────────────────────────────
function BlockIcon({ type }: { type: BlockType }) {
  const icons: Record<BlockType, React.ReactNode> = {
    paragraph: <Type size={15} />,
    heading: <Hash size={15} />,
    quote: <Quote size={15} />,
    image: <Image size={15} />,
    video: <Video size={15} />,
    divider: <span className="text-sm font-bold">—</span>,
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

  const renderInput = () => {
    if (block.type === "divider") {
      return <div className={`w-full h-0.5 rounded my-3 ${dark ? "bg-gray-600" : "bg-gray-300"}`} />;
    }
    if (block.type === "image" || block.type === "video") {
      return (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={block.url || ""}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder={block.type === "image" ? "Image URL..." : "YouTube embed URL (https://www.youtube.com/embed/...)"}
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
              <iframe src={block.url} className="w-full h-full" allowFullScreen title="Video preview" />
            </div>
          )}
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
      {/* Move controls */}
      <div className="flex flex-col items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onMoveUp} disabled={isFirst} className={`p-1 disabled:opacity-20 transition-colors ${arrowColor}`} title="Move up">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 10V4M4 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <GripVertical size={18} className={`cursor-grab ${gripColor}`} />
        <button onClick={onMoveDown} disabled={isLast} className={`p-1 disabled:opacity-20 transition-colors ${arrowColor}`} title="Move down">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 4v6M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      {/* Block type badge */}
      <div className={`flex-shrink-0 mt-2 w-7 h-7 rounded flex items-center justify-center ${badgeBg}`}>
        <BlockIcon type={block.type} />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">{renderInput()}</div>
      {/* Delete */}
      <button onClick={onDelete} className={`flex-shrink-0 mt-2 p-1.5 opacity-0 group-hover:opacity-100 transition-all ${deleteColor}`} title="Delete block">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// ─── Add Block Menu ───────────────────────────────────────────────────────────
function AddBlockMenu({ onAdd, dark }: { onAdd: (type: BlockType) => void; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const blockTypes: { type: BlockType; label: string; icon: React.ReactNode }[] = [
    { type: "paragraph", label: "Paragraph", icon: <Type size={18} /> },
    { type: "heading", label: "Heading", icon: <Hash size={18} /> },
    { type: "quote", label: "Quote", icon: <Quote size={18} /> },
    { type: "image", label: "Image", icon: <Image size={18} /> },
    { type: "video", label: "Video", icon: <Video size={18} /> },
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

// ─── Post Preview Panel ───────────────────────────────────────────────────────
function PostPreview({
  title, subtitle, thumbnailUrl, blocks, dark,
}: {
  title: string; subtitle: string; thumbnailUrl: string; blocks: Block[]; dark: boolean;
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
          <blockquote
            key={block.id}
            className={`text-xl italic border-l-4 pl-5 my-5 font-['Source_Sans_3'] ${dark ? "border-gray-500 text-gray-300" : "border-gray-400 text-gray-700"}`}
            dangerouslySetInnerHTML={{ __html: block.content || "<em>Quote</em>" }}
          />
        );
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
            <iframe src={block.url} className="w-full h-full" allowFullScreen title="Video" />
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
      {subtitle && (
        <p className={`text-xl mb-5 font-['Source_Sans_3'] ${subColor}`}>{subtitle}</p>
      )}
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

// ─── Post Editor ──────────────────────────────────────────────────────────────
function PostEditor({ postId, onBack, dark }: { postId?: number; onBack: () => void; dark: boolean }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [topic, setTopic] = useState("");
  const [episode, setEpisode] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([{ id: generateId(), type: "paragraph", content: "" }]);
  const [published, setPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const createPost = trpc.admin.createPost.useMutation({
    onSuccess: () => {
      toast.success("Post saved successfully!");
      utils.admin.listPosts.invalidate();
      onBack();
    },
    onError: (err) => toast.error(`Failed to save: ${err.message}`),
  });

  const uploadThumbnail = trpc.admin.uploadThumbnail.useMutation({
    onSuccess: (data) => {
      setThumbnailUrl(data.url);
      setThumbnailPreview(data.url);
      setUploading(false);
      toast.success("Thumbnail uploaded!");
    },
    onError: () => { setUploading(false); toast.error("Upload failed. Please try again."); },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      uploadThumbnail.mutate({ dataBase64: base64, contentType: file.type, filename: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailUrlChange = (url: string) => { setThumbnailUrl(url); setThumbnailPreview(url); };
  const addBlock = (type: BlockType) => setBlocks((prev) => [...prev, { id: generateId(), type }]);
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

  const handleSave = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const hashtagArray = hashtags.split(",").map((h) => h.trim()).filter(Boolean);
    createPost.mutate({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      summary: summary.trim() || undefined,
      topic: topic.trim() || undefined,
      episode: episode ? parseInt(episode) : undefined,
      hashtags: hashtagArray,
      thumbnailUrl: thumbnailUrl || undefined,
      blocks,
      published,
    });
  };

  const inputClass = `w-full px-4 py-3 border rounded-lg text-base font-['Source_Sans_3'] focus:outline-none focus:ring-2 transition-colors ${
    dark
      ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-gray-400"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-black"
  }`;
  const labelClass = `text-sm font-semibold font-['Source_Sans_3'] block mb-1.5 ${dark ? "text-gray-300" : "text-gray-700"}`;
  const cardClass = `border rounded-xl p-5 flex flex-col gap-4 ${dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`;
  const cardTitleClass = `text-base font-bold font-['Source_Sans_3'] flex items-center gap-2 ${dark ? "text-gray-100" : "text-gray-900"}`;

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
          {/* Preview toggle */}
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
          {/* Published toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <span className={`text-base font-['Source_Sans_3'] ${dark ? "text-gray-300" : "text-gray-700"}`}>Published</span>
            <div
              onClick={() => setPublished(!published)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${published ? dark ? "bg-white" : "bg-black" : dark ? "bg-gray-600" : "bg-gray-300"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${published ? "translate-x-7" : "translate-x-1"} ${published && dark ? "bg-black" : "bg-white"}`} />
            </div>
          </label>
          {/* Save */}
          <button
            onClick={handleSave}
            disabled={createPost.isPending}
            className={`flex items-center gap-2 px-6 py-2.5 text-base font-bold font-['Source_Sans_3'] rounded-lg disabled:opacity-50 transition-colors ${
              dark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            <Save size={18} />
            {createPost.isPending ? "Saving…" : "Save Post"}
          </button>
        </div>
      </div>

      {/* Editor + optional preview */}
      <div className={`grid gap-6 ${showPreview ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"}`}>
        {/* Main editor */}
        <div className={`flex flex-col gap-5 ${showPreview ? "" : "lg:col-span-2"}`}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title…"
            className={`w-full px-4 py-3 text-4xl font-bold font-['Source_Sans_3'] border-b-2 focus:outline-none bg-transparent transition-colors ${
              dark ? "border-gray-600 text-white placeholder-gray-600 focus:border-gray-400" : "border-gray-200 text-gray-900 placeholder-gray-300 focus:border-black"
            }`}
          />
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtitle (optional)…"
            className={`w-full px-4 py-2 text-xl font-['Source_Sans_3'] border-b focus:outline-none bg-transparent transition-colors ${
              dark ? "border-gray-700 text-gray-300 placeholder-gray-600 focus:border-gray-500" : "border-gray-100 text-gray-700 placeholder-gray-300 focus:border-gray-300"
            }`}
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary for the archive listing…"
            rows={2}
            className={inputClass + " resize-none"}
          />

          {/* Blocks */}
          <div className={`border rounded-xl p-4 flex flex-col min-h-[320px] ${dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
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
            subtitle={subtitle}
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
                placeholder="Or paste image URL…"
                className={inputClass}
              />
            </div>

            {/* Metadata */}
            <div className={cardClass}>
              <h3 className={cardTitleClass}><Settings size={16} /> Post Settings</h3>
              <div>
                <label className={labelClass}>Topic / Category</label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Beauty, Poise, Mindset" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Episode #</label>
                <input type="number" value={episode} onChange={(e) => setEpisode(e.target.value)} placeholder="e.g. 5" min="1" className={inputClass} />
              </div>
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

// ─── Posts List ───────────────────────────────────────────────────────────────
function PostsList({ onEdit, dark }: { onEdit: (id: number) => void; onNew: () => void; dark: boolean }) {
  const { data, isLoading } = trpc.admin.listPosts.useQuery({ page: 1, limit: 50 });
  const utils = trpc.useUtils();
  const deletePost = trpc.admin.deletePost.useMutation({
    onSuccess: () => { utils.admin.listPosts.invalidate(); toast.success("Post deleted"); },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-20 rounded-xl animate-pulse ${dark ? "bg-gray-700" : "bg-gray-100"}`} />
        ))}
      </div>
    );
  }

  const posts = data?.items || [];

  if (posts.length === 0) {
    return (
      <div className={`text-center py-16 ${dark ? "text-gray-500" : "text-gray-400"}`}>
        <FileText size={48} className="mx-auto mb-4 opacity-30" />
        <p className="font-['Source_Sans_3'] text-lg">No posts yet. Create your first post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className={`flex items-center gap-4 p-5 border rounded-xl hover:shadow-sm transition-shadow ${
            dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          {post.thumbnailUrl && (
            <img src={post.thumbnailUrl} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-base font-['Source_Sans_3'] truncate ${dark ? "text-gray-100" : "text-gray-900"}`}>{post.title}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {post.topic && <span className={`text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-600"}`}>{post.topic}</span>}
              {post.episode && <span className={`text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-600"}`}>Ep. {post.episode}</span>}
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
            <Link href={`/blogcast/${post.slug}`}>
              <button className={`p-2.5 transition-colors ${dark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"}`} title="Preview">
                <Eye size={18} />
              </button>
            </Link>
            <button
              onClick={() => deletePost.mutate({ id: post.id })}
              className={`p-2.5 transition-colors ${dark ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Admin Login Form ─────────────────────────────────────────────────────────
function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); },
    onError: (err) => { setError(err.message || "Invalid credentials"); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-normal font-['Italianno'] text-black mb-2">Simply Sharon</h1>
          <p className="text-gray-600 font-['Source_Sans_3'] text-base">Admin Dashboard</p>
        </div>
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
          <Settings size={30} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold font-['Source_Sans_3'] text-black mb-6 text-center">Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-semibold font-['Source_Sans_3'] text-gray-800 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-['Source_Sans_3'] text-base focus:outline-none focus:border-black transition-colors"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-base font-semibold font-['Source_Sans_3'] text-gray-800 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-['Source_Sans_3'] text-base focus:outline-none focus:border-black transition-colors"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-red-600 text-base font-['Source_Sans_3'] text-center font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3.5 bg-black text-white text-base font-bold font-['Source_Sans_3'] rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <Link href="/">
          <p className="mt-5 text-base text-gray-500 hover:text-black cursor-pointer font-['Source_Sans_3'] transition-colors text-center">
            ← Back to website
          </p>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
type AdminView = "dashboard" | "posts" | "new-post";

export default function Admin() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [view, setView] = useState<AdminView>("dashboard");
  const { dark, toggle: toggleDark } = useAdminDarkMode();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLoginForm />;

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <X size={30} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold font-['Source_Sans_3'] text-black mb-3">Access Denied</h2>
          <p className="text-gray-600 text-base font-['Source_Sans_3'] mb-6">You don't have admin privileges. Please contact the site owner.</p>
          <p className="text-sm text-gray-500 font-['Source_Sans_3'] mb-5">Signed in as: {user?.name || user?.email}</p>
          <button onClick={() => logout()} className="w-full py-3.5 border-2 border-gray-300 text-black font-bold font-['Source_Sans_3'] rounded-lg hover:bg-gray-50 transition-colors text-base">
            Sign Out
          </button>
          <Link href="/"><p className="mt-5 text-base text-gray-500 hover:text-black cursor-pointer font-['Source_Sans_3'] transition-colors">← Back to website</p></Link>
        </div>
      </div>
    );
  }

  // Dark mode colour tokens
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
    <div className={`min-h-screen ${bg} flex`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col flex-shrink-0 ${sidebarBg}`}>
        <div className={`p-6 border-b ${dividerColor}`}>
          <h1 className={`text-4xl font-normal font-['Italianno'] ${textPrimary}`}>Simply Sharon</h1>
          <p className={`text-sm font-['Source_Sans_3'] mt-1 ${textMuted}`}>Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {([
            { id: "dashboard" as AdminView, label: "Dashboard", icon: <Settings size={18} /> },
            { id: "posts" as AdminView, label: "All Posts", icon: <FileText size={18} /> },
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
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-['Source_Sans_3'] transition-colors mb-3 ${navInactive}`}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>

          {/* User info */}
          <div className={`flex items-center gap-3 mb-3 p-3 rounded-lg ${dark ? "bg-gray-700" : "bg-gray-50"}`}>
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "Admin")}`}
              alt={user?.name || "Admin"}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className="min-w-0">
              <p className={`text-sm font-bold font-['Source_Sans_3'] truncate ${textPrimary}`}>{user?.name || "Admin"}</p>
              <p className={`text-xs font-['Source_Sans_3'] truncate ${textMuted}`}>{user?.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/">
              <button className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm border rounded-lg transition-colors font-['Source_Sans_3'] ${
                dark ? "text-gray-400 hover:text-white border-gray-600 hover:border-gray-400" : "text-gray-600 hover:text-black border-gray-200 hover:border-gray-400"
              }`}>
                <Eye size={14} /> Site
              </button>
            </Link>
            <button
              onClick={() => logout()}
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
            <h2 className={`text-3xl font-bold font-['Source_Sans_3'] mb-2 ${textPrimary}`}>Welcome back, {user?.name?.split(" ")[0] || "Sharon"}</h2>
            <p className={`text-base font-['Source_Sans_3'] mb-8 ${textMuted}`}>Here's an overview of your content.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              {[
                { label: "Total Posts", value: "—", icon: <FileText size={22} /> },
                { label: "Published", value: "—", icon: <Eye size={22} /> },
                { label: "Drafts", value: "—", icon: <EyeOff size={22} /> },
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
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-lg font-bold font-['Source_Sans_3'] ${textPrimary}`}>Recent Posts</h3>
                <button onClick={() => setView("posts")} className={`text-base font-['Source_Sans_3'] transition-colors ${textMuted} hover:${textPrimary}`}>
                  View all →
                </button>
              </div>
              <PostsList onEdit={() => {}} onNew={() => setView("new-post")} dark={dark} />
            </div>
          </div>
        )}

        {view === "posts" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-3xl font-bold font-['Source_Sans_3'] ${textPrimary}`}>All Posts</h2>
              <button
                onClick={() => setView("new-post")}
                className={`flex items-center gap-2 px-5 py-3 text-base font-bold font-['Source_Sans_3'] rounded-lg transition-colors ${
                  dark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                <Plus size={18} /> New Post
              </button>
            </div>
            <PostsList onEdit={() => {}} onNew={() => setView("new-post")} dark={dark} />
          </div>
        )}

        {view === "new-post" && (
          <div>
            <h2 className={`text-3xl font-bold font-['Source_Sans_3'] mb-6 ${textPrimary}`}>New Post</h2>
            <PostEditor onBack={() => setView("posts")} dark={dark} />
          </div>
        )}
      </main>
    </div>
  );
}
