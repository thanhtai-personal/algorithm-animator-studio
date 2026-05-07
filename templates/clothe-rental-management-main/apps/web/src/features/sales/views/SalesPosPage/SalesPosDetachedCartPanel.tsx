"use client";

import type { AppLocale } from "@/constants/locale";
import { SalesPosCartProductsList } from "./SalesPosCartProductsList";
import type { SalesPosPageModel } from "./types";

interface SalesPosDetachedCartPanelProps {
  locale: AppLocale;
  model: SalesPosPageModel;
  detached: boolean;
  title: string;
}

export function SalesPosDetachedCartPanel({
  locale,
  model,
  detached,
  title,
}: SalesPosDetachedCartPanelProps) {
  return (
    <aside
      className={`hidden shrink-0 flex-col overflow-hidden border-l bg-card transition-[width,opacity,border-color] duration-300 ease-out lg:flex ${
        detached
          ? "w-[360px] opacity-100 border-border"
          : "w-0 opacity-0 border-transparent pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <SalesPosCartProductsList
        locale={locale}
        noCartHint={model.copy.noCartHint}
        cartProducts={model.cartProducts}
        availableCountByProductId={model.availableCountByProductId}
        onRemoveCartProduct={model.removeCartProduct}
        onSetCartProductRentPrice={model.setCartProductRentPrice}
        onSetCartProductDepositPerItem={model.setCartProductDepositPerItem}
        onDecreaseCartProductQuantity={model.decreaseCartProductQuantity}
        onIncreaseCartProductQuantity={model.increaseCartProductQuantity}
        onSetCartProductQuantity={model.setCartProductQuantity}
        className="space-y-2 p-3 lg:flex-1 lg:overflow-auto"
      />
    </aside>
  );
}
