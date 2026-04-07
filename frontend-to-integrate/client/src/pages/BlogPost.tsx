/**
 * Simply Sharon - Blog Post Page
 * Figma-accurate layout: 1920px scaled, white background, Italianno/Source Sans/Helvetica
 * Static version — no backend required.
 */

import { Link } from "wouter";
import { CommentSection } from "@/components/CommentSection";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

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

const NAV_LINKS = [
  { label: "Blogcast",     href: "/blogcast" },
  { label: "Make-Betters", href: "/#make-betters" },
  { label: "Poise",        href: "/#poise" },
  { label: "About",        href: "/#about" },
  { label: "Archives",     href: "/blogcast" },
  { label: "Contact",      href: "/#connect" },
];

// Viewport-proportional scale: 1920px design shrinks to fit any viewport
const SCALE = "min(1, calc(100vw / 1920))";

export default function BlogPost() {
  return (
    <div style={{ overflowX: "hidden", background: "#fff" }}>

      {/* ── NAVBAR ── */}
      <SiteNavbar />

      {/* ── BLOG PAGE CONTAINER ── */}
      <div style={{ width: "100vw", overflow: "hidden", position: "relative" }}>
        <div style={{
          width: "1920px",
          transformOrigin: "top left", transform: `scale(${SCALE})`,
          background: "#FFFFFF",
          display: "flex", flexDirection: "column", alignItems: "flex-start",
          padding: "0 135px 80px",
          gap: "43px",
        }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", paddingTop: "20px" }}>
            <div style={{ padding: "10px" }}>
              <Link href="/"><img src={ASSETS.breadcrumbIcon} alt="home" style={{ width: "29px", height: "29px", cursor: "pointer" }} /></Link>
            </div>
            <div style={{ padding: "10px" }}>
              <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "24px", fontWeight: 700, color: "#000" }}>
                <Link href="/"><span style={{ cursor: "pointer" }}>home</span></Link>
                {" / "}
                <Link href="/blogcast"><span style={{ cursor: "pointer" }}>Blogcast Home</span></Link>
                {" / Timeless Self-Mastery Post"}
              </span>
            </div>
          </div>

          {/* Post header */}
          <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", alignItems: "flex-start", overflow: "hidden" }}>
              {/* "The Blogcast" */}
              <div style={{ alignSelf: "stretch", padding: "0 156px", display: "flex", justifyContent: "center" }}>
                <span style={{ fontFamily: "Italianno", fontSize: "96px", lineHeight: "120px", color: "#000", textAlign: "center" }}>The Blogcast</span>
              </div>
              {/* Subtitle */}
              <div style={{ alignSelf: "stretch", padding: "0 42px", display: "flex", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "36px", lineHeight: "45px", fontWeight: 700, color: "#000", textAlign: "center" }}>Beauty · Wellness · Wisdom</span>
              </div>
              {/* Post title */}
              <div style={{ alignSelf: "stretch", padding: "46px 10px 0", display: "flex", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "64px", lineHeight: "80px", fontWeight: 700, color: "#000", textAlign: "center" }}>Timeless Self-Mastery Post</span>
              </div>
            </div>
            {/* Separator bar */}
            <div style={{ padding: "36px 10px" }}>
              <div style={{ width: "707px", height: "0", borderTop: "7px solid #000" }} />
            </div>
          </div>

          {/* Post intro section */}
          <div style={{ alignSelf: "stretch", padding: "0 116px", display: "flex", flexDirection: "column", gap: "129px" }}>
            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: "46px" }}>
              {/* Left: text */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "28px" }}>
                <div style={{ padding: "10px" }}>
                  <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "32px", lineHeight: "40px", fontStyle: "italic", color: "#A3A3A3" }}>
                    Aug 12, 2025 | Ep 5<br />By: Sharon Danley, Master Beauty Mentor
                  </span>
                </div>
                <div style={{ alignSelf: "stretch" }}>
                  <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", color: "#000" }}>
                    Over the years, many of you have followed my reflections under the banner of Personal Mastery—a space where we explored beauty, resilience, and what it means to live from the inside out. Today, I'm thrilled to share that this blog, like all of us, is evolving.
                  </span>
                </div>
                <div style={{ alignSelf: "stretch" }}>
                  <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "48px", lineHeight: "55px", fontWeight: 700, color: "#000" }}>
                    Welcome To Timeless Self Mastery
                  </span>
                </div>
                <div style={{ alignSelf: "stretch" }}>
                  <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", color: "#000" }}>
                    This refreshed title reflects the same heart and soul, now expressed with even greater clarity for where we are today.
                  </span>
                </div>
              </div>
              {/* Right: Sharon portrait */}
              <div>
                <img src={ASSETS.sharonPortrait} alt="Sharon Danley" style={{ width: "372px", height: "483px", objectFit: "cover" }} />
              </div>
            </div>
          </div>

          {/* Body paragraph 1 */}
          <div style={{ alignSelf: "stretch", padding: "10px 116px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", color: "#000" }}>
              The wisdom hasn't changed—but the context has. As women over 60, we're not fading into the background. We're editing, refining, and owning every part of our lives—body, mind, and spirit—with a deeper sense of purpose.
              <br /><br />
              <strong>Timeless Self Mastery</strong> is about cultivating strength, simplicity, style &amp; grace in a world that often misunderstands mature beauty. It's about honouring the path we've walked while staying curious, current, and courageously engaged.
              <br /><br />
              You'll find practical insights, soulful reflections, and thoughtful alternatives to what society tries to prescribe for aging. And yes—<strong>beauty rituals will still play a fundamental part</strong>, because they're not just surface work—they're soul work.
              <br /><br />
              <strong>A Quick Note on the Podcast</strong><br />
              If you followed my earlier video reflections and conversations in <strong>"Sharon's Soapbox &amp; Other Stuff"</strong> playlist on YouTube, you'll find them archived into my <strong>new Podcast:</strong>
            </span>
          </div>

          {/* Video thumbnail */}
          <div style={{ alignSelf: "stretch", padding: "10px", display: "flex", justifyContent: "center" }}>
            <a href="https://www.youtube.com/@SimplySharonTips/featured" target="_blank" rel="noopener noreferrer">
              <img
                src={ASSETS.videoThumbnail}
                alt="YouTube video thumbnail"
                style={{ width: "756px", height: "432.55px", objectFit: "cover", cursor: "pointer", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              />
            </a>
          </div>

          {/* Body paragraph 2 */}
          <div style={{ alignSelf: "stretch", padding: "10px 116px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", color: "#000" }}>
              Those viewpoints and insights still carry weight, and I invite you to revisit them along with new material and more coming regularly.
              <br /><br />
              As you read the posts that follow—or listen on the Podcast—I invite you to linger with what resonates. This is more than content. It's a collection of real moments, seasoned insight, and beauty beyond the mirror. I'm so glad you're here.
            </span>
          </div>

          {/* Bold CTA 1 */}
          <div style={{ alignSelf: "stretch", padding: "10px 116px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", fontWeight: 700, color: "#000" }}>
              Want to stay updated? Click the RSS link below to subscribe.
            </span>
          </div>

          {/* Bold CTA 2 */}
          <div style={{ alignSelf: "stretch", padding: "10px 116px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", fontWeight: 700, color: "#000" }}>
              Previous posts will appear below in the "Archive" with the most recent first.
            </span>
          </div>

          {/* Closing paragraph */}
          <div style={{ alignSelf: "stretch", padding: "10px 116px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "36px", lineHeight: "41px", color: "#000" }}>
              Thank you for your openness to evolve. Here's to mastering not just the self—but doing so with grace, grit, and a little glam.
            </span>
          </div>

          {/* Episode's Closing Quote */}
          <div style={{ width: "1650px", padding: "0 116px", display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "113px" }}>
              <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "48px", lineHeight: "60px", fontWeight: 700, color: "#000" }}>
                Episode's Closing Quote
              </span>
              {/* Quote block */}
              <div style={{ alignSelf: "stretch", padding: "37px 0", background: "#D9D9D9", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "43px" }}>
                <div style={{ alignSelf: "stretch", padding: "10px" }}>
                  <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "40px", lineHeight: "50px", fontWeight: 700, color: "#000" }}>
                    "What you do speaks so loudly that I can't hear anything you say."
                  </span>
                </div>
                <div style={{ padding: "10px 47px" }}>
                  <span style={{ fontFamily: "Italianno", fontSize: "64px", lineHeight: "80px", color: "#000" }}>
                    - Ralph Waldo Emerson
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature block */}
          <div style={{ alignSelf: "stretch", padding: "0 116px", display: "flex", flexDirection: "column", gap: "39px" }}>
            <div style={{ alignSelf: "stretch", padding: "10px" }}>
              <span style={{ fontFamily: "'Source Sans Pro', sans-serif", fontSize: "40px", lineHeight: "50px", fontWeight: 700, color: "#000" }}>
                With Warmth &amp; Wisdom,
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div style={{ padding: "10px" }}>
                <span style={{ fontFamily: "Italianno", fontSize: "96px", lineHeight: "120px", color: "#000" }}>Sharon</span>
              </div>
              <div style={{ padding: "10px" }}>
                <img src={ASSETS.heartEmoji} alt="heart" style={{ width: "52px", height: "52px" }} />
              </div>
            </div>
          </div>

          {/* Functional comment section */}
          <div style={{ width: "1574px", padding: "10px 0" }}>
            <CommentSection />
          </div>

        </div>
      </div>

      {/* ── FOOTER ── */}
      <SiteFooter />

    </div>
  );
}
