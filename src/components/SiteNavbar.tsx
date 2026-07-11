import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/navbar-logo_a2b46c10.webp";

type NavLink = {
  label: string;
  href: string;
  targetId?: string;
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { label: "Blogcast", href: "/#blogcast", targetId: "blogcast" },
  { label: "Make-Betters", href: "/#make-betters", targetId: "make-betters" },
  { label: "Poise", href: "/#poise", targetId: "poise" },
  { label: "About", href: "/#about", targetId: "about" },
  { label: "Archives", href: "https://sharondanley.com/Blog.htm", external: true },
  { label: "Contact", href: "/#connect", targetId: "connect" },
];

const NAVBAR_BG = `
  radial-gradient(
    ellipse 60% 120% at 82% -10%,
    rgba(180, 180, 195, 0.22) 0%,
    transparent 55%
  ),
  linear-gradient(
    to right,
    #28282f 0%,
    #2e2e38 35%,
    #3a3a44 55%,
    #2e2e38 75%,
    #242430 100%
  )
`.trim();

export function SiteNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navScale, setNavScale] = useState(1);

  useEffect(() => {
    const updateScale = () => setNavScale(Math.min(1, window.innerWidth / 1920));
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, link: NavLink) => {
    if (link.external || !link.targetId || typeof window === "undefined") {
      setMobileOpen(false);
      return;
    }

    const isHomePage = window.location.pathname === "/" || window.location.pathname === "" || window.location.pathname.endsWith("/index.html");

    if (!isHomePage) {
      setMobileOpen(false);
      return;
    }

    const target = document.getElementById(link.targetId);
    if (!target) {
      setMobileOpen(false);
      return;
    }

    event.preventDefault();
    setMobileOpen(false);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${link.targetId}`);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full">
      <div
        className="w-full hidden xl:block"
        style={{
          height: `${108 * navScale}px`,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "1920px",
            height: "108px",
            transformOrigin: "top left",
            transform: `scale(${navScale})`,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "0 60px",
            background: NAVBAR_BG,
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "15px",
              height: "108px",
              cursor: "pointer",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <img
              src={LOGO_URL}
              alt="Simply Sharon logo"
              style={{ width: "75px", height: "108px", objectFit: "contain", display: "block", transform: "scaleX(-1)", transformOrigin: "center" }}
            />
            <span
              style={{
                fontFamily: "Italianno, cursive",
                fontWeight: 400,
                fontSize: "64px",
                lineHeight: "80px",
                color: "#FFFFFF",
                whiteSpace: "nowrap",
              }}
            >
              SimplySharon
            </span>
          </a>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: "26px",
              height: "108px",
              marginLeft: "380px",
            }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                style={{
                  fontFamily: "'Source Sans 3', 'Source Sans Pro', Helvetica, Arial, sans-serif",
                  fontWeight: 400,
                  fontSize: "34px",
                  lineHeight: "40px",
                  color: "#FFFFFF",
                  filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.25))",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "opacity 0.15s",
                }}
                onClick={(event) => handleNavClick(event, link)}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.72")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <nav
        className="w-full flex xl:hidden items-center justify-between px-5 z-30"
        style={{ height: "64px", background: NAVBAR_BG, flexShrink: 0 }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img src={LOGO_URL} alt="Simply Sharon logo" style={{ width: "40px", height: "58px", objectFit: "contain", transform: "scaleX(-1)", transformOrigin: "center" }} />
          <span style={{ fontFamily: "Italianno, cursive", fontSize: "36px", lineHeight: "45px", color: "#FFFFFF" }}>
            SimplySharon
          </span>
        </a>
        <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center text-white" aria-label="Open navigation">
          <Menu size={24} />
        </button>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
          style={{ background: "rgba(28, 28, 36, 0.97)" }}
        >
          <button className="absolute top-5 right-5 text-white" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={28} />
          </button>
          <span style={{ fontFamily: "Italianno, cursive", fontSize: "56px", lineHeight: "70px", color: "#FFFFFF", marginBottom: "8px" }}>
            Simply Sharon
          </span>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              onClick={(event) => handleNavClick(event, link)}
              style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "28px", fontWeight: 700, color: "#FFFFFF", textDecoration: "none" }}
            >
              {link.label}
            </a>
          ))}
          <a href="/admin" onClick={() => setMobileOpen(false)} style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: "22px", color: "#d1d5db", textDecoration: "none" }}>
            Admin
          </a>
        </div>
      )}
    </div>
  );
}
