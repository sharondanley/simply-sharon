// build-server.mjs
// Bundles the Express server using esbuild's JavaScript API (no native binary CLI needed).
// This avoids the EACCES permission error on Hostinger's shared hosting environment.
import { build } from "esbuild";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.join(__dirname, "server/_core/index.ts")],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: path.join(__dirname, "dist"),
  logLevel: "info",
});

console.log("✓ Server bundle written to dist/index.js");
