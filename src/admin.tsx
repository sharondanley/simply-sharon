import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import AdminPanel from "../AdminPanel";

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <Toaster richColors position="top-right" />
      <AdminPanel />
    </StrictMode>
  );
}
