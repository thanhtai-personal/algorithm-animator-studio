"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { useInventoryDetailPage } from "@/features/inventory/hooks/useInventoryDetailPage";
import { ITEM_STATUS_LABELS } from "@/features/inventory/utils/statusPresentation";
import type { ItemStatus } from "@/types/domainPrimitives";
import { formatDateLabel } from "@/utils/format/date";
import { formatMoney } from "@/utils/format/money";
import { paginateItems } from "@/utils/pagination";

interface InventoryDetailPageProps {
  locale: AppLocale;
  itemId: string;
}

const INVENTORY_STATUS_LOG_PAGE_SIZE = 10;
const INVENTORY_RENTAL_HISTORY_PAGE_SIZE = 10;

export const InventoryDetailPage = observer(function InventoryDetailPage({
  locale,
  itemId,
}: InventoryDetailPageProps) {
  const {
    copy,
    detail,
    detailQuery,
    coverImageUrl,
    statusMutation,
    transitionOptions,
    selectedStatus,
    setSelectedStatus,
    reasonNote,
    setReasonNote,
    reasonCode,
    setReasonCode,
    orderReference,
    setOrderReference,
    applyStatusTransition,
    statusLabels,
    resolveOrderStatusLabel,
  } = useInventoryDetailPage(locale, itemId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [statusLogPage, setStatusLogPage] = useState(1);
  const [rentalHistoryPage, setRentalHistoryPage] = useState(1);

  if (detailQuery.isLoading && !detail) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {copy.loading}
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive">
        {copy.notFound}
      </section>
    );
  }

  const statusChipItems = Object.entries(statusLabels) as Array<[ItemStatus, string]>;
  const statusLogPagination = paginateItems(
    detail.statusLogs,
    statusLogPage,
    INVENTORY_STATUS_LOG_PAGE_SIZE
  );
  const rentalHistoryPagination = paginateItems(
    detail.rentalHistory,
    rentalHistoryPage,
    INVENTORY_RENTAL_HISTORY_PAGE_SIZE
  );

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <Link href={`/${locale}/inventory`} className="text-xs font-semibold text-muted-foreground">
          {copy.backAction}
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-bold text-foreground">{detail.item.itemCode}</h1>
          <StatusBadge kind="item" status={detail.item.status} labels={ITEM_STATUS_LABELS[locale]} />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-foreground">{copy.productInfoTitle}</h2>

              <div className="mt-3 flex gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-muted">
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt={detail.item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      {locale === "vi" ? "Không ảnh" : "N/A"}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">{detail.item.productName}</p>
                  <p className="text-muted-foreground">{detail.item.variantName}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.item.size ?? "-"} · {detail.item.color ?? "-"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{detail.item.productCode}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">
                    {locale === "vi" ? "Chất liệu:" : "Material:"}
                  </span>{" "}
                  {detail.material ?? "-"}
                </p>
                <p>{detail.productDescription ?? "-"}</p>
              </div>
            </article>

            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-foreground">{copy.currentStateTitle}</h2>

              <div className="mt-3 space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {locale === "vi" ? "Trạng thái:" : "Status:"}
                  </span>{" "}
                  {statusLabels[detail.item.status]}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {locale === "vi" ? "Chi nhánh:" : "Branch:"}
                  </span>{" "}
                  {detail.item.branchId}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {locale === "vi" ? "Danh mục:" : "Category:"}
                  </span>{" "}
                  {detail.item.categoryName ?? "-"}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {locale === "vi" ? "Đơn hiện tại:" : "Current order:"}
                  </span>{" "}
                  {detail.item.currentOrder ? (
                    <Link href={`/${locale}/orders`} className="underline">
                      {detail.item.currentOrder.orderCode}
                    </Link>
                  ) : (
                    copy.noCurrentOrder
                  )}
                </p>
                {detail.item.retiredReason ? (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {locale === "vi" ? "Lý do ngưng sử dụng:" : "Retired reason:"}
                    </span>{" "}
                    {detail.item.retiredReason}
                  </p>
                ) : null}
              </div>
            </article>
          </section>

          <DataTableShell
            locale={locale}
            title={copy.statusLogTitle}
            className="rounded-3xl shadow-sm"
            isEmpty={detail.statusLogs.length === 0}
            emptyState={copy.noLogs}
            columns={[
              { key: "time", header: locale === "vi" ? "Thời điểm" : "Time" },
              { key: "from", header: locale === "vi" ? "Từ" : "From" },
              { key: "to", header: locale === "vi" ? "Đến" : "To" },
              { key: "reason", header: locale === "vi" ? "Lý do" : "Reason" },
              { key: "actor", header: locale === "vi" ? "Người thao tác" : "Actor" },
            ]}
            pagination={
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setStatusLogPage(Math.max(1, statusLogPagination.page - 1))}
                  disabled={statusLogPagination.page <= 1}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {locale === "vi" ? "Trước" : "Prev"}
                </button>
                <span>
                  {locale === "vi" ? "Trang" : "Page"} {statusLogPagination.page}/
                  {statusLogPagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setStatusLogPage(
                      Math.min(statusLogPagination.totalPages, statusLogPagination.page + 1)
                    )
                  }
                  disabled={statusLogPagination.page >= statusLogPagination.totalPages}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {locale === "vi" ? "Sau" : "Next"}
                </button>
              </div>
            }
          >
            {statusLogPagination.items.map((log) => (
              <tr
                key={log.id}
                className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
              >
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateLabel(log.happenedAt.slice(0, 10), { locale })}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {log.fromStatus ? statusLabels[log.fromStatus] : "-"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{statusLabels[log.toStatus]}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {log.reasonCode ?? "-"}
                  {log.reasonNote ? ` · ${log.reasonNote}` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.actorProfileId ?? "-"}</td>
              </tr>
            ))}
          </DataTableShell>

          <DataTableShell
            locale={locale}
            title={copy.rentalHistoryTitle}
            className="rounded-3xl shadow-sm"
            isEmpty={detail.rentalHistory.length === 0}
            emptyState={copy.noHistory}
            columns={[
              { key: "order", header: locale === "vi" ? "Đơn" : "Order" },
              { key: "status", header: locale === "vi" ? "Trạng thái" : "Status" },
              { key: "period", header: locale === "vi" ? "Thời gian" : "Period" },
              { key: "price", header: locale === "vi" ? "Giá thuê" : "Rent price" },
              { key: "createdAt", header: locale === "vi" ? "Tạo lúc" : "Created" },
            ]}
            pagination={
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() =>
                    setRentalHistoryPage(Math.max(1, rentalHistoryPagination.page - 1))
                  }
                  disabled={rentalHistoryPagination.page <= 1}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {locale === "vi" ? "Trước" : "Prev"}
                </button>
                <span>
                  {locale === "vi" ? "Trang" : "Page"} {rentalHistoryPagination.page}/
                  {rentalHistoryPagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRentalHistoryPage(
                      Math.min(
                        rentalHistoryPagination.totalPages,
                        rentalHistoryPagination.page + 1
                      )
                    )
                  }
                  disabled={rentalHistoryPagination.page >= rentalHistoryPagination.totalPages}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {locale === "vi" ? "Sau" : "Next"}
                </button>
              </div>
            }
          >
            {rentalHistoryPagination.items.map((row) => (
              <tr
                key={`${row.orderId}-${row.createdAt}`}
                className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.orderCode}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {resolveOrderStatusLabel(row.orderStatus)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateLabel(row.startDate, { locale })} - {formatDateLabel(row.endDate, { locale })}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatMoney(row.rentPrice, { locale, currency: "VND" }) || "-"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateLabel(row.createdAt.slice(0, 10), { locale })}
                </td>
              </tr>
            ))}
          </DataTableShell>
        </div>

        <aside className="xl:sticky xl:top-24 xl:h-fit">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
            <h2 className="text-lg font-semibold text-foreground">{copy.statusFlowTitle}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{copy.managerOnlyHint}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {statusChipItems.map(([status, label]) => (
                <span key={status} className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.statusFlowTitle}
                </span>
                <select
                  value={selectedStatus ?? ""}
                  onChange={(event) => setSelectedStatus(event.target.value as ItemStatus)}
                  disabled={transitionOptions.length === 0}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm disabled:bg-muted"
                >
                  {transitionOptions.length === 0 ? (
                    <option value="">{copy.invalidTransitionHint}</option>
                  ) : null}
                  {transitionOptions.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.reasonCodeLabel}
                </span>
                <input
                  type="text"
                  value={reasonCode}
                  onChange={(event) => setReasonCode(event.target.value)}
                  placeholder={copy.reasonCodePlaceholder}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.orderRefLabel}
                </span>
                <input
                  type="text"
                  value={orderReference}
                  onChange={(event) => setOrderReference(event.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
              </label>

              <div>
                <VoiceDictationField
                  locale={locale}
                  label={copy.reasonLabel}
                  value={reasonNote}
                  onValueChange={setReasonNote}
                  placeholder={copy.reasonPlaceholder}
                  language={locale === "vi" ? "vi-VN" : "en-US"}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={statusMutation.isPending || !selectedStatus}
                onClick={async () => {
                  try {
                    setActionError(null);
                    await applyStatusTransition();
                    toast.success(
                      locale === "vi" ? "Đã cập nhật trạng thái item." : "Item status updated."
                    );
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : locale === "vi"
                          ? "Cập nhật trạng thái thất bại"
                          : "Status update failed";
                    setActionError(message);
                    toast.error(message);
                  }
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
              >
                {copy.applyStatusAction}
              </button>
            </div>

            {actionError ? <p className="mt-2 text-xs text-destructive">{actionError}</p> : null}
          </section>
        </aside>
      </section>
    </section>
  );
});
