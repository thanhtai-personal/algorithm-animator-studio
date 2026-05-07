"use client";

import type { AppLocale } from "@/constants/locale";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";

interface SettingsGeneralPageHeaderProps {
  locale: AppLocale;
  title: string;
  subtitle: string;
}

export function SettingsGeneralPageHeader({
  locale,
  title,
  subtitle,
}: SettingsGeneralPageHeaderProps) {
  return (
    <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <SettingsTabs locale={locale} activeTab="general" />
    </header>
  );
}
