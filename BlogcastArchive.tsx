import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "./src/components/SiteLayout";
import { ScaledPage } from "./src/components/ScaledPage";
import { ArchivePost, fetchBlogcastPosts, formatArchiveDate, stripHtml } from "./src/blogData";

// ── CDN asset map ──────────────────────────────────────────────────────────
const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz";
const A = {
  homeIcon:   `${CDN}/182-537_c4937fad.webp`,
  readIcon:   `${CDN}/182-307_489ae6c2.webp`,
  listenIcon: `${CDN}/182-312_9f0e1f01.webp`,
  watchIcon:  `${CDN}/182-317_3abcb518.webp`,
  searchIcon: `${CDN}/182-467_28f4eb9d.webp`,
  readBtn:    `${CDN}/182-267_11a8c31d.webp`,
  listenBtn:  `${CDN}/182-266_689ae034.webp`,
  watchBtn:   `${CDN}/182-265_1325a494.webp`,
  thumb1:     `${CDN}/182-258_5f5beb25.webp`,
  thumb2:     `${CDN}/182-623_a98179b4.webp`,
  thumb3:     `${CDN}/182-651_66c45655.webp`,
  thumb4:     `${CDN}/182-671_cfc5680b.webp`,
};

// Local SiteFooter replaced by shared component

