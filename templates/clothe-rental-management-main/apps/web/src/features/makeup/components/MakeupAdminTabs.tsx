"use client";

import Link from "next/link";
import type { AppLocale } from "@/constants/locale";
import { useMakeupAdminTabs } from "@/features/makeup/hooks/useMakeupAdminTabs";
import { cn } from "@/utils/className";

interface MakeupAdminTabsProps {
  locale: AppLocale;
}

export function MakeupAdminTabs({ locale }: MakeupAdminTabsProps) {
  const model = useMakeupAdminTabs(locale);
  if (!model.isVisible) return null;

  return (
    <nav className="inline-flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
      {model.tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition",
            tab.isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
