import type { MetadataRoute } from "next";
import {
  DEFAULT_ANDROID_CHROME_192_URL,
  DEFAULT_ANDROID_CHROME_512_URL,
  DEFAULT_APPLE_TOUCH_ICON_URL,
} from "@/features/branding/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KATA Rental Management",
    short_name: "KATA Rental",
    description: "Clothe rental management app for showroom operations.",
    start_url: "/vi",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "vi",
    background_color: "#f8fbf9",
    theme_color: "#1f8f68",
    categories: ["business", "productivity", "shopping"],
    icons: [
      {
        src: DEFAULT_ANDROID_CHROME_192_URL,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: DEFAULT_ANDROID_CHROME_512_URL,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: DEFAULT_ANDROID_CHROME_512_URL,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: DEFAULT_APPLE_TOUCH_ICON_URL,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
