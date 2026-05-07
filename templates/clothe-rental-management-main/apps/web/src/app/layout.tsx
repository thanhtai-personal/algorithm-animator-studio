import type { Metadata, Viewport } from "next";
import { cache } from "react";
import {
  DEFAULT_APPLE_TOUCH_ICON_URL,
  DEFAULT_FAVICON_16_URL,
  DEFAULT_FAVICON_32_URL,
  DEFAULT_FAVICON_ICO_URL,
  DEFAULT_SEO_OG_IMAGE_URL,
  DEFAULT_SEO_TWITTER_IMAGE_URL,
  DEFAULT_SITE_LOGO_URL,
} from "@/features/branding/constants";
import { getPublicSiteBrandingFromNest } from "@/server/services/publicBrandingService";
import "./globals.css";
import { Providers } from "./providers";

const APP_NAME = "KATA Rental Management";
const APP_DESCRIPTION = "A modern clothe rental management application";
const DEFAULT_SITE_URL = "https://www.kata.makeup";

function resolveMetadataBase(): URL {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (candidate) {
    try {
      return new URL(candidate);
    } catch {
      // Fall through to localhost fallback for invalid env values.
    }
  }

  return new URL(DEFAULT_SITE_URL);
}

const getSeoBranding = cache(async () => {
  return getPublicSiteBrandingFromNest();
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getSeoBranding();
  const seoLogo = branding.siteLogoUrl ?? DEFAULT_SITE_LOGO_URL;
  const seoOgImage = branding.siteLogoUrl ?? DEFAULT_SEO_OG_IMAGE_URL;
  const seoTwitterImage = branding.siteLogoUrl ?? DEFAULT_SEO_TWITTER_IMAGE_URL;

  return {
    metadataBase: resolveMetadataBase(),
    title: APP_NAME,
    description: APP_DESCRIPTION,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: DEFAULT_FAVICON_ICO_URL },
        { url: DEFAULT_FAVICON_32_URL, sizes: "32x32", type: "image/png" },
        { url: DEFAULT_FAVICON_16_URL, sizes: "16x16", type: "image/png" },
      ],
      shortcut: [{ url: DEFAULT_FAVICON_ICO_URL }],
      apple: [{ url: DEFAULT_APPLE_TOUCH_ICON_URL, sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "KATA Rental",
    },
    openGraph: {
      type: "website",
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [
        {
          url: seoOgImage,
          width: 1200,
          height: 630,
          alt: APP_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [seoTwitterImage],
    },
    other: {
      "msapplication-TileImage": seoLogo,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1f8f68",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full" suppressHydrationWarning>
      <body className="antialiased min-h-screen min-h-[100dvh]" suppressHydrationWarning>
        <Providers>
          <main className="min-h-screen min-h-[100dvh]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
