import type { Config } from "@react-router/dev/config";

const isDesktopBuild = process.env.DESKTOP_BUILD === "true";
const isPublicWebBuild = process.env.VITE_PUBLIC_WEB === "true";

export default {
  ssr: !isDesktopBuild && !isPublicWebBuild,
} satisfies Config;
