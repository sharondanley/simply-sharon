/**
 * SiteFooter — shared across all pages
 *
 * Figma spec (node 106-415):
 *   - Container: 1920×1172px, flex column, align-items center, padding 13px 20px, gap 30px
 *   - Background: Darker-right-4.jpg — dark charcoal with diagonal light streak from upper-right
 *   - connect (106-416): 1556px wide, flex row, padding 54px 0, gap 10px
 *     - connect-row-top (106-417): 1402px wide, flex row, gap 59px
 *       - connect-info (106-418): 1364×715px, flex column, gap 95px
 *         - social-connect (106-419): heading "Connect with Sharon" Italianno 96px + 3 icons 70×70px
 *         - contact-links (106-428): Email / YouTube / Facebook table, Helvetica 36px
 *     - logo-image (106-427): 242×591px caricature portrait (right side)
 *   - disclaimer-paragraph (106-456): Source Sans Pro 24px centered
 *   - copyright (106-478): Source Sans Pro 24px centered
 *
 * Responsive: 1920px inner bar scales with CSS transform; mobile stacks vertically.
 */

import { Link } from "wouter";

// ─── Assets (Figma node IDs → CDN URLs) ──────────────────────────────────────
const ASSETS = {
  emailIcon:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/footer-email-icon_ef4750a5.webp",
  facebookIcon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/footer-facebook-icon_d509e7df.webp",
  youtubeIcon:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/footer-youtube-icon_68ef0cb6.webp",
  caricature:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/footer-caricature_10d0429b.webp",
};

// ─── Background matching Figma "Darker-right-4.jpg" ──────────────────────────
// Strong diagonal light streak from upper-right, dark charcoal base
const FOOTER_BG = "radial-gradient(ellipse 70% 90% at 90% -5%, rgba(200,200,215,0.28) 0%, rgba(160,160,175,0.12) 30%, transparent 60%), linear-gradient(to bottom right, #2a2a32 0%, #2e2e38 40%, #38383f 60%, #2a2a32 100%)";

// ─── Shared text styles ───────────────────────────────────────────────────────
const helvetica36 = {
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: "36px",
  lineHeight: "41px",
  color: "#FFFFFF",
} as const;

const sourceSans36 = {
  fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif",
  fontSize: "36px",
  lineHeight: "45px",
  color: "#FFFFFF",
} as const;

