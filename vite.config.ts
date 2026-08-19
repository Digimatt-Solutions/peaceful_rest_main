import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Guarantees the Apache SPA rewrite rules end up in the build output,
// even if the host/zip tooling skips hidden files in `public/`.
const emitHtaccess = (): Plugin => ({
  name: "emit-htaccess",
  apply: "build",
  closeBundle() {
    const src = path.resolve(__dirname, "public/.htaccess");
    if (!fs.existsSync(src)) return;
    const contents = fs.readFileSync(src, "utf8");
    const outDir = path.resolve(__dirname, "dist");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, ".htaccess"), contents);
    // Non-hidden copy: rename to `.htaccess` on the server if hidden files were stripped.
    fs.writeFileSync(path.join(outDir, "htaccess.txt"), contents);
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), emitHtaccess()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
