import { useEffect, useMemo, useState } from "react";
import { CommentSection } from "./src/components/CommentSection";
import { SiteLayout } from "./src/components/SiteLayout";
import { ScaledPage } from "./src/components/ScaledPage";
import { BlogBlock, BlogPostRecord, fetchBlogPostById, fetchBlogPostBySlug, formatArchiveDate, toEmbedUrl } from "./src/blogData";

// ─── CDN Assets (Figma node-id mapped) ───────────────────────────────────────
const ASSETS = {
  navbarBg:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/111-531_9af77b16.webp",
  siteLogo:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/111-533_7bd8ee1e.webp",
  breadcrumbIcon:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/111-551_b98a981b.webp",
  sharonPortrait:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/114-683_ca65ab48.webp",
  videoThumbnail:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-7_7db05980.webp",
  heartEmoji:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-21_1dd24f05.webp",
  footerBg:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-36_270c59a1.webp",
  emailIcon:       "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-44_39e13744.webp",
  facebookIcon:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-45_0b4c84e4.webp",
  youtubeIcon:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-46_d0b92edf.webp",
  caricatureLogo:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-73_1761bbb8.webp",
  commentSection:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/124-76_ee23175d.webp",
};

const IMAGE_DROP_SHADOW = "drop-shadow(1px 3px 7px #180c0c)";
const INDENT_STEP_PX = 32;
const DEFAULT_GRID_IMAGE_WIDTH_PERCENT = 100;
const MIN_GRID_IMAGE_WIDTH_PERCENT = 25;
const MAX_GRID_IMAGE_WIDTH_PERCENT = 100;

function getLegacyGridDimensions(layout?: string) {
  return layout === "3x3" ? { rows: 3, columns: 3 } : { rows: 1, columns: 3 };
}

function clampParagraphIndentLevel(value?: number) {
  const normalized = Number.isFinite(value) ? Number(value) : 0;
  return Math.max(0, Math.min(8, Math.round(normalized)));
}

function clampGridImageWidthPercent(value?: number) {
  const normalized = Number.isFinite(value) ? Number(value) : DEFAULT_GRID_IMAGE_WIDTH_PERCENT;
  return Math.max(MIN_GRID_IMAGE_WIDTH_PERCENT, Math.min(MAX_GRID_IMAGE_WIDTH_PERCENT, Math.round(normalized)));
}

function getCustomGridTemplateColumns(block: BlogBlock, cells: Array<ReturnType<typeof ensureGridCells>[number]>) {
  const columns = getGridColumnCount(block);
  if (columns <= 1) return "minmax(0, 1fr)";

  const firstRowCells = cells.slice(0, columns);
  const hasParagraph = firstRowCells.some((cell) => cell.contentType === "paragraph");
  const hasMedia = firstRowCells.some((cell) => cell.contentType !== "paragraph");

  if (!hasParagraph || !hasMedia) {
    return `repeat(${columns}, minmax(0, 1fr))`;
  }

  return firstRowCells
    .map((cell) => (cell.contentType === "paragraph" ? "minmax(0, 1fr)" : "fit-content(100%)"))
    .join(" ");
}

function sanitizeGrid(block: BlogBlock) {
  const legacy = getLegacyGridDimensions(block.layout);
  return {
    rows: Math.max(1, Math.min(6, Math.round(block.grid?.rows ?? legacy.rows))),
    columns: Math.max(1, Math.min(3, Math.round(block.grid?.columns ?? legacy.columns))),
  };
}

function getGridColumnCount(block: BlogBlock) {
  return sanitizeGrid(block).columns;
}

function ensureGridCells(block: BlogBlock) {
  const grid = sanitizeGrid(block);
  const count = grid.rows * grid.columns;
  return Array.from({ length: count }, (_, index) => {
    const existing = block.cells?.[index];
    return {
      id: existing?.id || `${block.id || "grid"}-${index}`,
      contentType: existing?.contentType || "paragraph",
      content: existing?.content || "",
      url: existing?.url || "",
      caption: existing?.caption || "",
      fontSize: existing?.fontSize,
      textColor: existing?.textColor,
      indentLevel: existing?.indentLevel,
      imageWidthPercent: existing?.imageWidthPercent,
    };
  });
}

