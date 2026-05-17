import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import "dotenv/config";

const DEFAULT_CLIENT_ORIGIN = "http://localhost:6868";
const isDesktopBuild = process.env.DESKTOP_BUILD === "true";
const DEFAULT_SERVER_ORIGIN = "http://127.0.0.1:8888";

function normalizeLocalOrigin(value: string | undefined, legacyValues: string[], fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed || legacyValues.includes(trimmed)) {
    return fallback;
  }

  return trimmed;
}

const clientOrigin = normalizeLocalOrigin(
  process.env.CLIENT_ORIGIN || process.env.VITE_CLIENT_ORIGIN,
  ["http://localhost:5173", "http://localhost:6666", "http://localhost:6677"],
  DEFAULT_CLIENT_ORIGIN
);
const clientPort = Number(process.env.VITE_CLIENT_PORT || process.env.CLIENT_PORT || 6868);
const serverOrigin = normalizeLocalOrigin(
  process.env.SERVER_ORIGIN || process.env.VITE_API_URL,
  ["http://localhost:5050"],
  DEFAULT_SERVER_ORIGIN
);

const appPlugins: PluginOption[] = [
  tailwindcss(),
  reactRouter(),
];

// Bản desktop/Electron không nên đăng ký PWA/service worker.
// Nếu service worker từ build cũ cache shell sai origin/port, app có thể chỉ hiện nền tối khi mở EXE.
if (!isDesktopBuild) {
  appPlugins.push(
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo.png"],
      manifest: {
        name: "Kata Studio",
        short_name: "Kata Studio",
        description: "Local voice, video creation, and YouTube publishing studio.",
        theme_color: "#8b5cf6",
        background_color: "#070717",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "/"
      },
      devOptions: {
        enabled: true
      }
    })
  );
}

export default defineConfig({
  base: "/",
  plugins: appPlugins,
  server: {
    port: clientPort,
    strictPort: true,
    proxy: {
      "/api": {
        target: serverOrigin,
        changeOrigin: true,
        secure: false,
      },
      "/generated": {
        target: serverOrigin,
        changeOrigin: true,
        secure: false,
      },
      "/generated-videos": {
        target: serverOrigin,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
});
