"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AppLocale } from "@/constants/locale";
import { useLocaleSwitch } from "@/features/app-shell/hooks/useLocaleSwitch";
import { useHomeSessionPanel } from "@/features/auth/hooks/home/useHomeSessionPanel";
import { usePublicBrandingQuery } from "@/features/branding/queries/useBrandingQueries";
import { brandingStore } from "@/features/branding/stores/brandingStore";
import { useShowroomConfigQuery } from "@/features/showroom/queries/useShowroomQueries";
import {
  DEFAULT_SITE_LOGO_DARK_URL,
  DEFAULT_SITE_LOGO_URL,
} from "@/features/branding/constants";
import { parsePublicContactInfo } from "@/lib/publicContactInfo";
import { parsePublicSocialLinks } from "@/lib/publicSocialLinks";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import { useThemeMode } from "@/lib/themeVariants";
import { showroomStore } from "@/features/showroom/stores/showroomStore";
import {
  buildBranchProductPath,
  buildShowroomBasePath,
  buildShowroomShortlistPath,
  extractBranchSlugFromPath,
  extractShopDomainFromPath,
  extractShowroomSlugFromPath,
} from "@/features/showroom/utils/paths";
import { localizePathname, stripLocaleFromPathname } from "@/utils/locale";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";

interface ShowroomShellCopy {
  brand: string;
  homeAction: string;
  searchPlaceholder: string;
  cartLabel: string;
  loginAction: string;
  logoutAction: string;
  searchToggleAriaLabel: string;
  footer: string;
}

interface UseShowroomShellOptions {
  initialConfig?: PublicShowroomPageConfigDto | null;
}

const SHOWROOM_SHELL_COPY_BASE: Record<
  AppLocale,
  Omit<ShowroomShellCopy, "brand" | "footer"> & {
    brandSuffix: string;
    footerSuffix: string;
  }
> = {
  vi: {
    brandSuffix: "Phòng trưng bày",
    homeAction: "Trang chủ",
    searchPlaceholder: "Tìm trang phục...",
    cartLabel: "Giỏ hàng",
    loginAction: "Đăng nhập",
    logoutAction: "Đăng xuất",
    searchToggleAriaLabel: "Mở thanh tìm kiếm",
    footerSuffix: "Phòng trưng bày. Hệ thống thuê trang phục.",
  },
  en: {
    brandSuffix: "Showroom",
    homeAction: "Home",
    searchPlaceholder: "Search outfits...",
    cartLabel: "Cart",
    loginAction: "Login",
    logoutAction: "Logout",
    searchToggleAriaLabel: "Open search bar",
    footerSuffix: "Showroom. Clothing rental system.",
  },
};

function buildShowroomShellCopy(
  locale: AppLocale,
  branchName: string | null
): ShowroomShellCopy {
  const base = SHOWROOM_SHELL_COPY_BASE[locale];
  const normalizedBranchName = branchName?.trim() || "KATA";

  return {
    brand: `${normalizedBranchName} ${base.brandSuffix}`,
    homeAction: base.homeAction,
    searchPlaceholder: base.searchPlaceholder,
    cartLabel: base.cartLabel,
    loginAction: base.loginAction,
    logoutAction: base.logoutAction,
    searchToggleAriaLabel: base.searchToggleAriaLabel,
    footer: `© 2026 ${normalizedBranchName} ${base.footerSuffix}`,
  };
}

function parseObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveShowroomPageLogoUrl(
  config: PublicShowroomPageConfigDto | null | undefined
): string | null {
  if (!config) return null;

  const themeConfig = parseObject(config.themeConfigJson);
  const themeMeta = parseObject(themeConfig.meta);
  const heroConfig = parseObject(config.heroConfigJson);

  return normalizeRenderableImageSrc(
    readString(themeMeta.pageLogoUrl) ?? readString(heroConfig.pageLogoUrl)
  );
}

