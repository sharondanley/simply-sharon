import { useEffect, useMemo, useState } from "react";
import { CommentSection } from "./src/components/CommentSection";
import { SiteNavbar } from "./src/components/SiteNavbar";
import { SiteFooter } from "./src/components/SiteFooter";
import { ScaledPage } from "./src/components/ScaledPage";
import { BlogBlock, BlogPostRecord, fetchBlogPostById, fetchBlogPostBySlug, formatArchiveDate, getPostLeadText, toEmbedUrl } from "./src/blogData";

// ─── CDN Assets (Figma node-id mapped) ───────────────────────────────────────
const ASSETS = {
  navbarBg:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/111-531_9af77b16.webp",
  siteLogo:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/111-533_7bd8ee1e.webp",
  breadcrumbIcon:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/111-551_b98a981b.webp",
  sharonPortrait:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/114-683_ca65ab48.webp",
  videoThumbnail:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-7_7db05980.webp",
  heartEmoji:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-21_0db020ef.webp",
  footerBg:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-36_270c59a1.webp",
  emailIcon:       "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-44_39e13744.webp",
  facebookIcon:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-45_0b4c84e4.webp",
  youtubeIcon:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-46_d0b92edf.webp",
  caricatureLogo:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/116-73_1761bbb8.webp",
  commentSection:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/124-76_ee23175d.webp",
};

function renderBlock(block: BlogBlock, index: number) {
  switch (block.type) {
    case "heading":
      return (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "16px 116px 10px" }}>
          <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "48px", lineHeight: "55px", fontWeight: 700, color: "#000" }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
        </div>
      );
    case "quote":
      return (
        <div key={block.id || index} style={{ width: "1650px", padding: "0 116px", display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ alignSelf: "stretch", padding: "37px 0", background: "#D9D9D9", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "43px" }}>
            <div style={{ alignSelf: "stretch", padding: "10px" }}>
              <div style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "40px", lineHeight: "50px", fontWeight: 700, color: "#000" }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
            </div>
            {block.caption && (
              <div style={{ padding: "10px 47px" }}>
                <span style={{ fontFamily: "Italianno", fontSize: "64px", lineHeight: "80px", color: "#000" }}>{block.caption}</span>
              </div>
            )}
          </div>
        </div>
      );
    case "image":
      return block.url ? (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "10px", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <img src={block.url} alt={block.caption || ""} style={{ maxWidth: "1200px", maxHeight: "720px", objectFit: "cover", borderRadius: "16px" }} />
            {block.caption && <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "28px", lineHeight: "34px", color: "#6b7280" }}>{block.caption}</span>}
          </div>
        </div>
      ) : null;
    case "video": {
      const embedUrl = toEmbedUrl(block.url);
      return embedUrl ? (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "10px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "756px", height: "432.55px", borderRadius: "18px", overflow: "hidden", background: "#000" }}>
            <iframe src={embedUrl} title={block.caption || "Embedded video"} style={{ width: "100%", height: "100%", border: 0 }} allowFullScreen />
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
    default:
      return (
        <div key={block.id || index} style={{ alignSelf: "stretch", padding: "10px 116px" }}>
          <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", color: "#000" }} dangerouslySetInnerHTML={{ __html: block.content || "" }} />
        </div>
      );
  }
}

export default function BlogPost({ slug, id }: { slug?: string; id?: number }) {
  const [post, setPost] = useState<BlogPostRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const leadText = useMemo(() => (post ? getPostLeadText(post) : ""), [post]);
  const bodyBlocks = post?.blocks || [];

  return (
    <div style={{ overflowX: "hidden", background: "#fff" }}>
      <SiteNavbar />
      <ScaledPage watchKey={`${post?.id || "missing"}-${loading}-${bodyBlocks.length}`}>
        <div style={{ width: "1920px", background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0 135px 80px", gap: "43px" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", paddingTop: "20px" }}>
            <a href="/" style={{ padding: "10px" }}><img src={ASSETS.breadcrumbIcon} alt="home" style={{ width: "29px", height: "29px", cursor: "pointer" }} /></a>
            <div style={{ padding: "10px" }}>
              <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "24px", fontWeight: 700, color: "#000" }}>
                <a href="/" style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}>home</a>
                {" / "}
                <a href="/blogcast" style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}>Blogcast Home</a>
                {` / ${post?.title || "Blog Post"}`}
              </span>
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
                <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "64px", lineHeight: "80px", fontWeight: 700, color: "#000", textAlign: "center" }}>{post?.title || "Loading post..."}</span>
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
            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: "46px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "28px" }}>
                <div style={{ padding: "10px" }}>
                  <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "32px", lineHeight: "40px", fontStyle: "italic", color: "#A3A3A3" }}>
                    {formatArchiveDate(post.publishedAt || post.createdAt)}{post.episode ? ` | Ep ${post.episode}` : ""}<br />By: {post.authorName || "Sharon Danley"}
                  </span>
                </div>
                <div style={{ alignSelf: "stretch" }}>
                  <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", color: "#000" }}>
                    {leadText}
                  </span>
                </div>
                {post.subtitle && (
                  <div style={{ alignSelf: "stretch" }}>
                    <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "48px", lineHeight: "55px", fontWeight: 700, color: "#000" }}>
                      {post.subtitle}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <img src={post.thumbnailUrl || ASSETS.sharonPortrait} alt={post.title} style={{ width: "372px", height: "483px", objectFit: "cover" }} />
              </div>
            </div>
          </div>

          {bodyBlocks.map(renderBlock)}

          <div style={{ width: "1574px", padding: "10px 0" }}>
            <CommentSection />
          </div>
            </>
          )}
        </div>
      </ScaledPage>
      <SiteFooter />
    </div>
  );
}
