"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ArrowLeft, Check, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { ProductOverviewForm } from "@/features/products/components/ProductOverviewForm";
import { useProductDetailPage } from "@/features/products/hooks/useProductDetailPage";
import { paginateItems } from "@/utils/pagination";
import {
  formatProductActivityDateTime,
  PRODUCT_ACTIVITY_PAGE_SIZE,
  PRODUCT_ITEMS_PAGE_SIZE,
  renderProductActivityAction,
} from "./utils";
import type { ProductDetailPageProps } from "./types";

export const ProductDetailPage = observer(function ProductDetailPage({
  locale,
  productId,
}: ProductDetailPageProps) {
  const {
    copy,
    detail,
    detailQuery,
    activeTab,
    setActiveTab,
    overviewDraft,
    setOverviewDraft,
    canEditPricing,
    saveOverview,
    updateOverviewMutation,
    addItemsQuantity,
    setAddItemsQuantity,
    addItemsSize,
    setAddItemsSize,
    itemStatusLabels,
    addItemsToProduct,
    addItemsMutation,
    editingItemId,
    editingItemCode,
    setEditingItemCode,
    editingItemSize,
    setEditingItemSize,
    startEditingItem,
    cancelEditingItem,
    saveEditedItem,
    updateItemMutation,
    deleteItem,
    deleteItemMutation,
    resolveActionErrorMessage,
    genderOptions,
    tabs,
  } = useProductDetailPage(locale, productId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [itemsPage, setItemsPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const { confirm } = useAppModal();

  if (detailQuery.isLoading && !detail) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {copy.loading}
      </section>
    );
  }

  if (!detail || !overviewDraft) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive">
        {copy.notFound}
      </section>
    );
  }

  const itemsPagination = paginateItems(detail.items, itemsPage, PRODUCT_ITEMS_PAGE_SIZE);
  const activityPagination = paginateItems(
    detail.activity,
    activityPage,
    PRODUCT_ACTIVITY_PAGE_SIZE
  );
  const canEditProductCode = detail.overview.productCode.trim().toUpperCase().startsWith("AUTO");
  const pageLabel = locale === "vi" ? "Trang" : "Page";
  const prevLabel = locale === "vi" ? "Trước" : "Prev";
  const nextLabel = locale === "vi" ? "Sau" : "Next";

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href={`/${locale}/products`}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {copy.backAction}
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{detail.overview.name}</h1>
            <p className="font-mono text-xs text-muted-foreground">{detail.overview.productCode}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {detail.overview.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <nav className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-muted/50 p-1.5">
        {tabs.map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setActiveTab(tabKey)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === tabKey
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/70"
            }`}
          >
            {copy.tabs[tabKey]}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.overviewTitle}</h2>

          <div className="mt-5">
            <ProductOverviewForm
              locale={locale}
              draft={overviewDraft}
              setDraft={setOverviewDraft}
              labels={copy.overviewFields}
              categories={detail.categories}
              tags={detail.tags}
              genderOptions={genderOptions}
              canEditPricing={canEditPricing}
              allCategoriesLabel={copy.allCategories}
              mediaUrlHint={copy.mediaUrlHint}
              productCodeReadOnly={!canEditProductCode}
              successfulRentCountLabel={copy.overviewFields.successfulRentCount}
              successfulRentCount={detail.overview.successfulRentCount}
              branchId={detail.overview.branchId}
              layoutMode="twoColumn"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={updateOverviewMutation.isPending}
              onClick={async () => {
                try {
                  setActionError(null);
                  await saveOverview();
                  toast.success(copy.overviewSavedSuccess);
                } catch (error) {
                  const message = resolveActionErrorMessage(error, copy.overviewSaveFailed);
                  setActionError(message);
                  toast.error(message);
                }
              }}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {copy.saveOverview}
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === "items" ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
          <div className="space-y-3 rounded-2xl border border-border/70 p-4">
            <h3 className="text-base font-semibold text-foreground">{copy.addItemsTitle}</h3>
            <p className="text-xs text-muted-foreground">{copy.addItemsDescription}</p>

            <div className="grid gap-3 md:grid-cols-[220px,220px,auto] md:items-end">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.overviewFields.itemQuantity}
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={addItemsQuantity}
                  onChange={(event) => setAddItemsQuantity(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.addItemsSizeLabel}
                </span>
                <input
                  value={addItemsSize}
                  onChange={(event) => setAddItemsSize(event.target.value)}
                  placeholder={copy.itemsTableHeaders.size}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              </label>

              <div className="flex justify-end md:justify-start">
                <button
                  type="button"
                  disabled={addItemsMutation.isPending}
                  onClick={async () => {
                    try {
                      setActionError(null);
                      await addItemsToProduct();
                      toast.success(copy.addItemsSuccess);
                    } catch (error) {
                      const message = resolveActionErrorMessage(error, copy.addItemsFailed);
                      setActionError(message);
                      toast.error(message);
                    }
                  }}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {copy.addItemsAction}
                </button>
              </div>
            </div>

            {detail.items.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-xl border border-border/70">
                  <table className="w-full min-w-[560px] text-left">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">{copy.itemsTableHeaders.itemCode}</th>
                        <th className="px-3 py-2 font-semibold">{copy.itemsTableHeaders.size}</th>
                        <th className="px-3 py-2 font-semibold">{copy.itemsTableHeaders.status}</th>
                        <th className="px-3 py-2 font-semibold">{copy.itemsTableHeaders.lastRentDate}</th>
                        <th className="px-3 py-2 font-semibold">{copy.itemsTableHeaders.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {itemsPagination.items.map((item) => {
                        const isEditing = editingItemId === item.id;

                        return (
                          <tr key={item.id} className="border-t border-border/60 align-top">
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <input
                                  value={editingItemCode}
                                  onChange={(event) => setEditingItemCode(event.target.value)}
                                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs font-mono"
                                />
                              ) : (
                                <span className="font-mono text-foreground">{item.itemCode}</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <input
                                  value={editingItemSize}
                                  onChange={(event) => setEditingItemSize(event.target.value)}
                                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                                />
                              ) : (
                                <span className="text-muted-foreground">{item.size ?? "-"}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {itemStatusLabels[item.status]}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {item.lastRentDate?.slice(0, 10) ?? "-"}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      aria-label={copy.saveItemAction}
                                      title={copy.saveItemAction}
                                      disabled={updateItemMutation.isPending}
                                      onClick={async () => {
                                        try {
                                          setActionError(null);
                                          await saveEditedItem();
                                          toast.success(copy.editItemSuccess);
                                        } catch (error) {
                                          const message = resolveActionErrorMessage(error, copy.editItemFailed);
                                          setActionError(message);
                                          toast.error(message);
                                        }
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-emerald-600 transition hover:bg-accent/70 disabled:opacity-60"
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="sr-only">{copy.saveItemAction}</span>
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={copy.cancelItemAction}
                                      title={copy.cancelItemAction}
                                      disabled={updateItemMutation.isPending}
                                      onClick={cancelEditingItem}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent/70 disabled:opacity-60"
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">{copy.cancelItemAction}</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      aria-label={copy.editItemAction}
                                      title={copy.editItemAction}
                                      disabled={updateItemMutation.isPending || deleteItemMutation.isPending}
                                      onClick={() => startEditingItem(item)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent/70 disabled:opacity-60"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">{copy.editItemAction}</span>
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={copy.deleteItemAction}
                                      title={copy.deleteItemAction}
                                      disabled={updateItemMutation.isPending || deleteItemMutation.isPending}
                                      onClick={async () => {
                                        const confirmed = await confirm({
                                          title: copy.deleteItemConfirm,
                                          tone: "danger",
                                        });
                                        if (!confirmed) return;

                                        try {
                                          setActionError(null);
                                          await deleteItem(item.id);
                                          toast.success(copy.deleteItemSuccess);
                                        } catch (error) {
                                          const message = resolveActionErrorMessage(error, copy.deleteItemFailed);
                                          setActionError(message);
                                          toast.error(message);
                                        }
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">{copy.deleteItemAction}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setItemsPage(Math.max(1, itemsPagination.page - 1))}
                    disabled={itemsPagination.page <= 1}
                    className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                  >
                    {prevLabel}
                  </button>
                  <span>
                    {pageLabel} {itemsPagination.page}/{itemsPagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setItemsPage(
                        Math.min(itemsPagination.totalPages, itemsPagination.page + 1)
                      )
                    }
                    disabled={itemsPagination.page >= itemsPagination.totalPages}
                    className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                  >
                    {nextLabel}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{copy.noItems}</p>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
          <h2 className="text-lg font-semibold text-foreground">{copy.activityTitle}</h2>

          {detail.activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{copy.activityNoData}</p>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">{copy.activityHeaders.when}</th>
                      <th className="px-3 py-2">{copy.activityHeaders.action}</th>
                      <th className="px-3 py-2">{copy.activityHeaders.item}</th>
                      <th className="px-3 py-2">{copy.activityHeaders.status}</th>
                      <th className="px-3 py-2">{copy.activityHeaders.reason}</th>
                      <th className="px-3 py-2">{copy.activityHeaders.actor}</th>
                      <th className="px-3 py-2">{copy.activityHeaders.detail}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityPagination.items.map((entry) => {
                      const fromStatusLabel = entry.fromStatus ? itemStatusLabels[entry.fromStatus] : null;
                      const toStatusLabel = entry.toStatus ? itemStatusLabels[entry.toStatus] : null;
                      const statusLabel =
                        fromStatusLabel && toStatusLabel
                          ? `${fromStatusLabel} -> ${toStatusLabel}`
                          : toStatusLabel ?? fromStatusLabel ?? "-";

                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
                        >
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {formatProductActivityDateTime(entry.createdAt, locale)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {renderProductActivityAction(entry.action)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {entry.itemCode ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {statusLabel}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {entry.reason ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {entry.actorName ?? entry.actorProfileId ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {entry.meta ? JSON.stringify(entry.meta) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setActivityPage(Math.max(1, activityPagination.page - 1))}
                  disabled={activityPagination.page <= 1}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {prevLabel}
                </button>
                <span>
                  {pageLabel} {activityPagination.page}/{activityPagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActivityPage(
                      Math.min(activityPagination.totalPages, activityPagination.page + 1)
                    )
                  }
                  disabled={activityPagination.page >= activityPagination.totalPages}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {nextLabel}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {actionError ? (
        <p className="text-sm text-destructive">{actionError}</p>
      ) : null}
    </section>
  );
});
