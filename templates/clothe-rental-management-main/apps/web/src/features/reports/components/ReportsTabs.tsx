"use client";

import Link from "next/link";
import type { AppLocale } from "@/constants/locale";
import { cn } from "@/utils/className";
import { createLocaleTranslator } from "@/utils/i18nMessages";

type ReportsTabKey = "revenue" | "utilization" | "incidents";

interface ReportsTabsProps {
  locale: AppLocale;
  activeTab: ReportsTabKey;
}

const REPORTS_TAB_LABEL_KEYS: Record<ReportsTabKey, string> = {
  revenue: "reports.tabs.revenue",
  utilization: "reports.tabs.utilization",
  incidents: "reports.tabs.incidents",
};

const REPORTS_TAB_ORDER: ReportsTabKey[] = ["revenue", "utilization", "incidents"];

export function ReportsTabs({ locale, activeTab }: ReportsTabsProps) {
  const t = createLocaleTranslator(locale);

  return (
    <nav className="inline-flex rounded-2xl border border-border bg-card p-1.5 shadow-sm">
      {REPORTS_TAB_ORDER.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <Link
            key={tab}
            href={`/${locale}/reports/${tab}`}
            className={cn(
              "inline-flex min-w-24 items-center justify-center rounded-xl px-3.5 py-2 text-xs font-semibold transition",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {t(REPORTS_TAB_LABEL_KEYS[tab])}
          </Link>
        );
      })}
    </nav>
  );
}
