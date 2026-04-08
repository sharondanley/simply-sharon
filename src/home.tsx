import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "../Home";

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <Home />
    </StrictMode>
  );
}
