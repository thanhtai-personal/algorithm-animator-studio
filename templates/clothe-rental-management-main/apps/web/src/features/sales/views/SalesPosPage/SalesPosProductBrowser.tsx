"use client";

import type { AppLocale } from "@/constants/locale";
import { formatMoney } from "@/utils/format/money";
import type { SalesPosPageModel, SalesPosPageProps } from "./types";

interface SalesPosProductBrowserProps {
  locale: AppLocale;
  model: SalesPosPageModel;
  forcedBranch: NonNullable<SalesPosPageProps["forcedBranch"]> | null;
}

export function SalesPosProductBrowser({
  locale,
  model,
  forcedBranch,
}: SalesPosProductBrowserProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col border-b border-border lg:border-b-0">
      <div className="border-b border-border p-4">
        <h1 className="text-xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
        {forcedBranch ? (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {locale === "vi" ? "Chi nhánh: " : "Branch: "}
            {forcedBranch.branchCode} - {forcedBranch.branchName}
          </p>
        ) : null}

        <div className="mt-3">
          <input
            type="search"
            value={model.productSearch}
            onChange={(event) => model.setProductSearch(event.target.value)}
            placeholder={model.copy.productSearchPlaceholder}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="p-4 lg:flex-1 lg:overflow-auto">
        {model.products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            {model.copy.noProductHint}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {model.products.map((product) => {
              const availableCount = model.availableCountByProductId.get(product.id) ?? 0;
              const depositPriceReference =
                product.rentDepositAmount ?? product.pricePolicy.defaultDepositAmount;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => model.addProductToCart(product)}
                  className="rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-md"
                >
                  <div
                    className="aspect-[4/3] rounded-lg bg-accent/60 bg-cover bg-center"
                    style={
                      product.coverImageUrl
                        ? { backgroundImage: `url("${product.coverImageUrl}")` }
                        : undefined
                    }
                  />
                  <p className="mt-2 truncate text-sm font-semibold text-foreground">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.categoryName ?? "-"} · {availableCount}{" "}
                    {locale === "vi" ? "sẵn" : "ready"}
                  </p>
                  <ProductPriceRows
                    locale={locale}
                    rentPricePerDay={product.rentPricePerDay}
                    quickRentPrice={product.quickRentPrice}
                    depositPriceReference={depositPriceReference}
                    salePrice={product.salePrice}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => model.setProductPage(Math.max(1, model.productPage - 1))}
          disabled={model.productPage <= 1}
          className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
        >
          {model.copy.prevPage}
        </button>
        <span>
          {model.copy.pageLabel} {model.productPage}/{model.productTotalPages}
        </span>
        <button
          type="button"
          onClick={() => model.setProductPage(Math.min(model.productTotalPages, model.productPage + 1))}
          disabled={model.productPage >= model.productTotalPages}
          className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
        >
          {model.copy.nextPage}
        </button>
      </div>
    </div>
  );
}

function ProductPriceRows({
  locale,
  rentPricePerDay,
  quickRentPrice,
  depositPriceReference,
  salePrice,
}: {
  locale: AppLocale;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  depositPriceReference: number | null;
  salePrice: number | null;
}) {
  return (
    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      <PriceRow locale={locale} viLabel="Giá thuê: " enLabel="Rent: " value={rentPricePerDay} tone="primary" />
      <PriceRow locale={locale} viLabel="Giá thuê nhanh: " enLabel="Quick rent: " value={quickRentPrice} tone="primary" />
      <PriceRow locale={locale} viLabel="Giá cọc: " enLabel="Deposit: " value={depositPriceReference} />
      <PriceRow locale={locale} viLabel="Giá bán: " enLabel="Sale: " value={salePrice} />
    </div>
  );
}

function PriceRow({
  locale,
  viLabel,
  enLabel,
  value,
  tone = "default",
}: {
  locale: AppLocale;
  viLabel: string;
  enLabel: string;
  value: number | null;
  tone?: "primary" | "default";
}) {
  return (
    <p>
      {locale === "vi" ? viLabel : enLabel}
      <span className={tone === "primary" ? "font-semibold text-primary" : "font-semibold text-foreground"}>
        {formatMoney(value, { locale, currency: "VND" }) || "-"}
      </span>
    </p>
  );
}
