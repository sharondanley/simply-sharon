import { ReactNode } from "react";
import { SiteNavbar } from "./SiteNavbar";
import { SiteFooter } from "./SiteFooter";

export const SITE_NAV_OFFSET = "clamp(64px, 5.625vw, 108px)";

export function SiteLayout({
  children,
  background = "#fff",
  includeFooter = true,
}: {
  children: ReactNode;
  background?: string;
  includeFooter?: boolean;
}) {
  return (
    <div style={{ minHeight: "100vh", background, overflowX: "hidden" }}>
      <SiteNavbar />
      <main style={{ paddingTop: SITE_NAV_OFFSET }}>
        {children}
      </main>
      {includeFooter && <SiteFooter />}
    </div>
  );
}
