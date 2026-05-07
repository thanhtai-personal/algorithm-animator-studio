"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { createLocaleTranslator } from "@/utils/i18nMessages";
import { stripLocaleFromPathname } from "@/utils/locale";

type MakeupAdminTabKey = "overview" | "calendar" | "inventory" | "orders";

interface MakeupAdminTab {
  key: MakeupAdminTabKey;
  href: string;
  label: string;
  isActive: boolean;
}

const ADMIN_ROLE_SET = new Set(["owner_admin", "manager", "staff"]);

function isActiveTab(pathname: string, tabKey: MakeupAdminTabKey): boolean {
  const segment = `/makeup/${tabKey}`;
  return pathname === segment || pathname.startsWith(`${segment}/`);
}

export function useMakeupAdminTabs(locale: AppLocale): {
  isVisible: boolean;
  tabs: MakeupAdminTab[];
} {
  const pathname = usePathname();
  const { role } = useAuthAccess();

  const isVisible = ADMIN_ROLE_SET.has(role ?? "");
  const normalizedPathname = stripLocaleFromPathname(pathname);
  const t = useMemo(() => createLocaleTranslator(locale), [locale]);

  const tabs = useMemo<MakeupAdminTab[]>(() => {
    const base = `/${locale}/makeup`;
    const definitions: Array<{ key: MakeupAdminTabKey; segment: string; labelKey: string }> = [
      { key: "overview", segment: "overview", labelKey: "makeup.adminTabs.overview" },
      { key: "calendar", segment: "calendar", labelKey: "makeup.adminTabs.calendar" },
      { key: "inventory", segment: "inventory", labelKey: "makeup.adminTabs.inventory" },
      { key: "orders", segment: "orders", labelKey: "makeup.adminTabs.orders" },
    ];

    return definitions.map((entry) => ({
      key: entry.key,
      href: `${base}/${entry.segment}`,
      label: t(entry.labelKey),
      isActive: isActiveTab(normalizedPathname, entry.key),
    }));
  }, [locale, normalizedPathname, t]);

  return {
    isVisible,
    tabs,
  };
}
