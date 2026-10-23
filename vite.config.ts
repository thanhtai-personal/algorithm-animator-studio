import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    allowedHosts: ["kai-studio.pro"],
    https: localHttpsConfig(),
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": { target: "http://localhost:5050", changeOrigin: true, ws: true },
      "/generated": { target: "http://localhost:5050", changeOrigin: true },
      "/generated-previews": { target: "http://localhost:5050", changeOrigin: true },
      "/generated-videos": { target: "http://localhost:5050", changeOrigin: true },
      "/background-music": { target: "http://localhost:5050", changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/phaser/")) return "vendor-phaser";
        },
      },
    },
  },
}));

function localHttpsConfig() {
  const certPath = path.resolve(__dirname, ".certs/kai-studio.pro.pem");
  const keyPath = path.resolve(__dirname, ".certs/kai-studio.pro-key.pem");
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) return undefined;
  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
}
