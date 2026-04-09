import { useEffect, useState } from "react";

const ASSETS = {
  emailIcon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/footer-email-icon_ef4750a5.webp",
  facebookIcon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/footer-facebook-icon_d509e7df.webp",
  youtubeIcon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/footer-youtube-icon_68ef0cb6.webp",
  caricature: "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/footer-caricature_10d0429b.webp",
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
  const [email, setEmail] = useState(DEFAULT_EMAIL);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/site/personalization", { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error("Failed to load personalization");
        return data as { email?: string | null };
      })
      .then((data) => {
        const nextEmail = data.email?.trim() || DEFAULT_EMAIL;
        if (!cancelled) setEmail(nextEmail);
      })
      .catch(() => {
        if (!cancelled) setEmail(DEFAULT_EMAIL);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const emailHref = `mailto:${email}`;

  return (
    <>
      <div
        id="connect"
        className="w-full hidden md:block"
        style={{
          height: "calc(1072px * min(1, calc(100vw / 1920)))",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "1920px",
            height: "1072px",
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
          <div style={{ width: "1556px", paddingTop: "54px", paddingBottom: "54px", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "10px" }}>
            <div style={{ width: "1402px", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "59px" }}>
              <div style={{ width: "1364px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "72px" }}>
                <div style={{ width: "100%", paddingTop: "10px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ fontFamily: "Italianno, cursive", fontWeight: 400, fontSize: "96px", lineHeight: "120px", color: "#FFFFFF", textAlign: "center" }}>
                    Connect with Sharon
                  </div>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "26px" }}>
                    <a href={emailHref} aria-label="Email Sharon"><img src={ASSETS.emailIcon} alt="Email" style={{ width: "70px", height: "70px", display: "block" }} /></a>
                    <a href="https://www.facebook.com/SharonDanleyBeauty" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><img src={ASSETS.facebookIcon} alt="Facebook" style={{ width: "70px", height: "70px", display: "block" }} /></a>
                    <a href="https://www.youtube.com/@SimplySharonTips/featured" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><img src={ASSETS.youtubeIcon} alt="YouTube" style={{ width: "70px", height: "70px", display: "block" }} /></a>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "32px" }}>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "29px" }}>
                    <span style={{ ...helvetica36, textDecoration: "underline", whiteSpace: "nowrap" }}>Email:</span>
                    <a href={emailHref} style={{ ...helvetica36, textDecoration: "underline" }}>{email}</a>
                  </div>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "29px" }}>
                    <span style={{ ...helvetica36, textDecoration: "underline", whiteSpace: "nowrap" }}>YouTube:</span>
                    <a href="https://www.youtube.com/@SimplySharonTips/featured" target="_blank" rel="noopener noreferrer" style={{ ...helvetica36, textDecoration: "underline" }}>YouTube.com/@SimplySharonTips</a>
                  </div>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "29px" }}>
                    <span style={{ ...helvetica36, textDecoration: "underline", whiteSpace: "nowrap" }}>Facebook:</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <a href="https://www.facebook.com/groups/GoinGray.LovinIt" target="_blank" rel="noopener noreferrer" style={{ ...helvetica36, textDecoration: "underline" }}>Facebook.com/groups/GoinGray.LovinIt</a>
                      <a href="https://www.facebook.com/SharonDanleyBeauty" target="_blank" rel="noopener noreferrer" style={{ ...helvetica36, textDecoration: "underline" }}>Facebook.com/SharonDanleyBeauty</a>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: "242px", display: "flex", justifyContent: "flex-end" }}>
                <img src={ASSETS.caricature} alt="Sharon caricature" style={{ width: "242px", height: "591px", objectFit: "contain" }} />
              </div>
            </div>
          </div>

          <div style={{ width: "1556px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            <p style={{ ...sourceSans24, width: "1320px", margin: 0 }}>
              The information shared on this site is intended for beauty, lifestyle, and personal development inspiration. It does not replace professional medical, legal, or financial advice.
            </p>
            <p style={{ ...sourceSans24, margin: 0 }}>© 2025 Sharon Danley</p>
            <a
              href="/admin"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "18px",
                lineHeight: "22px",
                color: "rgba(255,255,255,0.46)",
                textDecoration: "none",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.78")}
            >
              Admin
            </a>
          </div>
        </div>
      </div>

      <div className="w-full md:hidden" style={{ background: FOOTER_BG, padding: "48px 24px", color: "#FFFFFF" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <span style={{ fontFamily: "Italianno, cursive", fontSize: "56px", lineHeight: "70px" }}>Connect with Sharon</span>
          <div style={{ display: "flex", gap: "20px" }}>
            <a href={emailHref}><img src={ASSETS.emailIcon} alt="Email" style={{ width: 56, height: 56 }} /></a>
            <a href="https://www.facebook.com/SharonDanleyBeauty" target="_blank" rel="noopener noreferrer"><img src={ASSETS.facebookIcon} alt="Facebook" style={{ width: 56, height: 56 }} /></a>
            <a href="https://www.youtube.com/@SimplySharonTips/featured" target="_blank" rel="noopener noreferrer"><img src={ASSETS.youtubeIcon} alt="YouTube" style={{ width: 56, height: 56 }} /></a>
          </div>
          <a href={emailHref} style={{ color: "#FFFFFF", textDecoration: "underline", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "22px" }}>{email}</a>
          <p style={{ ...sourceSans24, margin: 0 }}>© 2025 Sharon Danley</p>
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
