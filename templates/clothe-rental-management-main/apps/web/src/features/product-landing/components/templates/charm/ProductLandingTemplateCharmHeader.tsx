"use client";

import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { PaletteSelect } from "@/components/theme/PaletteSelect";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PwaInstallButton } from "@/features/pwa/components/PwaInstallButton";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import type { TemplateCopy } from "./productLandingTemplateCharm.config";

interface ProductLandingTemplateCharmHeaderProps {
  locale: AppLocale;
  brandName: string;
  copy: TemplateCopy;
  authActionLabel: string;
  authHref: string;
  hasCloudSession: boolean;
  homeHref: string;
  siteLogoUrl?: string | null;
  onAuthAction?: () => void | Promise<void>;
  onSubmitSearch: (query: string) => void;
  searchQuery: string;
  shortlistCount: number;
  shortlistHref: string;
  switchLocale: (locale: AppLocale) => void;
}

export function ProductLandingTemplateCharmHeader({
  locale,
  brandName,
  copy,
  authActionLabel,
  authHref,
  hasCloudSession,
  homeHref,
  siteLogoUrl,
  onAuthAction,
  onSubmitSearch,
  searchQuery,
  shortlistCount,
  shortlistHref,
  switchLocale,
}: ProductLandingTemplateCharmHeaderProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);
  const logoSrc = normalizeRenderableImageSrc(siteLogoUrl);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const submitSearch = () => {
    onSubmitSearch(searchInput);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between gap-1.5 px-3 py-3 sm:gap-2 sm:px-4">
        <Link href={homeHref} className="group flex items-center gap-2">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={brandName}
              width={220}
              height={44}
              className="h-9 w-auto max-w-[180px] object-contain md:h-10 md:max-w-[220px]"
            />
          ) : (
            <span
              aria-hidden
              className="block h-9 w-[140px] rounded-md bg-accent/70 md:h-10 md:w-[180px]"
            />
          )}
        </Link>

        <form
          className="hidden w-full max-w-md items-center rounded-full bg-accent px-3 py-2 text-left md:flex"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </form>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="inline-flex rounded-full border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => switchLocale("vi")}
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                locale === "vi"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => switchLocale("en")}
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                locale === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
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
            className="group relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            aria-label={locale === "vi" ? "Giỏ hàng" : "Cart"}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {shortlistCount}
            </span>
          </Link>

          {hasCloudSession ? (
            <button
              type="button"
              onClick={() => void onAuthAction?.()}
              className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 hover:opacity-90 sm:gap-2 sm:px-3"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{authActionLabel}</span>
            </button>
          ) : (
            <Link
              href={authHref}
              className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 hover:opacity-90 sm:gap-2 sm:px-3"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{authActionLabel}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pb-2 md:hidden">
        <form
          className="flex items-center rounded-full bg-accent px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </form>
      </div>
    </header>
  );
}
