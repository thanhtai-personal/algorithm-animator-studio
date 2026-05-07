"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { AppLocale } from "@/constants/locale";
import { cn } from "@/utils/className";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  SETTINGS_TABS,
  SETTINGS_TAB_LABEL_KEYS,
  type SettingsTabKey,
} from "@/features/settings/constants";
import { createLocaleTranslator } from "@/utils/i18nMessages";

interface SettingsTabsProps {
  locale: AppLocale;
  activeTab: SettingsTabKey;
}

export function SettingsTabs({ locale, activeTab }: SettingsTabsProps) {
  const t = createLocaleTranslator(locale);
  const { role, can } = useAuthAccess();
  const normalizedRole = role?.trim().toLowerCase() ?? "";
  const canManageSettings = can("settings.manage");
  const canManageUsers = can("users.manage");
  const isGlobalSettingsAdmin =
    normalizedRole === "owner_admin" || normalizedRole === "admin";

  const visibleTabs = useMemo(() => {
    if (!canManageSettings) return [];

    return SETTINGS_TABS.filter((tab) => {
      if (tab.key === "users") return canManageUsers;
      if (tab.key === "showrooms") {
        return isGlobalSettingsAdmin;
      }
      if (tab.key === "branches") return true;
      return true;
    });
  }, [canManageSettings, canManageUsers, isGlobalSettingsAdmin]);

  return (
    <nav className="inline-flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
      {visibleTabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/${locale}/settings/${tab.segment}`}
          className={cn(
            "whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition",
            tab.key === activeTab
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {t(SETTINGS_TAB_LABEL_KEYS[tab.key])}
        </Link>
      ))}
    </nav>
  );
}
