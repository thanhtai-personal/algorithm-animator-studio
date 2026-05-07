"use client";

import type { ReactNode } from "react";
import type { AppLocale } from "@/constants/locale";
import { cn } from "@/utils/className";

interface FilterBarShellProps {
  children: ReactNode;
  onReset?: () => void;
  onApply?: () => void;
  resetLabel?: string;
  applyLabel?: string;
  locale?: AppLocale;
  className?: string;
}

export function FilterBarShell({
  children,
  onReset,
  onApply,
  resetLabel,
  applyLabel,
  locale = "vi",
  className,
}: FilterBarShellProps) {
  const resolvedResetLabel = resetLabel ?? (locale === "vi" ? "Đặt lại" : "Reset");
  const resolvedApplyLabel = applyLabel ?? (locale === "vi" ? "Áp dụng" : "Apply");

  return (
    <div
      className={cn(
        "animate-slide-up rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 md:flex-row md:flex-wrap">
          {children}
        </div>
        {onReset || onApply ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40"
              >
                {resolvedResetLabel}
              </button>
            ) : null}
            {onApply ? (
              <button
                type="button"
                onClick={onApply}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {resolvedApplyLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
