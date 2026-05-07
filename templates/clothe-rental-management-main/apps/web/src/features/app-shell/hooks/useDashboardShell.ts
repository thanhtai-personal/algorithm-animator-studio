"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicBrandingQuery } from "@/features/branding/queries/useBrandingQueries";
import {
  DEFAULT_SITE_LOGO_DARK_URL,
  DEFAULT_SITE_LOGO_URL,
} from "@/features/branding/constants";
import {
  DASHBOARD_NAV_ITEMS,
  type DashboardNavKey,
} from "@/features/app-shell/constants";
import { useLocaleSwitch } from "@/features/app-shell/hooks/useLocaleSwitch";
import { useHomeSessionPanel } from "@/features/auth/hooks/home/useHomeSessionPanel";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import { useThemeMode } from "@/lib/themeVariants";
import { authStore } from "@/store/authStore";
import { createLocaleTranslator } from "@/utils/i18nMessages";
import { stripLocaleFromPathname } from "@/utils/locale";

type DashboardShellCopy = {
  brandSubtitle: string;
  brandTitle: string;
  openProductAction: string;
  openSalesAction: string;
  menuAriaLabel: string;
  closeMenuAriaLabel: string;
  notificationsAriaLabel: string;
  searchAriaLabel: string;
  searchPlaceholder: string;
  branchLabelPrefix: string;
  branchSelectorLabel: string;
  branchSelectorPlaceholder: string;
  defaultBranchLabelSuffix: string;
  signOutAction: string;
  fallbackUserLabel: string;
  fallbackRoleLabel: string;
};

const NAV_LABEL_KEYS: Record<DashboardNavKey, string> = {
  dashboard: "nav.dashboard",
  orders: "nav.orders",
  inventory: "nav.inventory",
  products: "nav.products",
  procurement: "nav.procurement",
  media: "nav.media",
  categories: "nav.categories",
  customers: "nav.customers",
  shifts: "nav.shifts",
  payments: "nav.payments",
  calendar: "nav.calendar",
  makeup: "nav.makeup",
  reports: "nav.reports",
  settings: "nav.settings",
};

function buildShellCopy(t: (key: string) => string): DashboardShellCopy {
  return {
    brandSubtitle: t("appShell.brandSubtitle"),
    brandTitle: t("appShell.brandTitle"),
    openProductAction: t("appShell.openProductAction"),
    openSalesAction: t("appShell.openSalesAction"),
    menuAriaLabel: t("appShell.menuAriaLabel"),
    closeMenuAriaLabel: t("appShell.closeMenuAriaLabel"),
    notificationsAriaLabel: t("appShell.notificationsAriaLabel"),
    searchAriaLabel: t("appShell.searchAriaLabel"),
    searchPlaceholder: t("appShell.searchPlaceholder"),
    branchLabelPrefix: t("appShell.branchLabelPrefix"),
    branchSelectorLabel: t("appShell.branchSelectorLabel"),
    branchSelectorPlaceholder: t("appShell.branchSelectorPlaceholder"),
    defaultBranchLabelSuffix: t("appShell.defaultBranchLabelSuffix"),
    signOutAction: t("appShell.signOutAction"),
    fallbackUserLabel: t("common.user"),
    fallbackRoleLabel: t("common.guest"),
  };
}

function isActiveSegment(pathnameWithoutLocale: string, segment: string): boolean {
  if (pathnameWithoutLocale === `/${segment}`) return true;
  return pathnameWithoutLocale.startsWith(`/${segment}/`);
}

export function useDashboardShell() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const pathWithoutLocale = stripLocaleFromPathname(pathname);
  const { currentLocale, switchLocale } = useLocaleSwitch();
  const { mode } = useThemeMode();
  const brandingQuery = usePublicBrandingQuery();
  const { profileName, role, branchAccess, currentBranchId, handleSignOut, canManageSettings } =
    useHomeSessionPanel();
  const t = useMemo(() => createLocaleTranslator(currentLocale), [currentLocale]);
  const isMakeupModuleEnabled = brandingQuery.data?.isMakeupModuleEnabled ?? true;

  const navItems = useMemo(() => {
    return DASHBOARD_NAV_ITEMS
      .filter((item) => {
        if (role === "staff") {
          return item.key === "procurement" || item.key === "makeup";
        }
        return true;
      })
      .filter((item) => {
        if (role === "makeup_artist") {
          return item.key === "makeup";
        }
        return true;
      })
      .filter((item) => item.key !== "shifts" || role === "owner_admin" || role === "manager")
      .filter((item) => item.key !== "settings" || canManageSettings)
      .filter((item) => item.key !== "makeup" || isMakeupModuleEnabled)
      .map((item) => ({
        key: item.key,
        label: t(NAV_LABEL_KEYS[item.key]),
        href: `/${currentLocale}/${item.segment}`,
        isActive: isActiveSegment(pathWithoutLocale, item.segment),
      }));
  }, [canManageSettings, currentLocale, isMakeupModuleEnabled, pathWithoutLocale, role, t]);

  const copy = useMemo(() => buildShellCopy(t), [t]);
  const showGlobalBranchSelector = !pathWithoutLocale.startsWith("/settings");
  const activeNavLabel = useMemo(() => {
    return navItems.find((item) => item.isActive)?.label ?? t("nav.dashboard");
  }, [navItems, t]);

  const branchOptions = useMemo(() => {
    if (branchAccess.length === 0) return [];

    return branchAccess.map((entry) => ({
      value: entry.branchId,
      label: entry.isDefault
        ? `${entry.branchName?.trim() || entry.branchId} ${copy.defaultBranchLabelSuffix}`
        : entry.branchName?.trim() || entry.branchId,
    }));
  }, [branchAccess, copy.defaultBranchLabelSuffix]);

  const userLabel = profileName?.trim() || copy.fallbackUserLabel;
  const roleLabel = role ?? copy.fallbackRoleLabel;
  const branding = brandingQuery.data;
  const siteLogoUrl =
    mode === "dark"
      ? normalizeRenderableImageSrc(branding?.siteLogoDarkUrl) ??
        normalizeRenderableImageSrc(branding?.siteLogoUrl) ??
        DEFAULT_SITE_LOGO_DARK_URL
      : normalizeRenderableImageSrc(branding?.siteLogoUrl) ??
        normalizeRenderableImageSrc(branding?.siteLogoDarkUrl) ??
        DEFAULT_SITE_LOGO_URL;

  const setCurrentBranch = useCallback((branchId: string) => {
    const normalizedBranchId = branchId || null;
    if (authStore.currentBranchId === normalizedBranchId) return;

    authStore.currentBranchId = normalizedBranchId;
    void queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    currentLocale,
    copy,
    showGlobalBranchSelector,
    navItems,
    activeNavLabel,
    branchOptions,
    currentBranchId,
    role,
    siteLogoUrl,
    userLabel,
    roleLabel,
    setCurrentBranch,
    switchLocale,
    handleSignOut,
  };
}