function isNarrativeBlock(block?: BlogBlock | null) {
  return block?.type === "paragraph" || block?.type === "quote" || block?.type === "heading";
}

function renderIntroBlock(block?: BlogBlock | null) {
  if (!block) return null;

  switch (block.type) {
    case "heading":
      return (
        <div style={{ width: "100%" }}>
          <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "48px", lineHeight: "55px", fontWeight: 700, color: block.textColor || "#000" }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
        </div>
      );
    case "quote":
      return (
        <div style={{ width: "100%", padding: "36px 42px", background: "#D9D9D9", borderRadius: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: "40px", lineHeight: "50px", fontWeight: 700, color: block.textColor || "#000" }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
          {block.caption ? (
            <div style={{ textAlign: "right" }}>
              <span style={{ fontFamily: "Italianno", fontSize: "60px", lineHeight: "72px", color: block.textColor || "#000" }}>{block.caption}</span>
            </div>
          ) : null}
        </div>
      );
    default: {
      const fontSize = Math.max(12, Math.min(72, Math.round(block.fontSize ?? 36)));
      return (
        <div className="blog-post-rich-text" style={{ width: "100%", fontFamily: "Helvetica, Arial, sans-serif", fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.35)}px`, color: block.textColor || "#000", marginLeft: `${clampParagraphIndentLevel(block.indentLevel) * INDENT_STEP_PX}px` }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
      );
    }
  }
}

function renderBlock(block: BlogBlock, index: number) {
  switch (block.type) {
    case "heading":
      return (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "16px 116px 10px" }}>
          <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "48px", lineHeight: "55px", fontWeight: 700, color: block.textColor || "#000" }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
        </div>
      );
    case "quote":
      return (
        <div key={block.id || index} style={{ width: "1650px", padding: "0 116px", display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ alignSelf: "stretch", padding: "44px 52px 34px", background: "#D9D9D9", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>
            <div style={{ maxWidth: "1180px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: "40px", lineHeight: "50px", fontWeight: 700, color: block.textColor || "#000" }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
            </div>
            {block.caption && (
              <div style={{ width: "100%", paddingRight: "74px", textAlign: "right" }}>
                <span style={{ fontFamily: "Italianno", fontSize: "64px", lineHeight: "80px", color: block.textColor || "#000" }}>{block.caption}</span>
              </div>
            )}
          </div>
        </div>
      );
    case "customGrid": {
      const cells = ensureGridCells(block);
      const columns = getGridColumnCount(block);
      const gridTemplateColumns = getCustomGridTemplateColumns(block, cells);
      return (
        <div key={block.id || index} style={{ width: "100%", padding: "0 116px", boxSizing: "border-box" }}>
          <div className="blog-post-custom-grid" style={{ display: "grid", gridTemplateColumns, gap: "10px", alignItems: "start", width: "100%" }}>
            {cells.map((cell) => {
              const fontSize = Math.max(12, Math.min(72, Math.round(cell.fontSize ?? 36)));
              return (
                <div key={cell.id} style={{ minHeight: cell.contentType === "thumbnail" ? "220px" : "280px", display: "flex", flexDirection: "column", justifyContent: cell.contentType === "paragraph" ? "flex-start" : "flex-start", alignItems: cell.contentType === "paragraph" ? "stretch" : "flex-start", gap: "6px", background: "transparent", padding: 0, border: "none", borderRadius: 0, width: cell.contentType === "paragraph" ? "100%" : "fit-content", maxWidth: cell.contentType === "paragraph" ? "100%" : "fit-content", justifySelf: cell.contentType === "paragraph" ? "stretch" : "start", marginRight: 0 }}>
                  {cell.contentType === "paragraph" ? (
                    <div className="blog-post-rich-text" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.35)}px`, color: cell.textColor || "#111827", marginLeft: `${clampParagraphIndentLevel(cell.indentLevel) * INDENT_STEP_PX}px` }} dangerouslySetInnerHTML={{ __html: cell.content || "" }} />
                  ) : cell.url ? (
                    <>
                      <img src={cell.url} alt={cell.caption || "Grid image"} style={{ width: clampGridImageWidthPercent(cell.imageWidthPercent) >= 100 ? "auto" : `${clampGridImageWidthPercent(cell.imageWidthPercent)}%`, maxWidth: clampGridImageWidthPercent(cell.imageWidthPercent) >= 100 ? "100%" : `${clampGridImageWidthPercent(cell.imageWidthPercent)}%`, height: "auto", maxHeight: cell.contentType === "thumbnail" ? "360px" : "640px", objectFit: "contain", alignSelf: "flex-end", display: "block", marginLeft: "auto", filter: IMAGE_DROP_SHADOW }} />
                      {cell.caption ? (
                        <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "24px", lineHeight: "30px", color: "#6B7280" }}>{cell.caption}</span>
                      ) : null}
                    </>
                  ) : (
                    <div style={{ width: "100%", height: cell.contentType === "thumbnail" ? "180px" : "260px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "24px", color: "#6B7280", background: "transparent" }}>
                      {cell.contentType === "thumbnail" ? "Thumbnail" : "Image"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    case "mediaTextSplit": {
      const [imageCell, paragraphCell] = ensureGridCells({ ...block, grid: { rows: 1, columns: 2 } });
      const paragraphFontSize = Math.max(12, Math.min(72, Math.round(paragraphCell.fontSize ?? 36)));
      return (
        <div key={block.id || index} style={{ width: "100%", padding: "0 116px", boxSizing: "border-box" }}>
          <div className="blog-post-media-text" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", gap: "28px", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {imageCell.url ? (
                <img src={imageCell.url} alt={imageCell.caption || "Feature image"} style={{ width: `${clampGridImageWidthPercent(imageCell.imageWidthPercent)}%`, maxWidth: "100%", height: "auto", maxHeight: "720px", objectFit: "contain", filter: IMAGE_DROP_SHADOW }} />
              ) : null}
              {imageCell.caption ? <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "24px", lineHeight: "30px", color: "#6B7280" }}>{imageCell.caption}</span> : null}
            </div>
            <div className="blog-post-rich-text" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: `${paragraphFontSize}px`, lineHeight: `${Math.round(paragraphFontSize * 1.35)}px`, color: paragraphCell.textColor || "#111827", marginLeft: `${clampParagraphIndentLevel(paragraphCell.indentLevel) * INDENT_STEP_PX}px` }} dangerouslySetInnerHTML={{ __html: paragraphCell.content || "" }} />
          </div>
        </div>
      );
    }
    case "image":
      return block.url ? (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "10px", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <img src={block.url} alt={block.caption || ""} style={{ width: "auto", height: "auto", maxWidth: "1200px", maxHeight: "900px", objectFit: "contain", filter: IMAGE_DROP_SHADOW }} />
            {block.caption && <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "28px", lineHeight: "34px", color: "#6b7280" }}>{block.caption}</span>}
          </div>
        </div>
      ) : null;
    case "video": {
      const embedUrl = toEmbedUrl(block.url);
      return embedUrl ? (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "10px", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "756px", height: "432.55px", overflow: "hidden", background: "#000" }}>
              <iframe src={embedUrl} title={block.caption || "Embedded video"} style={{ width: "100%", height: "100%", border: 0 }} allowFullScreen />
            </div>
            {block.caption ? <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "28px", lineHeight: "34px", color: "#6b7280" }}>{block.caption}</span> : null}
          </div>
        </div>
      ) : null;
    }
    case "divider":
      return (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "24px 116px" }}>
          <div style={{ width: "100%", borderTop: "1px solid #000" }} />
        </div>
      );
    default: {
      const fontSize = Math.max(12, Math.min(72, Math.round(block.fontSize ?? 36)));
      return (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "7px 116px" }}>
          <div className="blog-post-rich-text" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.35)}px`, color: block.textColor || "#000", marginLeft: `${clampParagraphIndentLevel(block.indentLevel) * INDENT_STEP_PX}px` }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
        </div>
      );
    }
  }
}

export default function BlogPost({ slug, id }: { slug?: string; id?: number }) {
  const [post, setPost] = useState<BlogPostRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canReturnToAdmin, setCanReturnToAdmin] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const timeoutIds = [0, 80, 180, 320].map((delay) => window.setTimeout(scrollToTop, delay));
    const firstFrameId = window.requestAnimationFrame(scrollToTop);
    const secondFrameId = window.requestAnimationFrame(() => window.requestAnimationFrame(scrollToTop));
    const handlePageShow = () => scrollToTop();

    window.addEventListener("pageshow", handlePageShow);
    scrollToTop();

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.history.scrollRestoration = previousScrollRestoration || "auto";
    };
  }, [id, slug, post?.id, loading]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const request = slug ? fetchBlogPostBySlug(slug) : id ? fetchBlogPostById(id) : Promise.reject(new Error("No post requested"));

    request
      .then((data) => {
        if (cancelled) return;
        setPost(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPost(null);
        setError(err instanceof Error ? err.message : "Failed to load post");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, slug]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json().catch(() => null);
      })
      .then((user) => {
        if (cancelled || !user) return;
        const role = String(user.role || "").toLowerCase();
        if (role.includes("admin") || role.includes("author")) {
          setCanReturnToAdmin(true);
        }
      })
      .catch(() => {
        if (!cancelled) setCanReturnToAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const bodyBlocks = post?.blocks || [];
  const personalization = post?.personalization || null;
  const displayAuthor = (personalization?.displayName || post?.authorName || "Sharon Danley").trim();
  const displayRole = (personalization?.role || "Master Beauty Mentor").trim();
  const authorLine = displayRole ? `${displayAuthor}, ${displayRole}` : displayAuthor;
  const introBlockIndex = bodyBlocks.findIndex((block) => isNarrativeBlock(block));
  const introBlock = introBlockIndex >= 0 ? bodyBlocks[introBlockIndex] : null;
  const remainingBlocks = introBlockIndex >= 0 ? bodyBlocks.filter((_, index) => index !== introBlockIndex) : bodyBlocks;
  const publishedLabel = formatArchiveDate(post?.publishedAt || post?.createdAt);

  return (
    <SiteLayout background="#fff" includeFooter={true}>
      <style>{`
        .blog-post-rich-text a {
          color: #1d4ed8;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 0.12em;
        }

        .blog-post-rich-text ol {
          list-style-type: decimal;
          list-style-position: outside;
          padding-left: 1.8em;
          margin: 0.65em 0 0.65em 1.2em;
        }

        .blog-post-rich-text ol li::marker {
          font-weight: 600;
          color: #111827;
        }

        .blog-post-rich-text ul {
          list-style: disc;
          list-style-position: outside;
          padding-left: 1.8em;
          margin: 0.65em 0 0.65em 1.2em;
        }

        .blog-post-rich-text li {
          margin: 0.18em 0;
        }

        .blog-post-rich-text br {
          display: block;
          line-height: 0.16em;
          margin-top: 0;
        }

        @media (max-width: 767px) {
          .blog-post-custom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <ScaledPage watchKey={`${post?.id || "missing"}-${loading}-${bodyBlocks.length}`}>
        <div style={{ width: "1780px", background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0 135px 80px", gap: "33px" }}>
          <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px", paddingTop: "20px" }}>
            {canReturnToAdmin && (
              <a
                href="/admin"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 18px",
                  borderRadius: "999px",
                  border: "1px solid #d4d4d4",
                  background: "#fff",
                  color: "#111",
                  textDecoration: "none",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  lineHeight: "24px",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)"
                }}
              >
                ← Back to Admin
              </a>
            )}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
              <a href="/" style={{ padding: "10px" }}><img src={ASSETS.breadcrumbIcon} alt="home" style={{ width: "29px", height: "29px", cursor: "pointer" }} /></a>
              <div style={{ padding: "10px" }}>
                <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "24px", fontWeight: 400, color: "#000" }}>
                  <a href="/" style={{ cursor: "pointer", textDecoration: "none", color: "inherit", fontWeight: 400 }}>home</a>
                  {" / "}
                  <a href="/blogcast" style={{ cursor: "pointer", textDecoration: "none", color: "inherit", fontWeight: 400 }}>Blogcast Home</a>
                  {" / "}
                  <span style={{ fontWeight: 700 }}>{post?.title || "Blog Post"}</span>
                </span>
              </div>
            </div>
          </div>


          <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", alignItems: "flex-start", overflow: "hidden" }}>
              <div style={{ alignSelf: "stretch", padding: "0 156px", display: "flex", justifyContent: "center" }}>
                <span style={{ fontFamily: "Italianno", fontSize: "96px", lineHeight: "120px", color: "#000", textAlign: "center" }}>The Blogcast</span>
              </div>
              <div style={{ alignSelf: "stretch", padding: "0 42px", display: "flex", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "36px", lineHeight: "45px", fontWeight: 700, color: "#000", textAlign: "center" }}>Beauty · Wellness · Wisdom</span>
              </div>
              <div style={{ alignSelf: "stretch", padding: "46px 10px 0", display: "flex", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "64px", lineHeight: "80px", fontWeight: 700, color: "#000", textAlign: "center", maxWidth: (post?.title?.length || 0) > 25 ? "800px" : "100%", display: "inline-block" }}>{post?.title || "Loading post..."}</span>
              </div>
            </div>
            <div style={{ padding: "36px 10px" }}>
              <div style={{ width: "707px", height: "0", borderTop: "7px solid #000" }} />
            </div>
          </div>

          {loading && (
            <div style={{ width: "100%", padding: "60px 0", textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "40px", color: "#4b5563" }}>
              Loading post...
            </div>
          )}

          {!loading && error && (
            <div style={{ width: "100%", padding: "60px 0", textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "40px", color: "#991b1b" }}>
              {error}
            </div>
          )}

          {!loading && post && (
            <>
            <div style={{ alignSelf: "stretch", padding: "0 116px", display: "flex", flexDirection: "column", gap: "129px" }}>
            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: "46px" }}>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "28px" }}>
                <div style={{ padding: "10px", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "32px", lineHeight: "40px", color: "#6b7280", fontWeight: 400, fontStyle: "italic" }}>
                    {post.episode !== null && post.episode !== undefined && String(post.episode).trim() !== "" ? <span>{`Ep #${post.episode} - ${publishedLabel}`}</span> : <span>{publishedLabel}</span>}
                  </div>
                  <div style={{ marginTop: "10px", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "32px", lineHeight: "40px", color: "#6b7280", fontWeight: 400, fontStyle: "italic" }}>
                    {`By: ${authorLine}`}
                  </div>
                </div>
                {introBlock ? (
                  <div style={{ alignSelf: "stretch" }}>
                    {renderIntroBlock(introBlock)}
                  </div>
                ) : null}
              </div>
                  <div style={{ width: "372px", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "100px" }}>
                <img src={post.thumbnailUrl || ASSETS.sharonPortrait} alt={post.title} style={{ width: "372px", height: "auto", maxHeight: "640px", objectFit: "contain", display: "block", filter: IMAGE_DROP_SHADOW }} />
              </div>
            </div>
          </div>

          {remainingBlocks.map(renderBlock)}

          <div style={{ width: "100%", padding: "10px 116px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "32px", lineHeight: "41px", color: "#000" }}>With Warmth & Wisdom,</span>
              <div style={{ paddingTop: "8px", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", gap: "14px" }}>
                <span style={{ fontFamily: "Italianno", fontSize: "82px", lineHeight: "1", color: "#000" }}>Sharon</span>
                <img src={ASSETS.heartEmoji} alt="heart" style={{ width: "54px", height: "54px", objectFit: "contain", transform: "translateY(-10px)" }} />
              </div>
            </div>
          </div>

          <div style={{ width: "1574px", padding: "10px 0" }}>
            <CommentSection postId={post.id} />
          </div>
            </>
          )}
        </div>
      </ScaledPage>
    </SiteLayout>
  );
}


