"use client";

import Link from "next/link";
import type { AppLocale } from "@/constants/locale";
import { productsClientService } from "@/features/products/services/productsClientService";
import { cn } from "@/utils/className";
import type { SalesProductEntryPageModel } from "./types";

interface SalesProductEntrySidebarProps {
  locale: AppLocale;
  model: SalesProductEntryPageModel;
  className?: string;
  showSupportingCards?: boolean;
  generatedCodesMaxHeightClassName?: string;
}

export function SalesProductEntrySidebar({
  locale,
  model,
  className,
  showSupportingCards = true,
  generatedCodesMaxHeightClassName = "max-h-48",
}: SalesProductEntrySidebarProps) {
  const enabledText = locale === "vi" ? "Bật" : "On";
  const disabledText = locale === "vi" ? "Tắt" : "Off";

  return (
    <aside className={cn("space-y-4 xl:sticky xl:top-20 xl:self-start", className)}>
      <article className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {model.copy.formSections.summary}
        </h3>
        <div className="space-y-1 text-sm text-foreground">
          <p>
            <span className="text-muted-foreground">{model.copy.fields.productCode}: </span>
            {model.draft.productCode || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">{model.copy.fields.productName}: </span>
            {model.draft.productName || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">{model.copy.fields.category}: </span>
            {model.summary.categoryName}
          </p>
          <p>
            <span className="text-muted-foreground">{model.copy.fields.itemCodes}: </span>
            {model.summary.itemCount}
          </p>
          <p>
            <span className="text-muted-foreground">{model.copy.fields.isRentable}: </span>
            {model.draft.isRentable ? enabledText : disabledText}
          </p>
          <p>
            <span className="text-muted-foreground">{model.copy.fields.isSaleable}: </span>
            {model.draft.isSaleable ? enabledText : disabledText}
          </p>
        </div>
        {model.summary.tagNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {model.summary.tagNames.map((tagName) => (
              <span
                key={tagName}
                className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground"
              >
                {tagName}
              </span>
            ))}
          </div>
        ) : null}

        {model.generatedItemCodes.length > 0 ? (
          <div
            className={cn(
              "space-y-1 overflow-y-auto rounded-lg border border-border bg-background p-2",
              generatedCodesMaxHeightClassName
            )}
          >
            {model.generatedItemCodes.slice(0, 30).map((code, index) => (
              <p key={`${code}-${index}`} className="font-mono text-[11px] text-foreground">
                {code}
              </p>
            ))}
          </div>
        ) : null}
      </article>

      {showSupportingCards ? (
        <>
          <SalesProductEntryRecentProducts model={model} />
          <SalesProductEntryCreatedProduct locale={locale} model={model} />
        </>
      ) : null}
    </aside>
  );
}

function SalesProductEntryRecentProducts({ model }: { model: SalesProductEntryPageModel }) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {model.copy.formSections.recentProducts}
      </h3>
      {model.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : model.recentProducts.length > 0 ? (
        <div className="space-y-2">
          {model.recentProducts.slice(0, 6).map((product) => (
            <div key={product.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
              <div className="h-8 w-8 overflow-hidden rounded-md bg-accent">
                {product.coverImagePath ? (
                  <img
                    src={productsClientService.resolveCoverImageUrl(product.coverImagePath) ?? ""}
                    alt={product.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{product.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {product.readyItems}/{product.totalItems}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">-</p>
      )}
    </article>
  );
}

function SalesProductEntryCreatedProduct({
  locale,
  model,
}: {
  locale: AppLocale;
  model: SalesProductEntryPageModel;
}) {
  if (!model.lastCreatedProduct) return null;

  return (
    <article className="space-y-2 rounded-2xl border border-success/40 bg-success/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-success">Created</p>
      <p className="text-sm font-semibold text-foreground">
        {model.lastCreatedProduct.overview.name}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/products/${model.lastCreatedProduct.overview.id}`}
          className="rounded-lg border border-success/40 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          Product Detail
        </Link>
        <Link
          href={`/${locale}/inventory`}
          className="rounded-lg border border-success/40 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          Inventory
        </Link>
      </div>
    </article>
  );
}
