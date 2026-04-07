import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BlogcastArchive from "../BlogcastArchive";
import BlogPost from "../BlogPost";

function BlogApp() {
  const pathname = window.location.pathname;

  if (pathname.startsWith("/blogcast/")) {
    return <BlogPost slug={decodeURIComponent(pathname.replace("/blogcast/", ""))} />;
  }

  if (pathname.startsWith("/blog-post/")) {
    const id = Number(pathname.replace("/blog-post/", ""));
    return <BlogPost id={Number.isFinite(id) ? id : undefined} />;
  }

  return <BlogcastArchive />;
}

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <BlogApp />
    </StrictMode>
  );
}