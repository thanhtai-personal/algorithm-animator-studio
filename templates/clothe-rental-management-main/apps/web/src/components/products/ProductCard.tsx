"use client";

import type { ReactNode } from "react";
import type { AppLocale } from "@/constants/locale";
import type { SupportedCurrency } from "@/types/SupportedCurrency";
import { formatMoney } from "@/utils/format/money";
import { cn } from "@/utils/className";

export interface ProductCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  tags?: string[];
  price?: number | null;
  locale?: AppLocale;
  currency?: SupportedCurrency;
  badge?: ReactNode;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
}

export function ProductCard({
  title,
  subtitle,
  imageUrl,
  tags,
  price,
  locale = "vi",
  currency = "VND",
  badge,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  className,
}: ProductCardProps) {
  return (
    <article className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      <div className="aspect-[4/3] w-full bg-muted">
        {imageUrl ? (
          <div className="relative h-full w-full">
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {locale === "vi" ? "Chưa có ảnh" : "No image"}
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-base font-semibold text-foreground">{title}</h4>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {badge}
        </div>

        {tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {typeof price === "number" ? (
          <p className="text-sm font-semibold text-foreground">
            {formatMoney(price, { locale, currency })}
          </p>
        ) : null}

        {primaryActionLabel || secondaryActionLabel ? (
          <div className="flex gap-2 pt-1">
            {secondaryActionLabel ? (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                {secondaryActionLabel}
              </button>
            ) : null}
            {primaryActionLabel ? (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                {primaryActionLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
