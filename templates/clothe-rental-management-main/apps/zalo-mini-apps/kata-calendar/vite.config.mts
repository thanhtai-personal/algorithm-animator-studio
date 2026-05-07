import { defineConfig } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    base: "",
    plugins: [zaloMiniApp(), react()],
    server: {
      host: "0.0.0.0",
      port: 5177,
    },
    build: {
      assetsInlineLimit: 0,
    },
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
  });
};
