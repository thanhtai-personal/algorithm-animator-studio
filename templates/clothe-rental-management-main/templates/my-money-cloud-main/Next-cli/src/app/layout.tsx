import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SpendSmart - Quản lý chi tiêu thông minh",
  description:
    "SpendSmart - Ứng dụng quản lý chi tiêu cá nhân thông minh với giao diện 2.5D hoạt hình đẹp mắt",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  other: {
    "google-adsense-account": "ca-pub-1815769508579401",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff8f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1815769508579401"
          crossOrigin="anonymous"
        />
        <Providers>
          <div className="min-h-screen">
            <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4">
              <aside className="hidden 2xl:flex w-[160px] shrink-0 flex-col gap-4 py-6">
                <div className="card-2d flex h-64 items-center justify-center text-xs text-muted-foreground">
                  Quảng cáo
                </div>
              </aside>
              <main className="flex-1 min-w-0">
                <div className="mx-auto w-full max-w-[1260px]">{children}</div>
              </main>
              <aside className="hidden 2xl:flex w-[160px] shrink-0 flex-col gap-4 py-6">
                <div className="card-2d flex h-64 items-center justify-center text-xs text-muted-foreground">
                  Quảng cáo
                </div>
              </aside>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
