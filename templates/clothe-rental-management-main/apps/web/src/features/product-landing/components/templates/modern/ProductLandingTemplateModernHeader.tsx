"use client";

import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { PaletteSelect } from "@/components/theme/PaletteSelect";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PwaInstallButton } from "@/features/pwa/components/PwaInstallButton";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";

interface ProductLandingTemplateModernHeaderProps {
  authActionLabel: string;
  authHref: string;
  cartLabel: string;
  hasCloudSession: boolean;
  currentLocale: AppLocale;
  homeHref: string;
  initialSearchQuery?: string;
  siteLogoUrl?: string | null;
  onAuthAction?: () => void | Promise<void>;
  onSwitchLocale: (locale: AppLocale) => void;
  onSubmitSearch: (query: string) => void;
  searchPlaceholder: string;
  shortlistCount: number;
  shortlistHref: string;
}

export function ProductLandingTemplateModernHeader({
  authActionLabel,
  authHref,
  cartLabel,
  hasCloudSession,
  currentLocale,
  homeHref,
  initialSearchQuery,
  siteLogoUrl,
  onAuthAction,
  onSwitchLocale,
  onSubmitSearch,
  searchPlaceholder,
  shortlistCount,
  shortlistHref,
}: ProductLandingTemplateModernHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const searchInputDefault = initialSearchQuery ?? "";
  const logoSrc = normalizeRenderableImageSrc(siteLogoUrl);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (query: string) => {
    onSubmitSearch(query);
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "kata-modern-glass-nav shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4 lg:px-8">
        <Link
          href={homeHref}
          className="flex-shrink-0"
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Site logo"
              width={220}
              height={44}
              className="h-9 w-auto max-w-[180px] object-contain md:h-10 md:max-w-[220px]"
            />
          ) : (
            <span
              aria-hidden
              className="block h-9 w-[140px] rounded-md bg-secondary/40 md:h-10 md:w-[180px]"
            />
          )}
        </Link>

        <div className="mx-6 hidden max-w-md flex-1 md:flex">
          <form
            key={`desktop-search:${currentLocale}:${searchInputDefault}`}
            className="group flex w-full items-center gap-2 rounded-full border border-border/30 bg-secondary/80 px-4 py-2 backdrop-blur-sm transition-colors duration-300 hover:border-primary/30"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const value = formData.get("q");
              submitSearch(typeof value === "string" ? value : "");
            }}
          >
            <Search className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            <input
              name="q"
              type="text"
              defaultValue={searchInputDefault}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>

        <div className="ml-1.5 flex items-center gap-0.5 sm:ml-2 sm:gap-1">
          <div className="mr-1 inline-flex rounded-full border border-border/50 bg-secondary/50 p-0.5">
            <button
              type="button"
              onClick={() => onSwitchLocale("vi")}
              className={`rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                currentLocale === "vi"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => onSwitchLocale("en")}
              className={`rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                currentLocale === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
          </div>

          <ThemeToggle />
          <div className="hidden min-[420px]:block">
            <PaletteSelect />
          </div>
          <div className="hidden min-[420px]:block">
            <PwaInstallButton />
          </div>

          <Link
            href={shortlistHref}
            className="relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary/60 hover:text-foreground sm:px-3"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden lg:inline">{cartLabel}</span>
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground lg:static">
              {shortlistCount}
            </span>
          </Link>

          {hasCloudSession ? (
            <button
              type="button"
              onClick={() => void onAuthAction?.()}
              className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 hover:opacity-90 sm:gap-1.5 sm:px-4"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{authActionLabel}</span>
            </button>
          ) : (
            <Link
              href={authHref}
              className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 hover:opacity-90 sm:gap-1.5 sm:px-4"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{authActionLabel}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pb-2 md:hidden">
        <form
          key={`mobile-search:${currentLocale}:${searchInputDefault}`}
          className="flex items-center gap-2 rounded-full border border-border/30 bg-secondary/80 px-4 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const value = formData.get("q");
            submitSearch(typeof value === "string" ? value : "");
          }}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            type="text"
            defaultValue={searchInputDefault}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </form>
      </div>
    </header>
  );
}
