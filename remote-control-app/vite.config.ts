import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  root: __dirname,
  publicDir: false,
  plugins: [react(), copyRemoteIcon()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "../src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  server: {
    host: "127.0.0.1",
    port: 3891,
    proxy: {
      "/api": { target: "http://127.0.0.1:8891", changeOrigin: true },
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(""),
    "import.meta.env.VITE_PUBLIC_WEB": JSON.stringify("false"),
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
});

function copyRemoteIcon() {
  return {
    name: "copy-kai-remote-icon",
    closeBundle() {
      fs.copyFileSync(
        path.resolve(__dirname, "../public/favicon.ico"),
        path.resolve(__dirname, "dist/favicon.ico"),
      );
    },
  };
}
