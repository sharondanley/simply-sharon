/**
 * SiteNavbar — shared across all pages
 *
 * Figma spec (node 111-531):
 *   - Container: 1920×108px, flex row, align-items center, gap 512px
 *   - Background: dark charcoal gradient with subtle diagonal light streak
 *   - brand-logo (111-532): flex row, gap 15px
 *     - site-logo (111-533): 75×108px — caricature portrait in circle
 *     - site-name (111-535): Italianno 64px, white
 *   - navlink-group (111-536): flex-1, justify-center, gap 26px
 *     - each nav-link: Inter 26px, white, drop-shadow(0 4px 4px rgba(0,0,0,0.25))
 *
 * The 1920px inner bar is CSS-scaled to fit any viewport.
 * Mobile: hamburger with full-screen overlay.
 */

import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

// ─── Assets ──────────────────────────────────────────────────────────────────
// Figma node 111-533 — caricature portrait in circle
const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663293754909/S7VRvsAR3NFvJQTWWaYkyz/navbar-logo_a2b46c10.webp";

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Blogcast",     href: "/blogcast" },
  { label: "Make-Betters", href: "/#make-betters" },
  { label: "Poise",        href: "/#poise" },
  { label: "About",        href: "/#about" },
  { label: "Archives",     href: "/blogcast" },
  { label: "Contact",      href: "/#connect" },
];

// ─── Background ───────────────────────────────────────────────────────────────
// Matches the Figma "Darker-right-1.jpg" — dark charcoal with a soft
// light streak emanating from the upper-right quadrant.
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

// ─── Component ────────────────────────────────────────────────────────────────
export function SiteNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 w-full">
      {/* ── Desktop Navbar (md+) ─────────────────────────────────────────── */}
      <div
        className="w-full hidden md:block"
        style={{
          height: "calc(108px * min(1, calc(100vw / 1920)))",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* 1920px inner bar — scales proportionally to viewport */}
        <div
          style={{
            width: "1920px",
            height: "108px",
            transformOrigin: "top left",
            transform: "scale(min(1, calc(100vw / 1920)))",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "0 60px",
            background: NAVBAR_BG,
          }}
        >
          {/* brand-logo: flex row, gap 15px (Figma node 111-532) */}
          <Link href="/">
            <div
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
              {/* site-logo: 75×108px (Figma node 111-533) */}
              <img
                src={LOGO_URL}
                alt="Simply Sharon logo"
                style={{
                  width: "75px",
                  height: "108px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              {/* site-name: Italianno 64px white (Figma node 111-535) */}
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
            </div>
          </Link>

          {/* navlink-group: flex-1, justify-center, gap 26px (Figma node 111-536) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: "26px",
              height: "108px",
            }}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href}>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    fontSize: "26px",
                    lineHeight: "31px",
                    color: "#FFFFFF",
                    filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.25))",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    textDecoration: "none",
                    display: "inline-block",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.opacity = "0.72")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.opacity = "1")
                  }
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Navbar (< md) ─────────────────────────────────────────── */}
      <nav
        className="w-full flex md:hidden items-center justify-between px-5 z-30"
        style={{
          height: "64px",
          background: NAVBAR_BG,
          flexShrink: 0,
        }}
      >
        <Link href="/">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <img
              src={LOGO_URL}
              alt="Simply Sharon logo"
              style={{ width: "40px", height: "58px", objectFit: "contain" }}
            />
            <span
              style={{
                fontFamily: "Italianno, cursive",
                fontSize: "36px",
                lineHeight: "45px",
                color: "#FFFFFF",
              }}
            >
              SimplySharon
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-white"
          aria-label="Open navigation"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* ── Mobile full-screen overlay ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
          style={{ background: "rgba(28, 28, 36, 0.97)" }}
          onClick={() => setMobileOpen(false)}
        >
          <button
            className="absolute top-5 right-5 text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={28} />
          </button>
          <span
            style={{
              fontFamily: "Italianno, cursive",
              fontSize: "56px",
              lineHeight: "70px",
              color: "#FFFFFF",
              marginBottom: "8px",
            }}
          >
            Simply Sharon
          </span>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} onClick={() => setMobileOpen(false)}>
              <span
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#d1d5db")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#FFFFFF")
                }
              >
                {label}
              </span>
            </Link>
          ))}
          <Link href="/admin" onClick={() => setMobileOpen(false)}>
            <span
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "14px",
                color: "#9ca3af",
                marginTop: "24px",
                cursor: "pointer",
              }}
            >
              Admin Login
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
