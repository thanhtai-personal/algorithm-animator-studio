"use client";

import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { ITEM_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { useSalesStockPage } from "@/features/sales/hooks/useSalesStockPage";
import { productsClientService } from "@/features/products/services/productsClientService";
import { buildDomainLabels } from "@/utils/domainLabels";

interface SalesStockPageProps {
  locale: AppLocale;
}

export const SalesStockPage = observer(function SalesStockPage({
  locale,
}: SalesStockPageProps) {
  const model = useSalesStockPage(locale);
  const itemStatusLabels = useMemo(
    () => buildDomainLabels(locale, ITEM_STATUS_LABEL_KEYS),
    [locale]
  );

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-bold text-foreground">{model.copy.title}</h1>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <input
          type="search"
          value={model.search}
          onChange={(event) => model.setSearch(event.target.value)}
          placeholder={model.copy.searchPlaceholder}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        />

        <select
          value={model.productCategoryId}
          onChange={(event) => model.setProductCategoryId(event.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="ALL">{model.copy.allCategories}</option>
          {model.categories.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>

        <select
          value={model.statusFilter}
          onChange={(event) => model.setStatusFilter(event.target.value as typeof model.statusFilter)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        >
          {model.statusFilterOptions.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={model.allVisibleItemsSelected}
              onChange={(event) => model.setSelectAllVisible(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span>{model.copy.bulkSelectAllInView}</span>
          </label>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{model.selectedItemIds.length}</span>{" "}
            {model.copy.bulkSelectedLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={model.clearSelection}
            disabled={model.selectedItemIds.length === 0 || model.bulkStatusMutation.isPending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
          >
            {model.copy.bulkClearSelection}
          </button>
          <button
            type="button"
            disabled={model.selectedItemIds.length === 0 || model.bulkStatusMutation.isPending}
            onClick={async () => {
              if (model.selectedItemIds.length === 0) {
                toast.error(
                  locale === "vi"
                    ? "Vui lòng chọn ít nhất 1 item."
                    : "Please select at least one item."
                );
                return;
              }

              try {
                const result = await model.submitMarkSelectedReady();
                const summaryMessage =
                  locale === "vi"
                    ? `Cập nhật thành công ${result.summary.success}/${result.summary.total} item.`
                    : `Updated ${result.summary.success}/${result.summary.total} items successfully.`;

                if (result.summary.failed === 0) {
                  toast.success(summaryMessage);
                } else if (result.summary.success > 0) {
                  toast.warning(summaryMessage);
                } else {
                  toast.error(summaryMessage);
                }
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : locale === "vi"
                      ? "Cập nhật trạng thái hàng loạt thất bại."
                      : "Bulk status update failed.";
                toast.error(message);
              }
            }}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {model.bulkStatusMutation.isPending
              ? locale === "vi"
                ? "Đang xử lý..."
                : "Processing..."
              : model.copy.bulkMarkReady}
          </button>
        </div>
      </div>

      {model.groupedItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          {model.copy.noResult}
        </div>
      ) : (
        <div className="space-y-3">
          {model.groupedItems.map((group) => (
            <article key={group.productId} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-4 px-4 py-3">
                <div
                  className="h-12 w-12 shrink-0 rounded-lg bg-accent bg-cover bg-center"
                  style={
                    group.coverImagePath
                      ? {
                          backgroundImage: `url("${productsClientService.resolveCoverImageUrl(group.coverImagePath) ?? ""}")`,
                        }
                      : undefined
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{group.productName}</p>
                  <p className="text-xs text-muted-foreground">{group.categoryName ?? "-"}</p>
                </div>
                <p className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                  {group.readyCount}/{group.totalCount} {model.copy.readySummarySuffix}
                </p>
              </div>

              <div className="overflow-x-auto border-t border-border">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-medium">{model.copy.tableHeaders.select}</th>
                      <th className="px-4 py-2 font-medium">{model.copy.tableHeaders.item}</th>
                      <th className="px-4 py-2 font-medium">{model.copy.tableHeaders.variant}</th>
                      <th className="px-4 py-2 font-medium">{model.copy.tableHeaders.size}</th>
                      <th className="px-4 py-2 font-medium">{model.copy.tableHeaders.color}</th>
                      <th className="px-4 py-2 font-medium">{model.copy.tableHeaders.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.id} className="border-t border-border/60">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={model.selectedItemIdSet.has(item.id)}
                            onChange={(event) =>
                              model.toggleItemSelection(item.id, event.target.checked)
                            }
                            disabled={model.bulkStatusMutation.isPending}
                            className="h-4 w-4 rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-foreground">{item.itemCode}</td>
                        <td className="px-4 py-2 text-foreground">{item.variantName}</td>
                        <td className="px-4 py-2 text-foreground">{item.size ?? "-"}</td>
                        <td className="px-4 py-2 text-foreground">{item.color ?? "-"}</td>
                        <td className="px-4 py-2">
                          <StatusBadge kind="item" status={item.status} labels={itemStatusLabels} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => model.setPage(Math.max(1, model.page - 1))}
          disabled={model.page <= 1}
          className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
        >
          {model.copy.prevPage}
        </button>
        <span>
          {model.copy.pageLabel} {model.page}/{model.totalPages}
        </span>
        <button
          type="button"
          onClick={() => model.setPage(Math.min(model.totalPages, model.page + 1))}
          disabled={model.page >= model.totalPages}
          className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
        >
          {model.copy.nextPage}
        </button>
      </div>
    </section>
  );
});
