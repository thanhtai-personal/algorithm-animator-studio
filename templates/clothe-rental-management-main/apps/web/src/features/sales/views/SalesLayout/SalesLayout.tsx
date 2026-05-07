"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ClipboardPlus,
  HandCoins,
  KeyRound,
  Loader2,
  PackageCheck,
  ReceiptText,
  Search,
  ShoppingCart,
} from "lucide-react";
import { PaletteSelect } from "@/components/theme/PaletteSelect";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PwaInstallButton } from "@/features/pwa/components/PwaInstallButton";
import { useSalesLayout } from "@/features/sales/hooks/useSalesLayout";

interface SalesLayoutProps {
  children: ReactNode;
}

const TAB_ICON_MAP: Record<string, typeof ShoppingCart> = {
  pos: ShoppingCart,
  returns: PackageCheck,
  stock: Search,
  invoices: ReceiptText,
  productEntry: ClipboardPlus,
  surchargeExpense: HandCoins,
};

function getOrderTypeLabel(orderType: "RENTAL" | "SALE", locale: "vi" | "en") {
  if (locale === "vi") {
    return orderType === "SALE" ? "Bán" : "Thuê";
  }
  return orderType === "SALE" ? "Sale" : "Rental";
}

export const SalesLayout = observer(function SalesLayout({ children }: SalesLayoutProps) {
  const model = useSalesLayout();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={model.backHref}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={model.backLabel}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="truncate text-lg font-bold tracking-tight text-foreground">
              {model.copy.title}
            </span>

            <div className="ml-3 hidden items-center gap-1 rounded-lg bg-accent px-3 py-1 text-xs text-muted-foreground md:flex">
              <span>{model.currentShift ? model.copy.shiftOpenLabel : model.copy.shiftClosedLabel}:</span>
              <span className="font-semibold text-foreground">
                {model.currentShift ? model.currentShiftLabel : "-"}
              </span>
            </div>

            {model.currentShift ? (
              <>
                <div className="hidden items-center gap-1 rounded-lg bg-accent px-3 py-1 text-xs text-muted-foreground lg:flex">
                  <span>{model.copy.shiftExpectedCashLabel}:</span>
                  <span className="font-semibold text-foreground">
                    {model.currentShiftExpectedCashLabel}
                  </span>
                </div>
                <div className="hidden items-center gap-1 rounded-lg bg-accent px-3 py-1 text-xs text-muted-foreground lg:flex">
                  <span>{model.copy.shiftCashNetLabel}:</span>
                  <span className="font-semibold text-foreground">
                    {model.currentShiftCashNetLabel}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-1 rounded-lg bg-accent px-2 py-1 text-xs md:flex">
              <span className="text-muted-foreground">Chi nhánh:</span>
              <label htmlFor="sales-branch-selector" className="sr-only">
                Branch selector
              </label>
              <select
                id="sales-branch-selector"
                value={model.currentBranchId ?? ""}
                onChange={(event) => model.setCurrentBranch(event.target.value)}
                className="max-w-56 bg-transparent text-foreground outline-none dark:[color-scheme:dark]"
              >
                {model.branchOptions.length > 0 ? (
                  model.branchOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-popover text-popover-foreground"
                    >
                      {option.label}
                    </option>
                  ))
                ) : (
                  <option value="" className="bg-popover text-popover-foreground">
                    {model.copy.branchSelectorPlaceholder}
                  </option>
                )}
              </select>
            </div>

            {model.currentShift ? (
              <button
                type="button"
                onClick={model.handleCloseShift}
                disabled={model.isShiftMutating || model.isShiftLoading}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {model.copy.closeShift}
              </button>
            ) : (
              <button
                type="button"
                onClick={model.handleOpenShift}
                disabled={model.isShiftMutating || model.isShiftLoading}
                className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {model.copy.openShift}
              </button>
            )}

            <div className="inline-flex h-9 rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => model.switchLocale("vi")}
                className={`rounded-md px-2.5 text-[11px] font-bold ${
                  model.currentLocale === "vi"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => model.switchLocale("en")}
                className={`rounded-md px-2.5 text-[11px] font-bold ${
                  model.currentLocale === "en"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                EN
              </button>
            </div>

            <ThemeToggle />
            <PaletteSelect />
            <PwaInstallButton />

            <div className="hidden items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 md:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {model.userInitial}
              </span>
              <p className="max-w-24 truncate text-xs font-semibold text-foreground">
                {model.userLabel}
              </p>
            </div>
          </div>
        </div>

        <nav className="overflow-x-auto border-t border-border px-4">
          <div className="flex min-w-max items-center gap-1">
            {model.tabItems.map((tab) => {
              const Icon = TAB_ICON_MAP[tab.key] ?? ShoppingCart;
              const tabLocked =
                Boolean(tab.requiresPasskey) &&
                model.isPosPasskeyLockEnabled &&
                !model.hasPosPasskeyUnlockSession;

              if (tabLocked) {
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => model.requestProtectedNavigation(tab.href)}
                    className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                      tab.isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    <KeyRound className="h-3.5 w-3.5" />
                  </button>
                );
              }

              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    tab.isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className={`flex-1 ${model.requiresPosPasskeyPrompt ? "pointer-events-none blur-[2px]" : ""}`}>
        {children}
      </main>

      {model.requiresPosPasskeyPrompt ? (
        <div
          className="fixed inset-0 z-[125] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={model.copy.posPasskeyTitle}
        >
          <form
            className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              void model.submitPosPasskey();
            }}
          >
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">{model.copy.posPasskeyTitle}</h3>
              <p className="text-sm text-muted-foreground">{model.copy.posPasskeyDescription}</p>
            </div>

            {model.isPosPasskeyPolicyError ? (
              <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <p>{model.copy.posPasskeyLoadFailed}</p>
                <button
                  type="button"
                  onClick={model.retryPosPasskeyPolicy}
                  className="rounded-lg border border-destructive/40 bg-background px-2.5 py-1 font-semibold"
                >
                  {model.copy.posPasskeyRetry}
                </button>
              </div>
            ) : null}

            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">{model.copy.posPasskeyPlaceholder}</span>
              <input
                type="password"
                value={model.posPasskeyInput}
                onChange={(event) => {
                  model.setPosPasskeyInput(event.target.value);
                  model.setPosPasskeyError(null);
                }}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                placeholder={model.copy.posPasskeyPlaceholder}
                autoFocus
                disabled={model.isPosPasskeyPolicyLoading || model.isPosPasskeySubmitting}
              />
            </label>

            {model.posPasskeyError ? (
              <p className="text-xs text-destructive">{model.posPasskeyError}</p>
            ) : null}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={model.isPosPasskeyPolicyLoading || model.isPosPasskeySubmitting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {model.isPosPasskeySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{model.copy.posPasskeySubmitAction}</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {model.openShiftModalOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={model.copy.shiftOpenModalTitle}
          onClick={model.closeOpenShiftModal}
        >
          <form
            className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              void model.submitOpenShift();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">{model.copy.shiftOpenModalTitle}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{model.copy.shiftOpenModalDescription}</p>
            </div>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">
                {model.copy.shiftOpeningCashLabel}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={model.openShiftCashInput}
                onChange={(event) => model.setOpenShiftCashInput(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                required
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">{model.copy.shiftNoteLabel}</span>
              <textarea
                rows={3}
                value={model.openShiftNoteInput}
                onChange={(event) => model.setOpenShiftNoteInput(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={model.closeOpenShiftModal}
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
              >
                {model.copy.cancelAction}
              </button>
              <button
                type="submit"
                disabled={model.isShiftMutating}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {model.isShiftMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>
                  {model.isShiftMutating
                    ? model.copy.processingAction
                    : model.copy.confirmOpenShiftAction}
                </span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {model.closeShiftModalOpen && model.currentShift ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={model.copy.shiftCloseModalTitle}
          onClick={model.closeCloseShiftModal}
        >
          <form
            className="flex max-h-[92vh] w-full max-w-6xl flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              void model.submitCloseShift();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">{model.copy.shiftCloseModalTitle}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{model.copy.shiftCloseModalDescription}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide">
                  {model.copy.shiftClosingCashLabel}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={model.closeShiftCashInput}
                  onChange={(event) => model.setCloseShiftCashInput(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  required
                />
              </label>

              <label className="space-y-1 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide">{model.copy.shiftNoteLabel}</span>
                <input
                  type="text"
                  value={model.closeShiftNoteInput}
                  onChange={(event) => model.setCloseShiftNoteInput(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>
            </div>

            {model.isCloseShiftDetailError ? (
              <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                {model.copy.shiftLoadDetailFailed}
              </p>
            ) : null}

            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[360px,minmax(0,1fr)]">
              <section className="space-y-3 overflow-y-auto rounded-2xl border border-border bg-muted/15 p-4">
                <h4 className="text-sm font-semibold text-foreground">{model.copy.shiftSummaryTitle}</h4>

                {model.isCloseShiftDetailLoading ? (
                  <p className="text-xs text-muted-foreground">{model.copy.shiftLoadingSummary}</p>
                ) : (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span>{model.copy.shiftOrderCountLabel}</span>
                      <span className="font-semibold text-foreground">{model.closeShiftSummary?.orderCount ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span>{model.copy.shiftReceivedAmountLabel}</span>
                      <span className="font-semibold text-foreground">
                        {model.formatMoneyLabel(model.closeShiftSummary?.totalReceivedAmount ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span>{model.copy.shiftDepositAmountLabel}</span>
                      <span className="font-semibold text-foreground">
                        {model.formatMoneyLabel(model.closeShiftSummary?.totalDepositAmount ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span>{model.copy.shiftRentalAmountLabel}</span>
                      <span className="font-semibold text-foreground">
                        {model.formatMoneyLabel(model.closeShiftSummary?.totalRentalAmount ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span>{model.copy.shiftSaleAmountLabel}</span>
                      <span className="font-semibold text-foreground">
                        {model.formatMoneyLabel(model.closeShiftSummary?.totalSaleAmount ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span>{model.copy.shiftCashNetLabel}</span>
                      <span className="font-semibold text-foreground">
                        {model.formatMoneyLabel(model.closeShiftCashNetMovement)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span>{model.copy.shiftExpectedCashLabel}</span>
                      <span className="font-semibold text-foreground">{model.closeShiftExpectedCashLabel}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span>{model.copy.shiftVarianceLabel}</span>
                      <span
                        className={`font-semibold ${
                          model.closeShiftVariance && Math.abs(model.closeShiftVariance) > 0
                            ? "text-warning"
                            : "text-foreground"
                        }`}
                      >
                        {model.closeShiftVarianceLabel}
                      </span>
                    </div>
                  </div>
                )}
              </section>

              <section className="min-h-0 overflow-y-auto rounded-2xl border border-border bg-background p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">{model.copy.shiftOrdersTitle}</h4>

                {model.isCloseShiftDetailLoading ? (
                  <p className="text-xs text-muted-foreground">{model.copy.shiftLoadingOrders}</p>
                ) : model.closeShiftOrders.length === 0 ? (
                  <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {model.copy.shiftOrdersEmpty}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.shiftOrderCodeLabel}</th>
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.shiftOrderTypeLabel}</th>
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.shiftOrderCustomerLabel}</th>
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.shiftOrderStatusLabel}</th>
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.shiftOrderCreatedAtLabel}</th>
                            <th className="px-2 py-2 text-right font-semibold">{model.copy.shiftOrderTotalLabel}</th>
                            <th className="px-2 py-2 text-right font-semibold">{model.copy.shiftOrderDepositLabel}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {model.closeShiftOrders.map((order) => (
                            <tr key={order.orderId} className="border-b border-border/60 text-foreground">
                              <td className="px-2 py-2 font-semibold">{order.orderCode}</td>
                              <td className="px-2 py-2">
                                {getOrderTypeLabel(order.orderType, model.currentLocale)}
                              </td>
                              <td className="px-2 py-2">
                                <div>{order.customerName ?? "-"}</div>
                                <div className="text-[11px] text-muted-foreground">{order.customerPhone ?? "-"}</div>
                              </td>
                              <td className="px-2 py-2">{model.resolveOrderStatusLabel(order.status)}</td>
                              <td className="px-2 py-2">{model.formatShiftDateTime(order.createdAt)}</td>
                              <td className="px-2 py-2 text-right">{model.formatMoneyLabel(order.totalAmount)}</td>
                              <td className="px-2 py-2 text-right">{model.formatMoneyLabel(order.depositAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={() =>
                          model.setCloseShiftOrdersPage(Math.max(1, model.closeShiftOrdersPage - 1))
                        }
                        disabled={model.closeShiftOrdersPage <= 1}
                        className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                      >
                        {model.copy.shiftOrdersPrevPage}
                      </button>
                      <span>
                        {model.copy.shiftOrdersPageLabel} {model.closeShiftOrdersPage}/
                        {model.closeShiftOrdersTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          model.setCloseShiftOrdersPage(
                            Math.min(model.closeShiftOrdersTotalPages, model.closeShiftOrdersPage + 1)
                          )
                        }
                        disabled={model.closeShiftOrdersPage >= model.closeShiftOrdersTotalPages}
                        className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                      >
                        {model.copy.shiftOrdersNextPage}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={model.closeCloseShiftModal}
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
              >
                {model.copy.cancelAction}
              </button>
              <button
                type="submit"
                disabled={model.isShiftMutating || model.isCloseShiftDetailLoading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {model.isShiftMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>
                  {model.isShiftMutating
                    ? model.copy.processingAction
                    : model.copy.confirmCloseShiftAction}
                </span>
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
});
