import { useEffect, useState } from "react";

const ASSETS = {
  caricature: "/transparent-caricature-2-2026.png",
};

const FOOTER_BG = "radial-gradient(ellipse 70% 90% at 90% -5%, rgba(200,200,215,0.28) 0%, rgba(160,160,175,0.12) 30%, transparent 60%), linear-gradient(to bottom right, #2a2a32 0%, #2e2e38 40%, #38383f 60%, #2a2a32 100%)";
const DEFAULT_EMAIL = "info@SimplySharon.ca";

const helvetica36 = {
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: "36px",
  lineHeight: "41px",
  color: "#FFFFFF",
} as const;

const sourceSans24 = {
  fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif",
  fontSize: "24px",
  lineHeight: "30px",
  color: "#FFFFFF",
  textAlign: "center" as const,
} as const;

export function SiteFooter() {
  const email = DEFAULT_EMAIL;
  const emailHref = `mailto:${email}`;
  const [footerScale, setFooterScale] = useState(1);

  useEffect(() => {
    const updateScale = () => setFooterScale(Math.min(1, window.innerWidth / 1920));
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <>
      <div
        id="connect"
        className="w-full hidden xl:block"
        style={{
          height: `${1072 * footerScale}px`,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "1920px",
            height: "1072px",
            transformOrigin: "top left",
            transform: `scale(${footerScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "13px 20px",
            gap: "30px",
            background: FOOTER_BG,
          }}
        >
          <div style={{ width: "1556px", paddingTop: "54px", paddingBottom: "54px", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "10px" }}>
            <div style={{ width: "1402px", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "59px" }}>
              <div style={{ width: "1364px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "72px" }}>
                <div style={{ width: "100%", paddingTop: "10px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ fontFamily: "Italianno, cursive", fontWeight: 400, fontSize: "96px", lineHeight: "120px", color: "#FFFFFF", textAlign: "center", paddingLeft: "100px" }}>
                    Connect with Sharon
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "32px", paddingLeft: "100px" }}>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "85px" }}>
                    <span style={{ ...helvetica36, whiteSpace: "nowrap" }}>Email:</span>
                    <a href={emailHref} style={{ ...helvetica36, textDecoration: "underline" }}>{email}</a>
                  </div>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "40px" }}>
                    <span style={{ ...helvetica36, whiteSpace: "nowrap" }}>YouTube:</span>
                    <a href="https://www.youtube.com/@SimplySharonTips/featured" target="_blank" rel="noopener noreferrer" style={{ ...helvetica36, textDecoration: "underline" }}>Youtube.com/@SimplySharonTips</a>
                  </div>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "29px" }}>
                    <span style={{ ...helvetica36, whiteSpace: "nowrap" }}>Instagram:</span>
                    <a href="https://www.instagram.com/danleysharon" target="_blank" rel="noopener noreferrer" style={{ ...helvetica36, textDecoration: "underline" }}>https://www.instagram.com/danleysharon</a>
                  </div>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "29px" }}>
                    <span style={{ ...helvetica36, whiteSpace: "nowrap" }}>Facebook:</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px" }}>
                          <span style={{ ...helvetica36, whiteSpace: "nowrap" }}>Private Group:</span>
                          <a href="https://www.facebook.com/groups/GoinGray.LovinIt" target="_blank" rel="noopener noreferrer" style={{ ...helvetica36, textDecoration: "underline" }}>Facebook.com/groups/GoinGray.LovinIt</a>
                        </div>
                        <p style={{ ...helvetica36, margin: "4px 0 0 0", paddingLeft: "200px" }}>For biological women going gray; please confirm your agreement to the join question.</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "20px" }}>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px" }}>
                          <span style={{ ...helvetica36, whiteSpace: "nowrap" }}>Public Page:</span>
                          <a href="https://www.facebook.com/SharonDanleyBeauty" target="_blank" rel="noopener noreferrer" style={{ ...helvetica36, textDecoration: "underline" }}>Facebook.com/SharonDanleyBeauty</a>
                        </div>
                        <p style={{ ...helvetica36, margin: "4px 0 0 0", paddingLeft: "175px" }}>For everyone, including those who've completed their gray hair journey.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: "242px", display: "flex", justifyContent: "flex-end" }}>
                <img src={ASSETS.caricature} alt="Sharon caricature" style={{ width: "242px", height: "591px", objectFit: "contain" }} />
              </div>
            </div>
          </div>

          <div style={{ width: "1556px", display: "flex", flexDirection: "column", alignItems: "flex-start", paddingLeft: "455px", gap: "24px" }}>
            <p style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: "30px", lineHeight: "38px", color: "#FFFFFF", textAlign: "left", width: "1100px", margin: 0 }}>
              Not monetized, sponsored, or compensated. Shared freely to inspire a <strong>legacy of giving in honour of my children Andrea &amp; Matthew Main</strong> and to encourage paying it forward in your own way.
            </p>
            <p style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", fontSize: "30px", lineHeight: "38px", color: "#FFFFFF", textAlign: "left", margin: 0 }}>© 2025 Sharon Danley | All images, content and design created by Sharon Danley.</p>
            <a
              href="/admin"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "18px",
                lineHeight: "22px",
                color: "rgba(255,255,255,0.46)",
                textDecoration: "none",
                transition: "opacity 0.2s ease",
                paddingLeft: "400px",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.78")}
            >
              Admin
            </a>
          </div>
        </div>
      </div>

      <div className="w-full xl:hidden" style={{ background: FOOTER_BG, padding: "48px 16px", color: "#FFFFFF", overflowX: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", maxWidth: "100%" }}>
          <span style={{ fontFamily: "Italianno, cursive", fontSize: "clamp(40px, 12vw, 56px)", lineHeight: "1.25", textAlign: "center" }}>Connect with Sharon</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px", width: "100%", paddingLeft: "16px" }}>
            <div>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)", color: "#FFFFFF" }}>Email: </span>
              <a href={emailHref} style={{ color: "#FFFFFF", textDecoration: "underline", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)", wordBreak: "break-all" }}>{email}</a>
            </div>
            <div>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)", color: "#FFFFFF" }}>YouTube: </span>
              <a href="https://www.youtube.com/@SimplySharonTips/featured" target="_blank" rel="noopener noreferrer" style={{ color: "#FFFFFF", textDecoration: "underline", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)" }}>Youtube.com/@SimplySharonTips</a>
            </div>
            <div>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)", color: "#FFFFFF" }}>Instagram: </span>
              <a href="https://www.instagram.com/danleysharon" target="_blank" rel="noopener noreferrer" style={{ color: "#FFFFFF", textDecoration: "underline", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)" }}>instagram.com/danleysharon</a>
            </div>
            <div>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)", color: "#FFFFFF" }}>Facebook: </span>
              <a href="https://www.facebook.com/groups/GoinGray.LovinIt" target="_blank" rel="noopener noreferrer" style={{ color: "#FFFFFF", textDecoration: "underline", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)" }}>Private Group</a>
              {" | "}
              <a href="https://www.facebook.com/SharonDanleyBeauty" target="_blank" rel="noopener noreferrer" style={{ color: "#FFFFFF", textDecoration: "underline", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(16px, 4.5vw, 22px)" }}>Public Page</a>
            </div>
          </div>
          <p style={{ ...sourceSans24, fontSize: "clamp(14px, 3.5vw, 18px)", margin: 0, padding: "0 16px" }}>
            Not monetized, sponsored, or compensated. Shared freely to inspire a <strong>legacy of giving in honour of my children Andrea &amp; Matthew Main</strong> and to encourage paying it forward in your own way.
          </p>
          <p style={{ ...sourceSans24, fontSize: "clamp(14px, 3.5vw, 18px)", margin: 0 }}>© 2025 Sharon Danley | All images, content and design created by Sharon Danley.</p>
          <a
            href="/admin"
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "16px",
              lineHeight: "20px",
              color: "rgba(255,255,255,0.52)",
              textDecoration: "none",
            }}
          >
            Admin
          </a>
        </div>
      </div>
    </>
  );
}
