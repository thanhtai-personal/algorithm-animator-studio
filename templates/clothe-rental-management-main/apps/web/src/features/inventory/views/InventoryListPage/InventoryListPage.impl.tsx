"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { useInventoryListPage } from "@/features/inventory/hooks/useInventoryListPage";
import {
  useBulkUpdateInventoryItemStatusMutation,
  useUpdateInventoryItemStatusAnyMutation,
} from "@/features/inventory/queries/useInventoryQueries";
import { inventoryClientService } from "@/features/inventory/services/inventoryClientService";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { ITEM_STATUS_LABELS, isManagerPlusRole } from "@/features/inventory/utils/statusPresentation";
import { formatDateLabel } from "@/utils/format/date";

interface InventoryListPageProps {
  locale: AppLocale;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{message}</p>;
}

export const InventoryListPage = observer(function InventoryListPage({
  locale,
}: InventoryListPageProps) {
  const {
    copy,
    viewMode,
    setViewMode,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    productCategoryId,
    setProductCategoryId,
    sizeFilter,
    setSizeFilter,
    branchFilter,
    setBranchFilter,
    page,
    setPage,
    totalPages,
    listQuery,
    listItems,
    productListItems,
    categories,
    sizes,
    branchOptions,
    statusOptions,
    addItemOpen,
    addItemDraft,
    setAddItemDraftField,
    addItemFieldErrors,
    addItemProductSearchInput,
    setAddItemProductSearchInput,
    addItemProductOptions,
    addItemInitialStatusOptions,
    openAddItemPanel,
    closeAddItemPanel,
    submitAddItems,
    productOptionsQuery,
    addItemsMutation,
    resolveAddItemErrorMessage,
  } = useInventoryListPage(locale);
  const statusMutation = useUpdateInventoryItemStatusAnyMutation();
  const bulkStatusMutation = useBulkUpdateInventoryItemStatusMutation();
  const { role } = useAuthAccess();
  const canRetire = isManagerPlusRole(role);

  const [actionError, setActionError] = useState<string | null>(null);
  const [addItemActionError, setAddItemActionError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const { confirm, prompt } = useAppModal();
  const visibleItemIds = useMemo(
    () => (viewMode === "items" ? listItems.map((item) => item.id) : []),
    [listItems, viewMode]
  );
  const visibleItemIdSet = useMemo(() => new Set(visibleItemIds), [visibleItemIds]);
  const selectedVisibleItemIds = selectedItemIds.filter((itemId) =>
    visibleItemIdSet.has(itemId)
  );
  const selectedItemIdSet = new Set(selectedVisibleItemIds);
  const allVisibleItemsSelected =
    visibleItemIds.length > 0 && visibleItemIds.every((itemId) => selectedItemIdSet.has(itemId));

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/inventory/scan`}
              className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground"
            >
              {copy.scanAction}
            </Link>
            <button
              type="button"
              onClick={() => {
                setAddItemActionError(null);
                openAddItemPanel();
              }}
              className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              {copy.addItemAction}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.viewModeLabel}
        </span>
        <button
          type="button"
          onClick={() => setViewMode("items")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === "items"
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          }`}
        >
          {copy.viewModes.items}
        </button>
        <button
          type="button"
          onClick={() => setViewMode("products")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === "products"
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          }`}
        >
          {copy.viewModes.products}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            statusFilter === "" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
          }`}
        >
          {copy.allStatuses}
        </button>
        {statusOptions.map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => setStatusFilter(entry.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === entry.value
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <FilterBarShell locale={locale} className="rounded-2xl shadow-sm">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
          />
        </div>

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
          <span>{copy.statusFilter}</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="">{copy.allStatuses}</option>
            {statusOptions.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
          <span>{copy.categoryFilter}</span>
          <select
            value={productCategoryId}
            onChange={(event) => setProductCategoryId(event.target.value)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="">{copy.allCategories}</option>
            {categories.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
          <span>{copy.sizeFilter}</span>
          <select
            value={sizeFilter}
            onChange={(event) => setSizeFilter(event.target.value)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="">{copy.allSizes}</option>
            {sizes.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
          <span>{copy.branchFilter}</span>
          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="">{copy.allBranches}</option>
            {branchOptions.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
      </FilterBarShell>

      {viewMode === "items" ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={allVisibleItemsSelected}
                onChange={(event) => {
                  if (event.target.checked) {
                    setSelectedItemIds(visibleItemIds);
                    return;
                  }
                  setSelectedItemIds([]);
                }}
                className="h-4 w-4 rounded border-border"
              />
              <span>{copy.bulkSelectAll}</span>
            </label>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {selectedVisibleItemIds.length}
              </span>{" "}
              {copy.bulkSelectedLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedItemIds([])}
              disabled={selectedVisibleItemIds.length === 0 || bulkStatusMutation.isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
            >
              {copy.bulkClearSelection}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (selectedVisibleItemIds.length === 0) {
                  const message =
                    locale === "vi"
                      ? "Vui lòng chọn ít nhất 1 item."
                      : "Please select at least one item.";
                  setActionError(message);
                  toast.error(message);
                  return;
                }

                try {
                  setActionError(null);
                  const result = await bulkStatusMutation.mutateAsync({
                    itemIds: selectedVisibleItemIds,
                    toStatus: "READY",
                    reasonCode: "LAUNDRY_COMPLETED",
                  });

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

                  if (result.failedItems.length > 0) {
                    const firstError = result.failedItems[0];
                    setActionError(
                      locale === "vi"
                        ? `${summaryMessage} Lỗi mẫu: ${firstError.itemCode ?? firstError.itemId} (${firstError.reasonCode}).`
                        : `${summaryMessage} First error: ${firstError.itemCode ?? firstError.itemId} (${firstError.reasonCode}).`
                    );
                  } else {
                    setActionError(null);
                  }

                  const succeededIdSet = new Set(result.succeededItemIds);
                  setSelectedItemIds((previous) =>
                    previous.filter((itemId) => !succeededIdSet.has(itemId))
                  );
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : locale === "vi"
                        ? "Cập nhật trạng thái hàng loạt thất bại."
                        : "Bulk status update failed.";
                  setActionError(message);
                  toast.error(message);
                }
              }}
              disabled={selectedVisibleItemIds.length === 0 || bulkStatusMutation.isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {bulkStatusMutation.isPending
                ? locale === "vi"
                  ? "Đang xử lý..."
                  : "Processing..."
                : copy.bulkMarkReady}
            </button>
          </div>
        </div>
      ) : null}

      <DataTableShell
        locale={locale}
        title={copy.title}
        subtitle={copy.subtitle}
        isLoading={
          listQuery.isFetching &&
          (viewMode === "items" ? listItems.length === 0 : productListItems.length === 0)
        }
        isEmpty={
          !listQuery.isFetching &&
          (viewMode === "items" ? listItems.length === 0 : productListItems.length === 0)
        }
        loadingState={viewMode === "items" ? copy.loading : copy.loadingProducts}
        emptyState={viewMode === "items" ? copy.empty : copy.emptyProducts}
        className="rounded-3xl shadow-md"
        columns={
          viewMode === "items"
            ? [
                { key: "select", header: "" },
                { key: "code", header: copy.tableHeaders.code },
                { key: "productVariant", header: copy.tableHeaders.productVariant },
                { key: "status", header: copy.tableHeaders.status },
                { key: "currentOrder", header: copy.tableHeaders.currentOrder },
                { key: "lastMovement", header: copy.tableHeaders.lastMovement },
                { key: "actions", header: copy.tableHeaders.actions },
              ]
            : [
                { key: "product", header: copy.productTableHeaders.product },
                { key: "itemCount", header: copy.productTableHeaders.itemCount },
                { key: "readyItemCount", header: copy.productTableHeaders.readyItemCount },
                { key: "actions", header: copy.productTableHeaders.actions },
              ]
        }
        pagination={
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {copy.prevPage}
            </button>
            <span>
              {copy.pageLabel} {page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {copy.nextPage}
            </button>
          </div>
        }
      >
        {viewMode === "items"
          ? listItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItemIdSet.has(item.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedItemIds((previous) =>
                          previous.includes(item.id) ? previous : [...previous, item.id]
                        );
                        return;
                      }
                      setSelectedItemIds((previous) =>
                        previous.filter((itemId) => itemId !== item.id)
                      );
                    }}
                    disabled={bulkStatusMutation.isPending}
                    className="h-4 w-4 rounded border-border"
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-foreground">{item.itemCode}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.qrCode ?? "-"}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-border bg-muted">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          {locale === "vi" ? "Không ảnh" : "N/A"}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variantName} {item.size ? `· ${item.size}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    kind="item"
                    status={item.status}
                    labels={ITEM_STATUS_LABELS[locale]}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {item.currentOrder ? (
                    <Link href={`/${locale}/orders`} className="underline">
                      {item.currentOrder.orderCode}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {item.lastMovementAt ? (
                    <div>
                      <p>{formatDateLabel(item.lastMovementAt.slice(0, 10), { locale })}</p>
                      <p>{item.lastMovementLabel ?? "-"}</p>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/${locale}/inventory/${item.id}`}
                      aria-label={copy.viewDetail}
                      title={copy.viewDetail}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">{copy.viewDetail}</span>
                    </Link>
                    <Link
                      href={`/${locale}/inventory/${item.id}`}
                      aria-label={copy.changeStatus}
                      title={copy.changeStatus}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{copy.changeStatus}</span>
                    </Link>
                    <button
                      type="button"
                      disabled={
                        !canRetire ||
                        statusMutation.isPending ||
                        item.status === "RETIRED" ||
                        item.status === "SOLD"
                      }
                      aria-label={copy.retire}
                      title={copy.retire}
                      onClick={async () => {
                        const confirmed = await confirm({
                          title:
                            locale === "vi"
                              ? `Bạn có chắc muốn ngưng sử dụng item ${item.itemCode}?`
                              : `Do you want to retire item ${item.itemCode}?`,
                          tone: "danger",
                        });

                        if (!confirmed) return;

                        const reason = await prompt({
                          title:
                            locale === "vi"
                              ? "Nhập lý do ngưng sử dụng"
                              : "Enter retire reason",
                        });

                        try {
                          setActionError(null);
                          await statusMutation.mutateAsync({
                            itemId: item.id,
                            payload: inventoryClientService.toStatusPayload({
                              toStatus: "RETIRED",
                              reasonCode: "MANUAL_RETIRED",
                              reasonNote: reason ?? undefined,
                            }),
                          });
                          toast.success(
                            locale === "vi"
                              ? "Đã ngưng sử dụng item thành công."
                              : "Item retired successfully."
                          );
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : locale === "vi"
                                ? "Ngưng sử dụng item thất bại"
                                : "Retire item failed";
                          setActionError(message);
                          toast.error(message);
                        }
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/70 text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{copy.retire}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          : productListItems.map((product) => (
              <tr
                key={product.productId}
                className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-border bg-muted">
                      {product.coverImageUrl ? (
                        <img
                          src={product.coverImageUrl}
                          alt={product.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          {locale === "vi" ? "Không ảnh" : "N/A"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{product.productName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{product.productCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{product.itemCount}</td>
                <td className="px-4 py-3 text-sm font-semibold text-success">
                  {product.readyItemCount}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${locale}/products/${product.productId}`}
                    aria-label={copy.viewProduct}
                    title={copy.viewProduct}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">{copy.viewProduct}</span>
                  </Link>
                </td>
              </tr>
            ))}
      </DataTableShell>

      <DrawerFormShell
        open={addItemOpen}
        onOpenChange={(open) => {
          if (open) {
            setAddItemActionError(null);
            openAddItemPanel();
            return;
          }
          setAddItemActionError(null);
          closeAddItemPanel();
        }}
        title={copy.addItemPanelTitle}
        description={copy.addItemPanelDescription}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAddItemActionError(null);
                closeAddItemPanel();
              }}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
            >
              {copy.addItemCancel}
            </button>
            <button
              type="button"
              disabled={addItemsMutation.isPending}
              onClick={async () => {
                try {
                  setAddItemActionError(null);
                  await submitAddItems();
                  toast.success(copy.addItemSuccess);
                } catch (error) {
                  const message = resolveAddItemErrorMessage(error, copy.addItemFailed);
                  setAddItemActionError(message);
                  toast.error(message);
                }
              }}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {copy.addItemSubmit}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <section className="space-y-3 rounded-xl border border-border/70 p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.addItemFields.productSearch}
                </span>
                <input
                  type="search"
                  value={addItemProductSearchInput}
                  onChange={(event) => setAddItemProductSearchInput(event.target.value)}
                  placeholder={copy.addItemSearchPlaceholder}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.addItemFields.product}
                </span>
                <select
                  value={addItemDraft.productId}
                  onChange={(event) => setAddItemDraftField("productId", event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">-</option>
                  {addItemProductOptions.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.productCode} · {entry.name}
                    </option>
                  ))}
                </select>
                <FieldError message={addItemFieldErrors.productId} />
              </label>
            </div>

            {productOptionsQuery.isFetching ? (
              <p className="text-xs text-muted-foreground">{copy.addItemProductsLoading}</p>
            ) : null}
            {!productOptionsQuery.isFetching && addItemProductOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">{copy.addItemProductsEmpty}</p>
            ) : null}
            <FieldError message={addItemFieldErrors.branchId} />
          </section>

          <section className="space-y-3 rounded-xl border border-border/70 p-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.addItemFields.itemCodes}
              </span>
              <textarea
                rows={5}
                value={addItemDraft.itemCodesText}
                onChange={(event) => setAddItemDraftField("itemCodesText", event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">{copy.addItemCodesHint}</p>
              <FieldError message={addItemFieldErrors.itemCodesText} />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.addItemFields.initialStatus}
                </span>
                <select
                  value={addItemDraft.initialStatus}
                  onChange={(event) =>
                    setAddItemDraftField(
                      "initialStatus",
                      event.target.value as typeof addItemDraft.initialStatus
                    )
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {addItemInitialStatusOptions.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <FieldError message={addItemFieldErrors.initialStatus} />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.addItemFields.itemSize}
                </span>
                <input
                  value={addItemDraft.itemSize}
                  onChange={(event) => setAddItemDraftField("itemSize", event.target.value)}
                  placeholder={copy.addItemSizePlaceholder}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              </label>
            </div>
          </section>

          {addItemActionError ? (
            <p className="text-xs text-destructive">{addItemActionError}</p>
          ) : null}
          {addItemsMutation.error ? (
            <p className="text-xs text-destructive">
              {resolveAddItemErrorMessage(addItemsMutation.error, copy.addItemFailed)}
            </p>
          ) : null}
        </div>
      </DrawerFormShell>

      {actionError ? <p className="text-xs text-destructive">{actionError}</p> : null}
    </section>
  );
});