const sourceSans24 = {
  fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif",
  fontSize: "24px",
  lineHeight: "30px",
  color: "#FFFFFF",
  textAlign: "center" as const,
} as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function SiteFooter() {
  return (
    <>
      {/* ── Desktop Footer (md+) — 1920px scaled ─────────────────────────── */}
      <div
        id="connect"
        className="w-full hidden md:block"
        style={{
          height: "calc(1172px * min(1, calc(100vw / 1920)))",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "1920px",
            height: "1172px",
            transformOrigin: "top left",
            transform: "scale(min(1, calc(100vw / 1920)))",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "13px 20px",
            gap: "30px",
            background: FOOTER_BG,
          }}
        >
          {/* connect: 1556px wide, flex row, padding 54px 0, gap 10px */}
          <div
            style={{
              width: "1556px",
              paddingTop: "54px",
              paddingBottom: "54px",
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            {/* connect-row-top: 1402px wide, flex row, gap 59px */}
            <div
              style={{
                width: "1402px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: "59px",
              }}
            >
              {/* connect-info: 1364×715px, flex column, gap 95px */}
              <div
                style={{
                  width: "1364px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: "95px",
                }}
              >
                {/* social-connect: heading + icons */}
                <div
                  style={{
                    width: "100%",
                    paddingTop: "14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: "26px",
                  }}
                >
                  {/* "Connect with Sharon" — Italianno 96px */}
                  <div
                    style={{
                      fontFamily: "Italianno, cursive",
                      fontWeight: 400,
                      fontSize: "96px",
                      lineHeight: "120px",
                      color: "#FFFFFF",
                      textAlign: "center",
                    }}
                  >
                    Connect with Sharon
                  </div>

                  {/* social-media-icons: 3 × 70×70px */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "26px",
                    }}
                  >
                    <a href="mailto:info@SimplySharon.ca" aria-label="Email Sharon">
                      <img
                        src={ASSETS.emailIcon}
                        alt="Email"
                        style={{ width: "70px", height: "70px", display: "block" }}
                      />
                    </a>
                    <a
                      href="https://www.facebook.com/SharonDanleyBeauty"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                    >
                      <img
                        src={ASSETS.facebookIcon}
                        alt="Facebook"
                        style={{ width: "70px", height: "70px", display: "block" }}
                      />
                    </a>
                    <a
                      href="https://www.youtube.com/@SimplySharonTips/featured"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                    >
                      <img
                        src={ASSETS.youtubeIcon}
                        alt="YouTube"
                        style={{ width: "70px", height: "70px", display: "block" }}
                      />
                    </a>
                  </div>
                </div>

                {/* contact-links: Email / YouTube / Facebook table */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: "32px",
                  }}
                >
                  {/* Email row */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "29px",
                    }}
                  >
                    <span style={{ ...helvetica36, textDecoration: "underline", whiteSpace: "nowrap" }}>
                      Email:
                    </span>
                    <a
                      href="mailto:info@SimplySharon.ca"
                      style={{ ...helvetica36, textDecoration: "underline" }}
                    >
                      info@SimplySharon.ca
                    </a>
                  </div>

                  {/* YouTube row */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "29px",
                    }}
                  >
                    <span style={{ ...helvetica36, textDecoration: "underline", whiteSpace: "nowrap" }}>
                      YouTube:
                    </span>
                    <a
                      href="https://www.youtube.com/@SimplySharonTips/featured"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...helvetica36, textDecoration: "underline" }}
                    >
                      YouTube.com/@SimplySharonTips
                    </a>
                  </div>

                  {/* Facebook row */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: "29px",
                    }}
                  >
                    <span style={{ ...helvetica36, textDecoration: "underline", whiteSpace: "nowrap" }}>
                      Facebook:
                    </span>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "32px",
                      }}
                    >
                      {/* Private Group */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <span style={{ ...helvetica36, whiteSpace: "nowrap" }}>
                          Private Group:
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <a
                            href="https://www.facebook.com/groups/GoinGray.LovinIt"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...sourceSans36, textDecoration: "underline" }}
                          >
                            Facebook.com/groups/GoinGray.LovinIt
                          </a>
                          <span style={sourceSans36}>
                            For biological women going gray; please confirm your agreement to the join question.
                          </span>
                        </div>
                      </div>

                      {/* Public Page */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <span style={{ ...helvetica36, whiteSpace: "nowrap" }}>
                          Public Page:
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <a
                            href="https://www.facebook.com/SharonDanleyBeauty"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...sourceSans36, textDecoration: "underline" }}
                          >
                            Facebook.com/SharonDanleyBeauty
                          </a>
                          <span style={sourceSans36}>
                            For everyone, including those who've completed their gray hair journey.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* logo-image: 242×591px caricature on the right */}
            <img
              src={ASSETS.caricature}
              alt="Simply Sharon caricature"
              style={{
                width: "242px",
                height: "591px",
                objectFit: "contain",
                flexShrink: 0,
                alignSelf: "flex-start",
              }}
            />
          </div>

          {/* disclaimer-paragraph: Source Sans 24px centered */}
          <div
            style={{
              width: "990px",
              paddingTop: "32px",
              paddingBottom: "10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <p style={{ ...sourceSans24, margin: 0, width: "1142px" }}>
              Not monetized, sponsored, or compensated. Shared freely to inspire a{" "}
              <strong>legacy of giving in honour of my children Andrea &amp; Matthew Main</strong>{" "}
              and to encourage paying it forward in your own way.
            </p>
          </div>

          {/* copyright */}
          <div
            style={{
              width: "1036px",
              paddingBottom: "7px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p style={{ ...sourceSans24, margin: 0, width: "1130px" }}>
              © 2025 Sharon Danley | All images, content and design created by Sharon Danley.
            </p>
          </div>

          {/* Admin link — hidden, accessible */}
          <div style={{ paddingBottom: "12px", textAlign: "center" }}>
            <Link href="/admin">
              <span
                style={{
                  fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.18)")}
              >
                Admin Login
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile Footer (< md) ─────────────────────────────────────────── */}
      <footer
        id="connect-mobile"
        className="w-full flex md:hidden flex-col items-start px-6 py-10 gap-8"
        style={{ background: FOOTER_BG }}
      >
        {/* Heading */}
        <span
          style={{
            fontFamily: "Italianno, cursive",
            fontSize: "56px",
            lineHeight: "70px",
            color: "#FFFFFF",
          }}
        >
          Connect with Sharon
        </span>

        {/* Social icons */}
        <div style={{ display: "flex", flexDirection: "row", gap: "20px", alignItems: "center" }}>
          <a href="mailto:info@SimplySharon.ca" aria-label="Email Sharon">
            <img src={ASSETS.emailIcon} alt="Email" style={{ width: "48px", height: "48px" }} />
          </a>
          <a href="https://www.facebook.com/SharonDanleyBeauty" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <img src={ASSETS.facebookIcon} alt="Facebook" style={{ width: "48px", height: "48px" }} />
          </a>
          <a href="https://www.youtube.com/@SimplySharonTips/featured" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <img src={ASSETS.youtubeIcon} alt="YouTube" style={{ width: "48px", height: "48px" }} />
          </a>
        </div>

        {/* Contact links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "18px", color: "#fff", textDecoration: "underline" }}>Email:</span>
            <a href="mailto:info@SimplySharon.ca" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "18px", color: "#fff", textDecoration: "underline" }}>info@SimplySharon.ca</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "18px", color: "#fff", textDecoration: "underline" }}>YouTube:</span>
            <a href="https://www.youtube.com/@SimplySharonTips/featured" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "18px", color: "#fff", textDecoration: "underline" }}>YouTube.com/@SimplySharonTips</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "18px", color: "#fff", textDecoration: "underline" }}>Facebook:</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "12px" }}>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "16px", color: "#fff" }}>Private Group:</span>
              <a href="https://www.facebook.com/groups/GoinGray.LovinIt" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "16px", color: "#fff", textDecoration: "underline" }}>Facebook.com/groups/GoinGray.LovinIt</a>
              <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "14px", color: "#ccc" }}>For biological women going gray; please confirm your agreement to the join question.</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "12px" }}>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "16px", color: "#fff" }}>Public Page:</span>
              <a href="https://www.facebook.com/SharonDanleyBeauty" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "16px", color: "#fff", textDecoration: "underline" }}>Facebook.com/SharonDanleyBeauty</a>
              <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "14px", color: "#ccc" }}>For everyone, including those who've completed their gray hair journey.</span>
            </div>
          </div>
        </div>

        {/* Caricature + disclaimer */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "16px", width: "100%" }}>
          <img src={ASSETS.caricature} alt="Simply Sharon caricature" style={{ width: "100px", height: "244px", objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "13px", lineHeight: "18px", color: "#fff", margin: 0, textAlign: "center" }}>
              Not monetized, sponsored, or compensated. Shared freely to inspire a{" "}
              <strong>legacy of giving in honour of my children Andrea &amp; Matthew Main</strong>{" "}
              and to encourage paying it forward in your own way.
            </p>
            <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "12px", lineHeight: "16px", color: "#ccc", margin: 0, textAlign: "center" }}>
              © 2025 Sharon Danley | All images, content and design created by Sharon Danley.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
