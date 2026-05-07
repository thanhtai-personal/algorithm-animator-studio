"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import type { AppLocale } from "@/constants/locale";
import { formatMoney } from "@/utils/format/money";
import { SalesPosCartProductsList } from "./SalesPosCartProductsList";
import { SalesPosCustomerPanel } from "./SalesPosCustomerPanel";
import type { SalesPosPageModel } from "./types";

interface SalesPosOrderPanelProps {
  locale: AppLocale;
  model: SalesPosPageModel;
  orderPanelStyle: CSSProperties;
  isCartPanelDetached: boolean;
  floatingToggleLabel: string;
  toggleCartPanelDetached: () => void;
  inlineCreateError: string | null;
  setInlineCreateError: (value: string | null) => void;
}

export function SalesPosOrderPanel({
  locale,
  model,
  orderPanelStyle,
  isCartPanelDetached,
  floatingToggleLabel,
  toggleCartPanelDetached,
  inlineCreateError,
  setInlineCreateError,
}: SalesPosOrderPanelProps) {
  const createOrderLoadingLabel = locale === "vi" ? "Đang tạo đơn..." : "Creating order...";

  return (
    <aside
      className="relative z-10 flex min-h-0 w-full shrink-0 flex-col border-t border-border bg-card lg:min-w-[360px] lg:max-w-[640px] lg:w-[var(--sales-pos-order-panel-width)] lg:border-l lg:border-t-0"
      style={orderPanelStyle}
    >
      <button
        type="button"
        onClick={toggleCartPanelDetached}
        aria-label={floatingToggleLabel}
        title={floatingToggleLabel}
        className="absolute left-0 top-1/2 z-30 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
      >
        <span
          className="inline-flex transition-transform duration-300 ease-out"
          style={{ transform: `rotateY(${isCartPanelDetached ? 180 : 0}deg)` }}
        >
          <HiArrowRightOnRectangle className="h-5 w-5" />
        </span>
        <span className="sr-only">{floatingToggleLabel}</span>
      </button>

      <SalesPosCustomerPanel
        locale={locale}
        model={model}
        inlineCreateError={inlineCreateError}
        setInlineCreateError={setInlineCreateError}
      />

      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {locale === "vi"
            ? "Giá thuê dùng theo giá thuê hoặc giá thuê nhanh"
            : "Rent uses rent price or quick rent price"}
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-0 transition-all duration-300 ease-out ${
            isCartPanelDetached
              ? "opacity-100 lg:pointer-events-none lg:translate-y-1 lg:opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
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
            className="h-full space-y-2 p-4 lg:overflow-auto"
          />
        </div>
        {isCartPanelDetached ? <div className="hidden h-full lg:block" /> : null}
      </div>

      <div className="space-y-3 border-t border-border p-4">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.depositLabel}
          </span>
          <input
            value={model.depositInput}
            onChange={(event) => {
              model.setDepositTouched(true);
              model.setDepositInput(event.target.value);
            }}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </label>

        <button type="button" onClick={model.applySuggestedDeposit} className="text-xs font-semibold text-primary hover:underline">
          {model.copy.suggestDeposit}:{" "}
          {formatMoney(model.suggestedDeposit, { locale, currency: "VND" }) || "-"}
        </button>

        <SalesPosTotals locale={locale} model={model} />

        <button
          type="button"
          onClick={model.createOrder}
          disabled={
            model.creating ||
            model.creatingCustomer ||
            model.cartItemCount === 0 ||
            !model.selectedCustomer
          }
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          {model.creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>{model.creating ? createOrderLoadingLabel : model.copy.createOrderAction}</span>
        </button>

        {!model.hasOpenShift ? (
          <p className="text-xs text-muted-foreground">{model.copy.shiftRequiredHint}</p>
        ) : null}

        {model.lastCreatedOrderId ? (
          <Link
            href={`/${locale}/sales/invoices?orderId=${model.lastCreatedOrderId}`}
            className="block text-center text-xs font-semibold text-primary hover:underline"
          >
            {model.copy.viewInvoice}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function SalesPosTotals({ locale, model }: { locale: AppLocale; model: SalesPosPageModel }) {
  return (
    <div className="space-y-1 text-sm">
      <TotalRow label={model.copy.subtotalLabel} value={model.subtotal} locale={locale} />
      <TotalRow label={model.copy.depositLabel} value={model.depositAmount} locale={locale} />
      <div className="flex items-center justify-between border-t border-border pt-1 font-semibold text-foreground">
        <span>{model.copy.balanceLabel}</span>
        <span>{formatMoney(model.balance, { locale, currency: "VND" }) || "-"}</span>
      </div>
    </div>
  );
}

function TotalRow({ label, value, locale }: { label: string; value: number; locale: AppLocale }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">
        {formatMoney(value, { locale, currency: "VND" }) || "-"}
      </span>
    </div>
  );
}
