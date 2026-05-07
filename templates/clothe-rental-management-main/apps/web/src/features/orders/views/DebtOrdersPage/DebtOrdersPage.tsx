"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { useDebtOrdersPage } from "@/features/orders/hooks/useDebtOrdersPage";
import { formatDateLabel } from "@/utils/format/date";
import { formatMoney } from "@/utils/format/money";

interface DebtOrdersPageProps {
  locale: AppLocale;
}

export const DebtOrdersPage = observer(function DebtOrdersPage({
  locale,
}: DebtOrdersPageProps) {
  const {
    copy,
    searchInput,
    setSearchInput,
    listQuery,
    listItems,
    settleDebtMutation,
    page,
    setPage,
    totalPages,
  } = useDebtOrdersPage(locale);
  const [actionError, setActionError] = useState<string | null>(null);

  const columns = useMemo(
    () => [
      { key: "orderCode", header: copy.tableHeaders.orderCode },
      { key: "customer", header: copy.tableHeaders.customer },
      { key: "debt", header: copy.tableHeaders.debtAmount, className: "text-right" },
      { key: "updatedAt", header: copy.tableHeaders.updatedAt },
      { key: "actions", header: copy.tableHeaders.actions },
    ],
    [copy.tableHeaders]
  );

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <Link
            href={`/${locale}/orders`}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent"
          >
            {copy.backToOrders}
          </Link>
        </div>

        <div className="mt-4">
          <label className="sr-only" htmlFor="debt-orders-search">
            {copy.searchPlaceholder}
          </label>
          <input
            id="debt-orders-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm md:w-[360px]"
          />
        </div>
      </header>

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      <DataTableShell
        locale={locale}
        title={copy.title}
        columns={columns}
        isLoading={listQuery.isLoading || listQuery.isFetching}
        isEmpty={listItems.length === 0}
        loadingState={copy.loading}
        emptyState={copy.empty}
        pagination={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground disabled:opacity-50"
            >
              {copy.prevPage}
            </button>
            <span className="text-xs text-muted-foreground">
              {copy.pageLabel} {page}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
              className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground disabled:opacity-50"
            >
              {copy.nextPage}
            </button>
          </div>
        }
      >
        {listItems.map((order) => {
          const isReadyToSettle = order.money.outstandingAmount <= 0.001;

          return (
            <tr key={order.id} className="border-b border-border/70 last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/${locale}/orders/${order.id}`}
                  className="font-mono text-xs font-semibold text-foreground underline-offset-2 hover:underline"
                >
                  {order.orderCode}
                </Link>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{order.customer.fullName}</p>
                <p className="text-xs text-muted-foreground">{order.customer.phone ?? "-"}</p>
              </td>
              <td className="px-4 py-3 text-right text-xs font-semibold text-warning">
                {formatMoney(order.money.outstandingAmount, { locale, currency: "VND" }) || "-"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {formatDateLabel(new Date(order.updatedAt), { locale })}
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <button
                    type="button"
                    disabled={!isReadyToSettle || settleDebtMutation.isPending}
                    onClick={async () => {
                      try {
                        setActionError(null);
                        await settleDebtMutation.mutateAsync({ orderId: order.id });
                        toast.success(
                          locale === "vi"
                            ? `Đơn ${order.orderCode} đã hoàn tất nợ.`
                            : `Debt for order ${order.orderCode} has been settled.`
                        );
                      } catch (error) {
                        const message =
                          error instanceof Error ? error.message : copy.settleFailed;
                        setActionError(message);
                        toast.error(message);
                      }
                    }}
                    className="rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-50"
                  >
                    {copy.settleAction}
                  </button>
                  {!isReadyToSettle ? (
                    <p className="text-[11px] text-muted-foreground">{copy.settleBlockedHint}</p>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </DataTableShell>
    </section>
  );
});
