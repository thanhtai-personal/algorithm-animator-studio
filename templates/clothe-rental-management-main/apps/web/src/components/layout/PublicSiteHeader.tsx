"use client";

import Link from "next/link";
import { House, LogIn, LogOut, Search, ShoppingCart } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { AppLocale } from "@/constants/locale";
import { PaletteSelect } from "@/components/theme/PaletteSelect";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PwaInstallButton } from "@/features/pwa/components/PwaInstallButton";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";

interface PublicSiteHeaderCopy {
  brand: string;
  homeAction: string;
  searchPlaceholder: string;
  cartLabel: string;
  loginAction: string;
  logoutAction: string;
  searchToggleAriaLabel: string;
}

interface PublicSiteHeaderHrefs {
  home: string;
  showroom: string;
  shortlist: string;
  auth: string;
}

interface PublicSiteHeaderProps {
  copy: PublicSiteHeaderCopy;
  currentLocale: AppLocale;
  switchLocale: (locale: AppLocale) => void;
  searchOpen: boolean;
  setSearchOpen: Dispatch<SetStateAction<boolean>>;
  searchQuery: string;
  submitSearch: (rawValue: string) => void;
  siteLogoUrl: string | null;
  shortlistCount: number;
  isHomeActive: boolean;
  isShortlistActive: boolean;
  hrefs: PublicSiteHeaderHrefs;
  hasCloudSession: boolean;
  handleSignOut: () => void | Promise<void>;
}

export function PublicSiteHeader({
  copy,
  currentLocale,
  switchLocale,
  searchOpen,
  setSearchOpen,
  searchQuery,
  submitSearch,
  siteLogoUrl,
  shortlistCount,
  isHomeActive,
  isShortlistActive,
  hrefs,
  hasCloudSession,
  handleSignOut,
}: PublicSiteHeaderProps) {
  const logoSrc = normalizeRenderableImageSrc(siteLogoUrl);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <Link href={hrefs.showroom} className="text-xl font-bold tracking-tight text-foreground">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={copy.brand}
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

        <div className="hidden items-center gap-2 md:flex">
          <form
            key={`desktop:${currentLocale}:${searchQuery}`}
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const value = formData.get("q");
              submitSearch(typeof value === "string" ? value : "");
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="search"
              defaultValue={searchQuery}
              aria-label={copy.searchPlaceholder}
              placeholder={copy.searchPlaceholder}
              className="h-9 w-64 rounded-lg border-0 bg-accent pl-9 pr-4 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </form>

          <div className="inline-flex h-9 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => switchLocale("vi")}
              className={`rounded-md px-2.5 text-[11px] font-bold ${
                currentLocale === "vi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => switchLocale("en")}
              className={`rounded-md px-2.5 text-[11px] font-bold ${
                currentLocale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={copy.searchToggleAriaLabel}
            onClick={() => setSearchOpen((previous) => !previous)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <ThemeToggle />
          <PaletteSelect />
          <PwaInstallButton />

          <Link
            href={hrefs.home}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
              isHomeActive
                ? "border-border bg-accent text-foreground"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <House className="h-4 w-4" />
            <span className="hidden sm:inline">{copy.homeAction}</span>
          </Link>

          <Link
            href={hrefs.shortlist}
            aria-label={`${copy.cartLabel} (${shortlistCount})`}
            className={`relative inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
              isShortlistActive
                ? "border-border bg-accent text-foreground"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{copy.cartLabel}</span>
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {shortlistCount}
            </span>
          </Link>

          {hasCloudSession ? (
            <>
              <button
                type="button"
                aria-label={copy.logoutAction}
                title={copy.logoutAction}
                onClick={() => void handleSignOut()}
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/35 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15 sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="ml-2 hidden text-xs text-muted-foreground transition-colors hover:text-primary sm:block"
              >
                {copy.logoutAction}
              </button>
            </>
          ) : (
            <>
              <Link
                href={hrefs.auth}
                aria-label={copy.loginAction}
                title={copy.loginAction}
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-success/35 bg-success/10 text-success transition-colors hover:bg-success/15 sm:hidden"
              >
                <LogIn className="h-4 w-4" />
              </Link>
              <Link
                href={hrefs.auth}
                className="ml-2 hidden text-xs text-muted-foreground transition-colors hover:text-primary sm:block"
              >
                {copy.loginAction}
              </Link>
            </>
          )}
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-border px-4 pb-3 pt-2 md:hidden">
          <div className="mb-2 inline-flex h-9 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => switchLocale("vi")}
              className={`rounded-md px-2.5 text-[11px] font-bold ${
                currentLocale === "vi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => switchLocale("en")}
              className={`rounded-md px-2.5 text-[11px] font-bold ${
                currentLocale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              EN
            </button>
          </div>

          <form
            key={`mobile:${currentLocale}:${searchQuery}`}
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const value = formData.get("q");
              submitSearch(typeof value === "string" ? value : "");
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              name="q"
              type="search"
              defaultValue={searchQuery}
              aria-label={copy.searchPlaceholder}
              placeholder={copy.searchPlaceholder}
              className="h-10 w-full rounded-lg border-0 bg-accent pl-9 pr-4 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </form>
        </div>
      ) : null}
    </header>
  );
}
