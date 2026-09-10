import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "remote"),
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
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
    outDir: path.resolve(__dirname, "dist-remote"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "remote/index.html"),
    },
  },
});