export function useShowroomShell(options?: UseShowroomShellOptions) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentLocale, switchLocale } = useLocaleSwitch();
  const { mode } = useThemeMode();
  const pathWithoutLocale = stripLocaleFromPathname(pathname);
  const activeShopDomain = extractShopDomainFromPath(pathWithoutLocale);
  const activeBranchSlug = extractBranchSlugFromPath(pathWithoutLocale);
  const activeShowroomSlug = extractShowroomSlugFromPath(pathWithoutLocale);
  const isShopDomainHomePath =
    Boolean(activeShopDomain) && pathWithoutLocale === `/${activeShopDomain}`;
  usePublicBrandingQuery();
  const showroomConfigQuery = useShowroomConfigQuery({
    locale: currentLocale,
    showroomSlug: activeShowroomSlug,
    branchSlug: activeBranchSlug,
    shopDomain: activeShopDomain,
    initialData: options?.initialConfig ?? undefined,
  });
  const { hasCloudSession, handleSignOut } = useHomeSessionPanel();
  const [searchOpen, setSearchOpen] = useState(false);

  useLayoutEffect(() => {
    showroomStore.ensureShortlistHydrated();
  }, []);

  const searchQuery = searchParams.get("q") ?? "";
  const currentConfig = showroomConfigQuery.data ?? showroomStore.config ?? null;
  const branchNameFromConfig =
    currentConfig?.branchName?.trim() ||
    null;
  const copy = useMemo(
    () => buildShowroomShellCopy(currentLocale, branchNameFromConfig),
    [branchNameFromConfig, currentLocale]
  );
  const branding = brandingStore.publicBranding;
  const pageLogoUrl = resolveShowroomPageLogoUrl(currentConfig);
  const siteLogoUrl =
    pageLogoUrl ??
    (mode === "dark"
      ? normalizeRenderableImageSrc(branding?.siteLogoDarkUrl) ??
        normalizeRenderableImageSrc(branding?.siteLogoUrl) ??
        DEFAULT_SITE_LOGO_DARK_URL
      : normalizeRenderableImageSrc(branding?.siteLogoUrl) ??
        normalizeRenderableImageSrc(branding?.siteLogoDarkUrl) ??
        DEFAULT_SITE_LOGO_URL);
  const publicDisplayConfig = parseObject(
    currentConfig?.displayConfigJson
  );
  const socialLinks = parsePublicSocialLinks(publicDisplayConfig);
  const contactInfo = parsePublicContactInfo(publicDisplayConfig);

  const hrefs = {
    home: buildBranchProductPath(currentLocale, activeBranchSlug, activeShopDomain),
    showroom: buildShowroomBasePath(
      currentLocale,
      activeShowroomSlug,
      activeBranchSlug,
      activeShopDomain
    ),
    shortlist: buildShowroomShortlistPath(
      currentLocale,
      activeShowroomSlug,
      activeBranchSlug,
      activeShopDomain
    ),
    dashboard: localizePathname("/dashboard", currentLocale),
    auth: localizePathname("/auth", currentLocale),
  };

  const submitSearch = (rawValue: string) => {
    const trimmed = rawValue.trim();
    const basePath = buildShowroomBasePath(
      currentLocale,
      activeShowroomSlug,
      activeBranchSlug,
      activeShopDomain
    );
    const targetHref = trimmed
      ? `${basePath}?q=${encodeURIComponent(trimmed)}`
      : basePath;

    router.push(targetHref);
    setSearchOpen(false);
  };

  return {
    copy,
    currentLocale,
    switchLocale,
    searchOpen,
    setSearchOpen,
    searchQuery,
    submitSearch,
    siteLogoUrl,
    socialLinks,
    contactInfo,
    shortlistCount: showroomStore.shortlistCount,
    isHomeActive:
      pathWithoutLocale === "/product" ||
      pathWithoutLocale.startsWith("/product/") ||
      /^\/b\/[^/]+\/products(?:\/|$)/.test(pathWithoutLocale) ||
      /^\/[^/]+\/products(?:\/|$)/.test(pathWithoutLocale) ||
      isShopDomainHomePath ||
      pathWithoutLocale === "/booking" ||
      pathWithoutLocale.startsWith("/booking/"),
    isShowroomActive:
      ((pathWithoutLocale === "/showroom" ||
        pathWithoutLocale.startsWith("/showroom/") ||
        /^\/b\/[^/]+\/showroom(?:\/|$)/.test(pathWithoutLocale) ||
        /^\/[^/]+\/showroom(?:\/|$)/.test(pathWithoutLocale)) &&
        !(
          pathWithoutLocale === "/showroom/shortlist" ||
          pathWithoutLocale.startsWith("/showroom/shortlist/") ||
          /^\/b\/[^/]+\/showroom\/shortlist(?:\/|$)/.test(pathWithoutLocale) ||
          /^\/[^/]+\/showroom\/shortlist(?:\/|$)/.test(pathWithoutLocale) ||
          /^\/showroom\/[^/]+\/shortlist(?:\/|$)/.test(pathWithoutLocale)
        )) ||
      /^\/showroom\/[^/]+\/p(?:\/|$)/.test(pathWithoutLocale) ||
      /^\/[^/]+\/showroom\/p(?:\/|$)/.test(pathWithoutLocale),
    isShortlistActive:
      pathWithoutLocale === "/showroom/shortlist" ||
      pathWithoutLocale.startsWith("/showroom/shortlist/") ||
      /^\/b\/[^/]+\/showroom\/shortlist(?:\/|$)/.test(pathWithoutLocale) ||
      /^\/[^/]+\/showroom\/shortlist(?:\/|$)/.test(pathWithoutLocale) ||
      /^\/showroom\/[^/]+\/shortlist(?:\/|$)/.test(pathWithoutLocale),
    hrefs,
    hasCloudSession,
    handleSignOut,
  };
}
