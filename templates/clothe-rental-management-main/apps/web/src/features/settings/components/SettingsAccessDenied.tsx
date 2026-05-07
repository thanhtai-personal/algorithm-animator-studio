"use client";

import type { AppLocale } from "@/constants/locale";

interface SettingsAccessDeniedProps {
  locale: AppLocale;
  message: string;
}

export function SettingsAccessDenied({ locale, message }: SettingsAccessDeniedProps) {
  return (
    <section className="animate-fade-in rounded-3xl border border-destructive/40 bg-destructive/10 p-6 shadow-md">
      <p className="text-sm font-semibold text-destructive">
        {locale === "vi" ? "Không có quyền truy cập" : "Access denied"}
      </p>
      <p className="mt-2 text-sm text-foreground">{message}</p>
    </section>
  );
}
