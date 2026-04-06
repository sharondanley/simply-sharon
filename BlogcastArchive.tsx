import { useState } from "react";
import { Link } from "wouter";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

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

const SEED_POSTS = [
  { id: 1, title: "The Art of Color Picking", date: "March 25th 2026", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis efficitur nulla id tortor suscipit consequat. Pellentesque varius venenatis ornare. Phasellus.", thumbnail: A.thumb1, slug: "the-art-of-color-picking" },
  { id: 2, title: "The Art of Color Picking", date: "March 25th 2026", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis efficitur nulla id tortor suscipit consequat. Pellentesque varius venenatis ornare. Phasellus.", thumbnail: A.thumb2, slug: "the-art-of-color-picking-2" },
  { id: 3, title: "The Art of Color Picking", date: "March 25th 2026", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis efficitur nulla id tortor suscipit consequat. Pellentesque varius venenatis ornare. Phasellus.", thumbnail: A.thumb3, slug: "the-art-of-color-picking-3" },
  { id: 4, title: "The Art of Color Picking", date: "March 25th 2026", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis efficitur nulla id tortor suscipit consequat. Pellentesque varius venenatis ornare. Phasellus.", thumbnail: A.thumb4, slug: "the-art-of-color-picking-4" },
];

const TOTAL_PAGES = 10;

export default function BlogcastArchive() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [timePeriod, setTimePeriod] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: "#fff", overflowX: "hidden" }}>
      <SiteNavbar />
      <div style={{ width: "100%", overflow: "hidden" }}>
        <div style={{ width: 1920, transformOrigin: "top left", transform: `scale(min(1, calc(100vw / 1920)))` }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 0 0 10px" }}>
            <div style={{ padding: 10 }}>
              <img src={A.homeIcon} alt="home" style={{ width: 29, height: 29 }} />
            </div>
            <div style={{ padding: 10 }}>
              <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 24, fontWeight: 700, color: "#000" }}>home / Blogcast Home</span>
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
                <div style={{ height: 88, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", padding: 10, boxSizing: "border-box" as const }}>
                  <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} style={{ border: "none", outline: "none", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 36, background: "transparent", cursor: "pointer", paddingLeft: 10, paddingRight: 10 }}>
                    <option value="">Select a Time Period</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Post container */}
          <div style={{ width: 1698, margin: "97px auto 0 auto", display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 72 }}>
            {SEED_POSTS.map((post, idx) => (
              <div key={post.id} style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 113 }}>
                  <img src={post.thumbnail} alt={post.title} style={{ width: 386, height: 386, borderRadius: 13, objectFit: "cover" as const, flexShrink: 0 }} />
                  <div style={{ width: 1141, display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "flex-start", gap: 43 }}>
                    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-start" }}>
                      <div style={{ padding: 10 }}>
                        <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 48, fontWeight: 700, color: "#000" }}>{post.title}</span>
                      </div>
                      <div style={{ padding: 10 }}>
                        <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 36, fontWeight: 400, color: "#ababab" }}>Posted on {post.date}</span>
                      </div>
                      <div style={{ padding: 10, width: "100%", boxSizing: "border-box" as const }}>
                        <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 400, color: "#000", lineHeight: "46px" }}>{post.description}</span>
                      </div>
                    </div>
                    <div style={{ paddingLeft: 14, paddingRight: 14, display: "flex", alignItems: "center", gap: 108 }}>
                      {[
                        { icon: A.readBtn, label: "Read", w: 48, h: 48, r: 16, href: `/blog-post/${post.id}` },
                        { icon: A.listenBtn, label: "Listen", w: 43, h: 42, r: 0, href: `https://www.youtube.com/@SimplySharonTips/featured` },
                        { icon: A.watchBtn, label: "Watch", w: 42, h: 42, r: 0, href: `https://www.youtube.com/@SimplySharonTips/featured` },
                      ].map(({ icon, label, w, h, r, href }) => (
                        <Link key={label} href={href}>
                          <div style={{ paddingLeft: 39, paddingRight: 39, paddingTop: 14, paddingBottom: 14, background: "#D4D4D4", borderRadius: 20, display: "flex", alignItems: "center", gap: 23, cursor: "pointer", textDecoration: "none" }}>
                            <img src={icon} alt={label} style={{ width: w, height: h, borderRadius: r }} />
                            <span style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: 40, fontWeight: 700, color: "#000" }}>{label}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                {idx < SEED_POSTS.length - 1 && (
                  <div style={{ height: 40, paddingLeft: 10, paddingRight: 10, paddingTop: 36, paddingBottom: 36, background: "#fff" }}>
                    <div style={{ width: "100%", height: 0, borderTop: "1px solid #000" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ paddingTop: 50, paddingBottom: 82, display: "flex", justifyContent: "center", alignItems: "center", gap: 113 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ height: 86, paddingLeft: 32, paddingRight: 16, paddingTop: 13, paddingBottom: 13, background: "#dadada", borderRadius: 14, border: "none", cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: page === 1 ? 0.5 : 1 }}>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 36, fontWeight: 700, color: "#000" }}>Previous Page</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 35 }}>
              {[1, 2, 3].map((n) => (
                <button key={n} onClick={() => setPage(n)} style={{ width: 87, paddingLeft: 21, paddingRight: 21, paddingTop: 20, paddingBottom: 20, background: page === n ? "#636363" : "#dadada", borderRadius: 45, border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 700, color: page === n ? "#fff" : "#000" }}>{n}</span>
                </button>
              ))}
              <div style={{ padding: 10 }}>
                <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 700, color: "#000" }}>. . .</span>
              </div>
              <button onClick={() => setPage(TOTAL_PAGES)} style={{ paddingLeft: 21, paddingRight: 21, paddingTop: 20, paddingBottom: 20, background: page === TOTAL_PAGES ? "#636363" : "#dadada", borderRadius: 51, border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 40, fontWeight: 700, color: page === TOTAL_PAGES ? "#fff" : "#000" }}>10</span>
              </button>
            </div>
            <button onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1))} disabled={page === TOTAL_PAGES} style={{ width: 276, height: 86, paddingRight: 50, paddingTop: 13, paddingBottom: 13, background: "#dadada", borderRadius: 14, border: "none", cursor: page === TOTAL_PAGES ? "not-allowed" : "pointer", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 74, opacity: page === TOTAL_PAGES ? 0.5 : 1 }}>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 36, fontWeight: 700, color: "#000" }}>Next Page</span>
            </button>
          </div>

        </div>
        <div style={{ height: `calc(5500px * min(1, calc(100vw / 1920)))` }} />
      </div>
      <SiteFooter />
    </div>
  );
}
