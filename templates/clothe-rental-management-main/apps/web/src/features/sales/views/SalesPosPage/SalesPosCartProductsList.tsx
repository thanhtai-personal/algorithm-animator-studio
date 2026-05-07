"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { formatMoney } from "@/utils/format/money";

interface CartProductItemViewModel {
  productId: string;
  productName: string;
  coverImageUrl?: string | null;
  rentPrice: number;
  depositPerItem: number;
  quantity: number;
  maxQuantity: number;
}

interface SalesPosCartProductsListProps {
  locale: AppLocale;
  noCartHint: string;
  cartProducts: CartProductItemViewModel[];
  availableCountByProductId: Map<string, number>;
  onRemoveCartProduct: (productId: string) => void;
  onSetCartProductRentPrice: (productId: string, nextValue: string) => void;
  onSetCartProductDepositPerItem: (productId: string, nextValue: string) => void;
  onDecreaseCartProductQuantity: (productId: string) => void;
  onIncreaseCartProductQuantity: (productId: string) => void;
  onSetCartProductQuantity: (productId: string, quantity: number) => void;
  className?: string;
}

export function SalesPosCartProductsList({
  locale,
  noCartHint,
  cartProducts,
  availableCountByProductId,
  onRemoveCartProduct,
  onSetCartProductRentPrice,
  onSetCartProductDepositPerItem,
  onDecreaseCartProductQuantity,
  onIncreaseCartProductQuantity,
  onSetCartProductQuantity,
  className = "space-y-2 p-4 lg:flex-1 lg:overflow-auto",
}: SalesPosCartProductsListProps) {
  if (cartProducts.length === 0) {
    return (
      <div className={className}>
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <ShoppingBag className="mb-2 h-10 w-10 opacity-40" />
          <p className="text-sm">{noCartHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {cartProducts.map((item) => (
        <div
          key={item.productId}
          className="rounded-lg border border-border bg-background p-3"
        >
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 shrink-0 rounded-lg bg-accent/70 bg-cover bg-center"
              style={
                item.coverImageUrl
                  ? { backgroundImage: `url("${item.coverImageUrl}")` }
                  : undefined
              }
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.productName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {locale === "vi" ? "Giá thuê hiện tại" : "Current rent"}:{" "}
                {formatMoney(item.rentPrice, { locale, currency: "VND" }) || "-"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {locale === "vi" ? "Số item sẵn" : "Ready items"}:{" "}
                {availableCountByProductId.get(item.productId) ?? 0} ·{" "}
                {locale === "vi" ? "Tối đa" : "Max"}: {item.maxQuantity}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemoveCartProduct(item.productId)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {locale === "vi" ? "Giá thuê" : "Rent price"}
              </span>
              <input
                type="number"
                min={0}
                step={1000}
                value={item.rentPrice}
                onChange={(event) =>
                  onSetCartProductRentPrice(item.productId, event.target.value)
                }
                className="h-8 w-full rounded-md border border-border bg-card px-2 text-sm font-semibold text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {locale === "vi" ? "Giá cọc/item" : "Deposit/item"}
              </span>
              <input
                type="number"
                min={0}
                step={1000}
                value={item.depositPerItem}
                onChange={(event) =>
                  onSetCartProductDepositPerItem(item.productId, event.target.value)
                }
                className="h-8 w-full rounded-md border border-border bg-card px-2 text-sm font-semibold text-foreground"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onDecreaseCartProductQuantity(item.productId)}
              className="rounded-md border border-border p-1 text-muted-foreground hover:bg-accent"
              aria-label={locale === "vi" ? "Giảm số lượng" : "Decrease quantity"}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={1}
              max={item.maxQuantity}
              value={item.quantity}
              onChange={(event) =>
                onSetCartProductQuantity(
                  item.productId,
                  Number.parseInt(event.target.value || "0", 10)
                )
              }
              className="h-8 w-16 rounded-md border border-border bg-card px-2 text-center text-sm font-semibold text-foreground"
            />
            <button
              type="button"
              onClick={() => onIncreaseCartProductQuantity(item.productId)}
              className="rounded-md border border-border p-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
              disabled={item.quantity >= item.maxQuantity}
              aria-label={locale === "vi" ? "Tăng số lượng" : "Increase quantity"}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