export default function BlogcastArchive() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "category">("recent");
  const [posts, setPosts] = useState<ArchivePost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, selectedMonth, selectedYear, sortBy]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError("");
      fetchBlogcastPosts({ page, limit: 4, search, year: selectedYear, month: selectedMonth, sort: sortBy })
        .then((data) => {
          if (cancelled) return;
          setPosts(data.items);
          setTotalPages(data.totalPages || 1);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setPosts([]);
          setTotalPages(1);
          setError(err instanceof Error ? err.message : "Failed to load posts");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [page, search, selectedMonth, selectedYear, sortBy]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    return [1, 2, 3];
  }, [totalPages]);

  const monthOptions = [
    { value: "", label: "Select Month" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const yearOptions = ["", "2026", "2025", "2024", "2023"];

  return (
    <SiteLayout background="#fff" includeFooter={true}>
      <ScaledPage watchKey={`${posts.length}-${loading}-${page}-${totalPages}-${selectedMonth}-${selectedYear}`}>
        <div style={{ width: 1920 }}>
          <style>{`
            .blogcast-action-pill {
              padding: 14px 39px;
              background: #d4d4d4;
              border-radius: 20px;
              display: flex;
              align-items: center;
              gap: 23px;
              cursor: pointer;
              text-decoration: none;
              transition: transform 180ms ease, background-color 180ms ease;
            }
            .blogcast-action-pill:hover {
              transform: translateY(-3px);
              background: #6b7280;
            }
            .blogcast-action-pill:hover span {
              color: #ffffff !important;
            }
            .blogcast-action-pill:hover img {
              filter: brightness(0) invert(1);
            }
            .blogcast-filter-button {
              min-width: 280px;
              height: 88px;
              border-radius: 18px;
              background: #ffffff;
              border: 2px solid #d1d5db;
              color: #111111;
              display: flex;
              align-items: center;
              padding: 0 22px;
              box-sizing: border-box;
            }
            .blogcast-filter-button select {
              flex: 1;
              border: none;
              outline: none;
              background: transparent;
              color: #111111;
              font-family: Helvetica, Arial, sans-serif;
              font-size: 30px;
              cursor: pointer;
              appearance: none;
            }
            .blogcast-filter-button select option {
              color: #111111;
            }
          `}</style>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 0 0 10px" }}>
            <a href="/" style={{ padding: 10, display: "inline-flex" }}>
              <img src={A.homeIcon} alt="home" style={{ width: 29, height: 29 }} />
            </a>
            <div style={{ padding: 10 }}>
              <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 24, fontWeight: 400, color: "#000" }}>
                <a href="/" style={{ color: "inherit", textDecoration: "none", fontWeight: 400 }}>home</a>
                {" / "}
                <span style={{ fontWeight: 700 }}>Blogcast Home</span>
              </span>
            </div>
          </div>

          {/* Header section */}
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 45, paddingTop: 53 }}>

            {/* Showcase card */}
            <div style={{ width: 1698, background: "#f0f0f0", borderRadius: 14, paddingTop: 48, paddingBottom: 48, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 25 }}>
              <div style={{ width: "100%", padding: 10, display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
                <div style={{ padding: "0 156px", display: "flex", justifyContent: "center" }}>
                  <span style={{ fontFamily: "Italianno, serif", fontSize: 96, color: "#000", textAlign: "center" as const }}>The Blogcast</span>
                </div>
                <div style={{ padding: "0 42px", display: "flex", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 36, fontWeight: 700, color: "#000", textAlign: "center" as const }}>Beauty · Wellness · Wisdom</span>
                </div>
                <div style={{ paddingTop: 46, display: "flex", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 64, fontWeight: 700, color: "#000", textAlign: "center" as const }}>WELCOME !</span>
                </div>
                <div style={{ paddingTop: 27, display: "flex", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 36, fontWeight: 400, color: "#000", textAlign: "center" as const, maxWidth: 1003 }}>
                    You're currently on the landing page of my Blogcast. Enjoy exploring and thank you for being here.
                  </span>
                </div>
              </div>
              <div style={{ width: 1167, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 51 }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", gap: 33 }}>
                  {[
                    { icon: A.readIcon, label: "Read", text: "Deep dives into beauty myths, practical advice, and inspiring stories", width: 356 },
                    { icon: A.listenIcon, label: "Listen", text: "Empowering conversations on personal growth, wisdom, and holistic health", width: 366 },
                    { icon: A.watchIcon, label: "Watch", text: "Visual tutorials and real talk about living with strength and grace", width: 330 },
                  ].map(({ icon, label, text, width }) => (
                    <div key={label} style={{ width, paddingTop: 29, paddingBottom: 29, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 33 }}>
                      <img src={icon} alt={label} style={{ width: 80, height: 80 }} />
                      <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 40, fontWeight: 700, color: "#000" }}>{label}</span>
                      <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 28, color: "#000", textAlign: "center" as const }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search area */}
            <div style={{ width: 1920, height: 305, paddingTop: 16, background: "#4d4d4d", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 53 }}>
              <div style={{ paddingTop: 10, paddingBottom: 10 }}>
                <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 60, fontWeight: 400, color: "#fff", textAlign: "center" as const }}>Search the Knowledge Base</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 53 }}>
                <div style={{ width: 1078, height: 88, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", padding: 10, boxSizing: "border-box" as const, justifyContent: "space-between" }}>
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="" style={{ flex: 1, border: "none", outline: "none", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 36, background: "transparent" }} />
                  <img src={A.searchIcon} alt="search" style={{ width: 47, height: 47 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div className="blogcast-filter-button">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} aria-label="Select Month">
                      {monthOptions.map((option) => (
                        <option key={option.label} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="blogcast-filter-button">
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} aria-label="Select Year">
                      {yearOptions.map((year) => (
                        <option key={year || "empty-year"} value={year}>{year || "Select Year"}</option>
                      ))}
                    </select>
                  </div>
                  <div className="blogcast-filter-button">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "recent" | "category")} aria-label="Sort posts">
                      <option value="recent">Sort by Newest</option>
                      <option value="category">Sort by Category</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Post container */}
          <div style={{ width: 1698, margin: "97px auto 0 auto", display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 72 }}>
            {loading && (
              <div style={{ width: "100%", padding: "80px 0", textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, color: "#4b5563" }}>
                Loading posts...
              </div>
            )}

            {!loading && error && (
              <div style={{ width: "100%", padding: "80px 0", textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, color: "#991b1b" }}>
                {error}
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div style={{ width: "100%", padding: "80px 0", textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, color: "#4b5563" }}>
                No published posts matched your search.
              </div>
            )}

            {!loading && !error && posts.map((post, idx) => (
              <div key={post.id} style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 113 }}>
                  <img src={post.thumbnailUrl || A[`thumb${(idx % 4) + 1}` as keyof typeof A]} alt={post.title} style={{ width: 386, height: 386, borderRadius: 13, objectFit: "cover" as const, flexShrink: 0 }} />
                  <div style={{ width: 1141, display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "flex-start", gap: 43 }}>
                    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-start" }}>
                      <div style={{ padding: 10 }}>
                        <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 48, fontWeight: 700, color: "#000" }}>{post.title}</span>
                      </div>
                      <div style={{ padding: 10 }}>
                        <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 36, fontWeight: 400, color: "#ababab" }}>Posted on {formatArchiveDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                      <div style={{ padding: 10, width: "100%", boxSizing: "border-box" as const }}>
                        <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 400, color: "#000", lineHeight: "46px" }}>{stripHtml(post.summary) || post.subtitle || "Read the latest thoughts from the Blogcast archive."}</span>
                      </div>
                    </div>
                    <div style={{ paddingLeft: 14, paddingRight: 14, display: "flex", alignItems: "center", gap: 108, flexWrap: "wrap" as const }}>
                      {[
                        { icon: A.readBtn, label: "Read", w: 48, h: 48, r: 16, href: post.readUrl || `/blog-post/${post.id}`, visible: post.showReadButton !== false },
                        { icon: A.listenBtn, label: "Listen", w: 43, h: 42, r: 0, href: post.listenUrl, visible: post.showListenButton !== false && Boolean(post.listenUrl) },
                        { icon: A.watchBtn, label: "Watch", w: 42, h: 42, r: 0, href: post.watchUrl, visible: post.showWatchButton !== false && Boolean(post.watchUrl) },
                      ].filter((action) => action.visible && action.href).map(({ icon, label, w, h, r, href }) => {
                        const isRead = label === "Read" && !String(href).startsWith("http");
                        return (
                          <a key={label} href={href} target={isRead ? undefined : "_blank"} rel={isRead ? undefined : "noreferrer"} style={{ textDecoration: "none" }}>
                            <div className="blogcast-action-pill">
                              <img src={icon} alt={label} style={{ width: w, height: h, borderRadius: r }} />
                              <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 40, fontWeight: 700, color: "#000" }}>{label}</span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {idx < posts.length - 1 && (
                  <div style={{ height: 40, paddingLeft: 10, paddingRight: 10, paddingTop: 36, paddingBottom: 36, background: "#fff" }}>
                    <div style={{ width: "100%", height: 0, borderTop: "1px solid #000" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ paddingTop: 96, paddingBottom: 82, display: "flex", justifyContent: "center", alignItems: "center", gap: 113 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ height: 86, paddingLeft: 32, paddingRight: 16, paddingTop: 13, paddingBottom: 13, background: "#dadada", borderRadius: 14, border: "none", cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: page === 1 ? 0.5 : 1 }}>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 36, fontWeight: 700, color: "#000" }}>Previous Page</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 35 }}>
              {pageNumbers.map((n) => (
                <button key={n} onClick={() => setPage(n)} style={{ width: 88, height: 88, background: page === n ? "#111111" : "#dadada", borderRadius: "50%", border: page === n ? "2px solid #9ca3af" : "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: page === n ? "0 12px 28px rgba(0, 0, 0, 0.22)" : "none" }}>
                  <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 700, color: page === n ? "#fff" : "#000" }}>{n}</span>
                </button>
              ))}
              {totalPages > 3 && (
                <>
                  <div style={{ padding: 10 }}>
                    <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 700, color: "#000" }}>. . .</span>
                  </div>
                  <button onClick={() => setPage(totalPages)} style={{ width: 88, height: 88, background: page === totalPages ? "#111111" : "#dadada", borderRadius: "50%", border: page === totalPages ? "2px solid #9ca3af" : "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: page === totalPages ? "0 12px 28px rgba(0, 0, 0, 0.22)" : "none" }}>
                    <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 700, color: page === totalPages ? "#fff" : "#000" }}>{totalPages}</span>
                  </button>
                </>
              )}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 276, height: 86, paddingRight: 50, paddingTop: 13, paddingBottom: 13, background: "#dadada", borderRadius: 14, border: "none", cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 74, opacity: page === totalPages ? 0.5 : 1 }}>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 36, fontWeight: 700, color: "#000" }}>Next Page</span>
            </button>
          </div>

        </div>
      </ScaledPage>
    </SiteLayout>
  );
}
