"use client";

import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { MediaPickerModal } from "@/features/media/components/MediaPickerModal";
import { useProductsListPage } from "@/features/products/hooks/useProductsListPage";
import { CreateProductDrawer } from "./CreateProductDrawer";
import { ProductsTableRows } from "./ProductsTableRows";

interface ProductsListPageProps {
  locale: AppLocale;
}

export const ProductsListPage = observer(function ProductsListPage({
  locale,
}: ProductsListPageProps) {
  const {
    copy,
    searchInput,
    setSearchInput,
    productCategoryId,
    setProductCategoryId,
    tagId,
    setTagId,
    hasReadyItems,
    setHasReadyItems,
    page,
    setPage,
    totalPages,
    listQuery,
    listItems,
    listTotal,
    categories,
    tags,
    createOpen,
    createDraft,
    setCreateDraft,
    createItemQuantityInput,
    setCreateItemQuantityInput,
    createGeneratedItemCodes,
    createInitialItemStatus,
    setCreateInitialItemStatus,
    createItemSize,
    setCreateItemSize,
    initialItemStatusOptions,
    openCreatePanel,
    closeCreatePanel,
    regenerateCreateProductCode,
    handleCreateProduct,
    handleDeleteProduct,
    handleQuickSetProductCover,
    resolveCreateErrorMessage,
    createMutation,
    deleteProductMutation,
    updateProductOverviewByIdMutation,
    genderOptions,
    canEditPricing,
    canDeleteProduct,
    currentBranchId,
  } = useProductsListPage(locale);

  const [createError, setCreateError] = useState<string | null>(null);
  const [listActionError, setListActionError] = useState<string | null>(null);
  const [mediaPickerProductId, setMediaPickerProductId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const { confirm } = useAppModal();
  const isDeleteBusy = deleteProductMutation.isPending || isBulkDeleting || deletingProductId !== null;
  const selectedCount = selectedProductIds.size;
  const pageProductCount = listItems.length;
  const allRowsSelected =
    listItems.length > 0 && listItems.every((item) => selectedProductIds.has(item.id));

  useEffect(() => {
    const currentPageIds = new Set(listItems.map((item) => item.id));
    setSelectedProductIds((previous) => {
      let hasRemovedItem = false;
      for (const id of previous) {
        if (!currentPageIds.has(id)) {
          hasRemovedItem = true;
          break;
        }
      }

      if (!hasRemovedItem) {
        return previous;
      }

      const next = new Set<string>();
      for (const id of previous) {
        if (currentPageIds.has(id)) {
          next.add(id);
        }
      }

      return next;
    });
  }, [listItems]);

  const toggleRowSelection = useCallback((productId: string) => {
    setSelectedProductIds((previous) => {
      const next = new Set(previous);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllRows = useCallback(() => {
    if (allRowsSelected) {
      setSelectedProductIds(new Set<string>());
      return;
    }
    setSelectedProductIds(new Set(listItems.map((item) => item.id)));
  }, [allRowsSelected, listItems]);

  const handleDeleteSelectedProducts = useCallback(async () => {
    if (!canDeleteProduct) return;
    if (selectedProductIds.size === 0) {
      const message = copy.deleteSelectedRequireSelection;
      setListActionError(message);
      toast.error(message);
      return;
    }

    const accepted = await confirm({
      title: `${copy.deleteSelectedConfirm} (${selectedProductIds.size})`,
      tone: "danger",
    });
    if (!accepted) return;

    const targetIds = Array.from(selectedProductIds);
    setIsBulkDeleting(true);
    setListActionError(null);
    try {
      const results = await Promise.allSettled(targetIds.map((id) => handleDeleteProduct(id)));
      const failed = results.filter((entry) => entry.status === "rejected") as PromiseRejectedResult[];
      const successCount = results.length - failed.length;

      if (failed.length === 0) {
        setSelectedProductIds(new Set<string>());
        toast.success(copy.deleteSelectedSuccess);
        return;
      }

      const firstFailure = failed[0]?.reason;
      const firstMessage =
        firstFailure instanceof Error
          ? firstFailure.message
          : typeof firstFailure === "string"
            ? firstFailure
            : copy.deleteSelectedFailed;

      if (successCount > 0) {
        setSelectedProductIds(new Set<string>());
        setListActionError(firstMessage);
        toast.error(copy.deleteSelectedPartialFailed);
      } else {
        setListActionError(firstMessage);
        toast.error(firstMessage || copy.deleteSelectedFailed);
      }
    } finally {
      setIsBulkDeleting(false);
    }
  }, [
    canDeleteProduct,
    confirm,
    copy.deleteSelectedConfirm,
    copy.deleteSelectedFailed,
    copy.deleteSelectedPartialFailed,
    copy.deleteSelectedRequireSelection,
    copy.deleteSelectedSuccess,
    handleDeleteProduct,
    selectedProductIds,
  ]);

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground md:max-w-2xl">{copy.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              openCreatePanel();
            }}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm sm:w-auto"
          >
            {copy.createAction}
          </button>
        </div>
      </header>

      <FilterBarShell locale={locale} className="rounded-2xl shadow-sm">
        <div className="relative w-full min-w-0 md:min-w-64 md:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
          />
        </div>

        <label className="flex h-auto min-h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground md:w-auto">
          <span className="shrink-0">{copy.categoryFilter}</span>
          <select
            value={productCategoryId}
            onChange={(event) => setProductCategoryId(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none md:flex-none"
          >
            <option value="">{copy.allCategories}</option>
            {categories.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex h-auto min-h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground md:w-auto">
          <span className="shrink-0">{copy.tagFilter}</span>
          <select
            value={tagId}
            onChange={(event) => setTagId(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none md:flex-none"
          >
            <option value="">{copy.allTags}</option>
            {tags.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground md:w-auto">
          <input
            type="checkbox"
            checked={hasReadyItems}
            onChange={(event) => setHasReadyItems(event.target.checked)}
          />
          {copy.readyOnly}
        </label>

        {listQuery.isFetching ? (
          <div className="inline-flex min-h-10 w-full items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground md:w-auto">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            <span>{copy.filterLoading}</span>
          </div>
        ) : null}
      </FilterBarShell>

      <DataTableShell
        locale={locale}
        title={copy.title}
        subtitle={copy.subtitle}
        toolbar={
          <div className="grid w-full min-w-0 grid-cols-2 gap-2 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center md:justify-end">
            <span className="min-w-0">
              {copy.selectedCount}: <strong className="text-foreground">{selectedCount}</strong>
            </span>
            <span className="min-w-0">
              {copy.pageCount}: <strong className="text-foreground">{pageProductCount}</strong>
            </span>
            <span className="col-span-2 min-w-0 sm:col-span-1">
              {copy.totalCount}: <strong className="text-foreground">{listTotal}</strong>
            </span>
            {canDeleteProduct ? (
              <button
                type="button"
                disabled={selectedCount === 0 || isDeleteBusy}
                onClick={() => {
                  void handleDeleteSelectedProducts();
                }}
                className="col-span-2 inline-flex h-9 min-w-0 items-center justify-center rounded-lg border border-destructive/70 px-3 font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50 sm:col-span-1 sm:h-8"
              >
                {isBulkDeleting ? copy.deleteSelectedLoading : copy.deleteSelectedAction}
              </button>
            ) : null}
          </div>
        }
        isLoading={listQuery.isFetching && listItems.length === 0}
        isEmpty={!listQuery.isFetching && listItems.length === 0}
        loadingState={copy.loading}
        emptyState={copy.empty}
        className="rounded-3xl shadow-md"
        columns={[
          {
            key: "select",
            header: (
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={allRowsSelected}
                  disabled={isDeleteBusy || listItems.length === 0}
                  onChange={toggleSelectAllRows}
                  aria-label={copy.selectAll}
                />
              </label>
            ),
          },
          { key: "product", header: copy.tableHeaders.product },
          { key: "category", header: copy.tableHeaders.category },
          { key: "tags", header: copy.tableHeaders.tags },
          { key: "pricePolicy", header: copy.tableHeaders.pricePolicy },
          { key: "items", header: copy.tableHeaders.items },
          { key: "actions", header: copy.tableHeaders.actions },
        ]}
        pagination={
          <div className="grid grid-cols-2 items-center gap-2 text-xs text-muted-foreground sm:flex sm:justify-end">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              disabled={page <= 1}
              className="min-h-9 rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {copy.prevPage}
            </button>
            <span className="order-first col-span-2 text-center sm:order-none sm:col-span-1">
              {copy.pageLabel} {page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              disabled={page >= totalPages}
              className="min-h-9 rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {copy.nextPage}
            </button>
          </div>
        }
      >
        <ProductsTableRows
          locale={locale}
          copy={copy}
          listItems={listItems}
          selectedProductIds={selectedProductIds}
          setSelectedProductIds={setSelectedProductIds}
          setMediaPickerProductId={setMediaPickerProductId}
          setListActionError={setListActionError}
          setDeletingProductId={setDeletingProductId}
          confirm={confirm}
          canDeleteProduct={canDeleteProduct}
          isDeleteBusy={isDeleteBusy}
          deletingProductId={deletingProductId}
          handleDeleteProduct={handleDeleteProduct}
          toggleRowSelection={toggleRowSelection}
          updateProductOverviewByIdMutation={updateProductOverviewByIdMutation}
        />
      </DataTableShell>

      {listActionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {listActionError}
        </p>
      ) : null}

      <MediaPickerModal
        locale={locale}
        open={Boolean(mediaPickerProductId)}
        onOpenChange={(open) => {
          if (!open) {
            setMediaPickerProductId(null);
          }
        }}
        branchId={currentBranchId}
        defaultMediaType="image"
        onSelectAsset={(asset) => {
          if (!mediaPickerProductId) return;
          const selectedUrl = asset.publicUrl?.trim();
          if (!selectedUrl) {
            toast.error(copy.quickCoverInvalidAsset);
            return;
          }

          void (async () => {
            try {
              setListActionError(null);
              await handleQuickSetProductCover(mediaPickerProductId, selectedUrl);
              toast.success(copy.quickCoverSuccess);
              setMediaPickerProductId(null);
            } catch (error) {
              const message = error instanceof Error ? error.message : copy.quickCoverFailed;
              setListActionError(message);
              toast.error(message);
            }
          })();
        }}
      />
      <CreateProductDrawer
        locale={locale}
        copy={copy}
        createOpen={createOpen}
        createDraft={createDraft}
        setCreateDraft={setCreateDraft}
        createItemQuantityInput={createItemQuantityInput}
        setCreateItemQuantityInput={setCreateItemQuantityInput}
        createGeneratedItemCodes={createGeneratedItemCodes}
        createInitialItemStatus={createInitialItemStatus}
        setCreateInitialItemStatus={setCreateInitialItemStatus}
        createItemSize={createItemSize}
        setCreateItemSize={setCreateItemSize}
        initialItemStatusOptions={initialItemStatusOptions}
        openCreatePanel={openCreatePanel}
        closeCreatePanel={closeCreatePanel}
        regenerateCreateProductCode={regenerateCreateProductCode}
        handleCreateProduct={handleCreateProduct}
        resolveCreateErrorMessage={resolveCreateErrorMessage}
        createMutation={createMutation}
        categories={categories}
        tags={tags}
        genderOptions={genderOptions}
        canEditPricing={canEditPricing}
        currentBranchId={currentBranchId}
        createError={createError}
        setCreateError={setCreateError}
      />
    </section>
  );
});
