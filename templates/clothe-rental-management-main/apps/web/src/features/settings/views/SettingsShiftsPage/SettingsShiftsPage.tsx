"use client";

import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { SettingsAccessDenied } from "@/features/settings/components/SettingsAccessDenied";
import { useSettingsShiftsPage } from "@/features/settings/hooks/useSettingsShiftsPage";
import { formatMoney } from "@/utils/format/money";
import { paginateItems } from "@/utils/pagination";

interface SettingsShiftsPageProps {
  locale: AppLocale;
}

const SHIFT_ORDERS_PAGE_SIZE = 10;

function formatDateTime(value: string | null, locale: AppLocale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
}

function formatCurrency(value: number, locale: AppLocale): string {
  return formatMoney(value, { locale, currency: "VND" }) || "0";
}

function getOrderTypeLabel(type: "RENTAL" | "SALE", locale: AppLocale) {
  if (locale === "vi") {
    return type === "SALE" ? "Bán" : "Thuê";
  }
  return type === "SALE" ? "Sale" : "Rental";
}

export const SettingsShiftsPage = observer(function SettingsShiftsPage({
  locale,
}: SettingsShiftsPageProps) {
  const model = useSettingsShiftsPage(locale);
  const [shiftOrdersPage, setShiftOrdersPage] = useState(1);

  useEffect(() => {
    setShiftOrdersPage(1);
  }, [model.selectedShiftId]);

  const shiftOrdersPagination = useMemo(
    () => paginateItems(model.shiftDetail?.orders ?? [], shiftOrdersPage, SHIFT_ORDERS_PAGE_SIZE),
    [model.shiftDetail?.orders, shiftOrdersPage]
  );
  const prevLabel = locale === "vi" ? "Trước" : "Prev";
  const nextLabel = locale === "vi" ? "Sau" : "Next";
  const pageLabel = locale === "vi" ? "Trang" : "Page";

  if (!model.canManageShifts) {
    return <SettingsAccessDenied locale={locale} message={model.copy.noPermission} />;
  }

  if (!model.shiftsPayload && model.shiftsQuery.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{model.copy.loading}</p>
      </section>
    );
  }

  if (!model.shiftsPayload && model.shiftsQuery.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/5 p-6 shadow-md">
        <p className="text-sm text-destructive">{model.copy.loadError}</p>
        <button
          type="button"
          onClick={() => void model.shiftsQuery.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {model.copy.retryAction}
        </button>
      </section>
    );
  }

  if (!model.shiftsPayload) {
    return null;
  }

  const totalPages = Math.max(
    1,
    Math.ceil(model.shiftsPayload.total / Math.max(1, model.pageSize))
  );

  return (
    <section className="animate-fade-in space-y-5">
      <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{model.copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
        </div>
      </header>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{model.copy.filtersTitle}</h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.branchLabel}</span>
            <select
              value={model.branchFilter}
              onChange={(event) => model.setBranchFilter(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{model.copy.allBranchesOption}</option>
              {model.branchOptions.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.staffLabel}</span>
            <select
              value={model.staffFilter}
              onChange={(event) => model.setStaffFilter(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{model.copy.allStaffOption}</option>
              {model.staffOptions.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.statusLabel}</span>
            <select
              value={model.statusFilter}
              onChange={(event) => model.setStatusFilter(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{model.copy.allStatusOption}</option>
              <option value="OPEN">{model.copy.statusOpenOption}</option>
              <option value="CLOSED">{model.copy.statusClosedOption}</option>
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.fromDateLabel}</span>
            <input
              type="date"
              value={model.fromDate}
              onChange={(event) => model.setFromDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.toDateLabel}</span>
            <input
              type="date"
              value={model.toDate}
              onChange={(event) => model.setToDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[380px,minmax(0,1fr)]">
        <article className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold text-foreground">{model.copy.listTitle}</h2>

          {model.shiftsPayload.items.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              {model.copy.listEmpty}
            </p>
          ) : (
            <div className="max-h-[72vh] space-y-2 overflow-y-auto pr-1">
              {model.shiftsPayload.items.map((shift) => {
                const isSelected = shift.id === model.selectedShiftId;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => model.setSelectedShiftId(shift.id)}
                    className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                      isSelected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-muted/10 hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        {shift.openedByName ?? shift.openedBy}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          shift.status === "OPEN"
                            ? "bg-warning/20 text-warning"
                            : "bg-emerald-500/20 text-emerald-700"
                        }`}
                      >
                        {model.resolveShiftStatusLabel(shift.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(shift.openedAt, locale)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {model.copy.openingCashLabel}: {formatCurrency(shift.openingCash, locale)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {model.copy.orderCountLabel}: {shift.summary.orderCount}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => model.setPage(Math.max(1, model.page - 1))}
              disabled={model.page <= 1}
              className="rounded-lg border border-border px-2 py-1 disabled:opacity-50"
            >
              {model.copy.prevPage}
            </button>
            <span>
              {model.copy.pageLabel} {model.page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => model.setPage(Math.min(totalPages, model.page + 1))}
              disabled={model.page >= totalPages}
              className="rounded-lg border border-border px-2 py-1 disabled:opacity-50"
            >
              {model.copy.nextPage}
            </button>
          </div>
        </article>

        <article className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold text-foreground">{model.copy.detailTitle}</h2>

          {!model.shiftDetail ? (
            <p className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              {model.copy.detailEmpty}
            </p>
          ) : (
            <>
              <div className="grid gap-2 rounded-2xl border border-border bg-muted/10 p-3 text-xs text-muted-foreground md:grid-cols-2">
                <p>
                  {model.copy.openedByLabel}: <span className="font-semibold text-foreground">{model.shiftDetail.openedByName ?? model.shiftDetail.openedBy}</span>
                </p>
                <p>
                  {model.copy.openedAtLabel}: <span className="font-semibold text-foreground">{formatDateTime(model.shiftDetail.openedAt, locale)}</span>
                </p>
                <p>
                  {model.copy.openingCashLabel}: <span className="font-semibold text-foreground">{formatCurrency(model.shiftDetail.openingCash, locale)}</span>
                </p>
                <p>
                  {model.copy.closedByLabel}: <span className="font-semibold text-foreground">{model.shiftDetail.closedByName ?? model.shiftDetail.closedBy ?? "-"}</span>
                </p>
                <p>
                  {model.copy.closedAtLabel}: <span className="font-semibold text-foreground">{formatDateTime(model.shiftDetail.closedAt, locale)}</span>
                </p>
                <p>
                  {model.copy.closingCashLabel}: <span className="font-semibold text-foreground">{model.shiftDetail.closingCash === null ? "-" : formatCurrency(model.shiftDetail.closingCash, locale)}</span>
                </p>
                <p className="md:col-span-2">
                  {model.copy.noteLabel}: <span className="font-semibold text-foreground">{model.shiftDetail.note ?? "-"}</span>
                </p>
              </div>

              <div className="grid gap-2 rounded-2xl border border-border bg-background p-3 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                <p>
                  {model.copy.orderCountLabel}: <span className="font-semibold text-foreground">{model.shiftDetail.summary.orderCount}</span>
                </p>
                <p>
                  {model.copy.totalReceivedLabel}: <span className="font-semibold text-foreground">{formatCurrency(model.shiftDetail.summary.totalReceivedAmount, locale)}</span>
                </p>
                <p>
                  {model.copy.totalDepositLabel}: <span className="font-semibold text-foreground">{formatCurrency(model.shiftDetail.summary.totalDepositAmount, locale)}</span>
                </p>
                <p>
                  {model.copy.totalRentalLabel}: <span className="font-semibold text-foreground">{formatCurrency(model.shiftDetail.summary.totalRentalAmount, locale)}</span>
                </p>
                <p>
                  {model.copy.totalSaleLabel}: <span className="font-semibold text-foreground">{formatCurrency(model.shiftDetail.summary.totalSaleAmount, locale)}</span>
                </p>
                <p>
                  {model.copy.expectedCashLabel}: <span className="font-semibold text-foreground">{formatCurrency(model.shiftDetail.reconciliation?.expectedClosingCash ?? model.shiftDetail.openingCash, locale)}</span>
                </p>
                <p>
                  {model.copy.cashNetLabel}: <span className="font-semibold text-foreground">{formatCurrency(model.shiftDetail.reconciliation?.cashNetMovement ?? 0, locale)}</span>
                </p>
                <p>
                  {model.copy.varianceLabel}: <span className="font-semibold text-foreground">{formatCurrency(model.shiftDetail.reconciliation?.variance ?? 0, locale)}</span>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {model.copy.ordersTitle}
                </h3>

                {model.selectedShiftQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">{model.copy.loading}</p>
                ) : model.shiftDetail.orders.length === 0 ? (
                  <p className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {model.copy.ordersEmpty}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-[360px] overflow-auto rounded-xl border border-border">
                      <table className="min-w-full border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.orderCodeLabel}</th>
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.orderTypeLabel}</th>
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.customerLabel}</th>
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.orderStatusLabel}</th>
                            <th className="px-2 py-2 text-left font-semibold">{model.copy.orderCreatedAtLabel}</th>
                            <th className="px-2 py-2 text-right font-semibold">{model.copy.orderTotalLabel}</th>
                            <th className="px-2 py-2 text-right font-semibold">{model.copy.orderDepositLabel}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftOrdersPagination.items.map((order) => (
                            <tr key={order.orderId} className="border-b border-border/60 text-foreground">
                              <td className="px-2 py-2 font-semibold">{order.orderCode}</td>
                              <td className="px-2 py-2">{getOrderTypeLabel(order.orderType, locale)}</td>
                              <td className="px-2 py-2">
                                <div>{order.customerName ?? "-"}</div>
                                <div className="text-[11px] text-muted-foreground">{order.customerPhone ?? "-"}</div>
                              </td>
                              <td className="px-2 py-2">{model.resolveOrderStatusLabel(order.status)}</td>
                              <td className="px-2 py-2">{formatDateTime(order.createdAt, locale)}</td>
                              <td className="px-2 py-2 text-right">{formatCurrency(order.totalAmount, locale)}</td>
                              <td className="px-2 py-2 text-right">{formatCurrency(order.depositAmount, locale)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => setShiftOrdersPage(Math.max(1, shiftOrdersPagination.page - 1))}
                        disabled={shiftOrdersPagination.page <= 1}
                        className="rounded-lg border border-border px-2 py-1 disabled:opacity-50"
                      >
                        {prevLabel}
                      </button>
                      <span>
                        {pageLabel} {shiftOrdersPagination.page}/{shiftOrdersPagination.totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setShiftOrdersPage(
                            Math.min(shiftOrdersPagination.totalPages, shiftOrdersPagination.page + 1)
                          )
                        }
                        disabled={shiftOrdersPagination.page >= shiftOrdersPagination.totalPages}
                        className="rounded-lg border border-border px-2 py-1 disabled:opacity-50"
                      >
                        {nextLabel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </article>
      </section>
    </section>
  );
});
