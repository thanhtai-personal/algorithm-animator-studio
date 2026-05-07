"use client";

import Link from "next/link";
import { Search, Settings, ShoppingBag, User } from "lucide-react";
import { PaletteSelect } from "@/components/theme/PaletteSelect";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PwaInstallButton } from "@/features/pwa/components/PwaInstallButton";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import type { PaletteMode, TemplateCopy, TemplateLang, ThemeMode } from "./productLandingTemplate3D.config";
import { ProductLandingTemplate3DSettingsPanel } from "./ProductLandingTemplate3DSettingsPanel";

interface ProductLandingTemplate3DHeaderProps {
  authActionLabel: string;
  authHref: string;
  brandName: string;
  copy: TemplateCopy;
  hasCloudSession: boolean;
  homeHref: string;
  lang: TemplateLang;
  logoUrl: string | null;
  mode: ThemeMode;
  onAuthAction?: () => void | Promise<void>;
  onSelectLanguage: (lang: TemplateLang) => void;
  onSubmitSearch: (query: string) => void;
  palette: PaletteMode;
  scrolled: boolean;
  searchQuery: string;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: PaletteMode) => void;
  setSearchQuery: (query: string) => void;
  setSettingsOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  settingsOpen: boolean;
  shortlistCount: number;
  shortlistHref: string;
}

export function ProductLandingTemplate3DHeader({
  authActionLabel,
  authHref,
  brandName,
  copy,
  hasCloudSession,
  homeHref,
  lang,
  logoUrl,
  mode,
  onAuthAction,
  onSelectLanguage,
  onSubmitSearch,
  palette,
  scrolled,
  searchQuery,
  setMode,
  setPalette,
  setSearchQuery,
  setSettingsOpen,
  settingsOpen,
  shortlistCount,
  shortlistHref,
}: ProductLandingTemplate3DHeaderProps) {
  const logoSrc = normalizeRenderableImageSrc(logoUrl);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "kata3d-glass py-2 shadow-lg shadow-black/20"
            : "bg-[hsl(var(--kata-background)/0.8)] py-3 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between gap-1.5 px-3 sm:gap-3 sm:px-4">
          <Link href={homeHref} className="flex-shrink-0">
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
                className="block h-9 w-[140px] rounded-md bg-[hsl(var(--kata-secondary)/0.5)] md:h-10 md:w-[180px]"
              />
            )}
          </Link>

          <div className="hidden max-w-md flex-1 items-center md:flex">
            <form
              className="relative w-full"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmitSearch(searchQuery);
              }}
            >
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--kata-muted-foreground))]"
              />
              <input
                type="text"
                placeholder={copy.navSearch}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-full border border-[hsl(var(--kata-border)/0.5)] bg-[hsl(var(--kata-secondary)/0.5)] py-2 pl-10 pr-4 text-sm text-[hsl(var(--kata-foreground))] placeholder:text-[hsl(var(--kata-muted-foreground))] transition-all duration-300 focus:border-[hsl(var(--kata-primary)/0.5)] focus:bg-[hsl(var(--kata-secondary)/0.8)] focus:outline-none"
              />
            </form>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="flex items-center rounded-full border border-[hsl(var(--kata-border)/0.3)] bg-[hsl(var(--kata-secondary)/0.5)] p-0.5">
              <button
                type="button"
                onClick={() => onSelectLanguage("vi")}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-300 ${
                  lang === "vi"
                    ? "bg-[hsl(var(--kata-primary))] text-[hsl(var(--kata-primary-foreground))] shadow-sm"
                    : "text-[hsl(var(--kata-muted-foreground))] hover:text-[hsl(var(--kata-foreground))]"
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => onSelectLanguage("en")}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-300 ${
                  lang === "en"
                    ? "bg-[hsl(var(--kata-primary))] text-[hsl(var(--kata-primary-foreground))] shadow-sm"
                    : "text-[hsl(var(--kata-muted-foreground))] hover:text-[hsl(var(--kata-foreground))]"
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

            <button
              type="button"
              onClick={() => setSettingsOpen((value) => !value)}
              className="rounded-full p-2 text-[hsl(var(--kata-muted-foreground))] transition-all duration-300 hover:bg-[hsl(var(--kata-secondary)/0.5)] hover:text-[hsl(var(--kata-foreground))]"
              aria-label={lang === "vi" ? "Mở cài đặt giao diện" : "Open style settings"}
            >
              <Settings
                size={16}
                className={`transition-transform duration-500 ${settingsOpen ? "rotate-90" : ""}`}
              />
            </button>

            <Link
              href={shortlistHref}
              className="relative flex items-center gap-1.5 rounded-full border border-[hsl(var(--kata-border)/0.5)] px-2.5 py-1.5 text-sm text-[hsl(var(--kata-muted-foreground))] transition-all duration-300 hover:bg-[hsl(var(--kata-secondary)/0.5)] hover:text-[hsl(var(--kata-foreground))] sm:px-3"
            >
              <ShoppingBag size={14} />
              <span className="hidden sm:inline">{copy.navCart}</span>
              <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--kata-primary))] text-[10px] font-bold text-[hsl(var(--kata-primary-foreground))]">
                {shortlistCount}
              </span>
            </Link>

            {hasCloudSession ? (
              <button
                type="button"
                onClick={() => void onAuthAction?.()}
                className="flex items-center gap-1 rounded-full border border-[hsl(var(--kata-border)/0.5)] px-2.5 py-1.5 text-sm text-[hsl(var(--kata-muted-foreground))] transition-colors duration-300 hover:bg-[hsl(var(--kata-secondary)/0.5)] hover:text-[hsl(var(--kata-foreground))] sm:gap-1.5 sm:px-3"
              >
                <User size={14} />
                <span className="hidden sm:inline">{authActionLabel}</span>
              </button>
            ) : (
              <Link
                href={authHref}
                className="flex items-center gap-1 rounded-full border border-[hsl(var(--kata-border)/0.5)] px-2.5 py-1.5 text-sm text-[hsl(var(--kata-muted-foreground))] transition-colors duration-300 hover:bg-[hsl(var(--kata-secondary)/0.5)] hover:text-[hsl(var(--kata-foreground))] sm:gap-1.5 sm:px-3"
              >
                <User size={14} />
                <span className="hidden sm:inline">{authActionLabel}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="px-4 pb-2 md:hidden">
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitSearch(searchQuery);
            }}
          >
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--kata-muted-foreground))]"
            />
            <input
              type="text"
              placeholder={copy.navSearch}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-full border border-[hsl(var(--kata-border)/0.5)] bg-[hsl(var(--kata-secondary)/0.5)] py-2 pl-9 pr-4 text-sm text-[hsl(var(--kata-foreground))] placeholder:text-[hsl(var(--kata-muted-foreground))] transition-all focus:border-[hsl(var(--kata-primary)/0.5)] focus:outline-none"
            />
          </form>
        </div>
      </nav>

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-[55] bg-[hsl(var(--kata-background)/0.6)] backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        />
      ) : null}

      <ProductLandingTemplate3DSettingsPanel
        open={settingsOpen}
        copy={copy}
        mode={mode}
        palette={palette}
        lang={lang}
        onSelectLanguage={onSelectLanguage}
        setMode={setMode}
        setPalette={setPalette}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
