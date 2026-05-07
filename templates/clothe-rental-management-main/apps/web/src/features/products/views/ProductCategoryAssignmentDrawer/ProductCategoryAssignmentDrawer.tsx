"use client";

import { useEffect } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { useProductCategoryAssignmentDrawer } from "@/features/products/hooks/useProductCategoryAssignmentDrawer";

interface ProductCategoryAssignmentDrawerProps {
  locale: AppLocale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
  categoryId: string | null;
  categoryName: string;
  onAssigned?: () => void | Promise<void>;
}

export function ProductCategoryAssignmentDrawer({
  locale,
  open,
  onOpenChange,
  branchId,
  categoryId,
  categoryName,
  onAssigned,
}: ProductCategoryAssignmentDrawerProps) {
  const {
    copy,
    query,
    updateMutation,
    searchInput,
    setSearchInput,
    page,
    setPage,
    items,
    totalPages,
    selectedProductIds,
    selectedProductIdSet,
    resetSelection,
    toggleProduct,
    assignSelectedProducts,
  } = useProductCategoryAssignmentDrawer({
    locale,
    branchId,
    categoryId,
    open,
  });

  useEffect(() => {
    if (open) return;
    resetSelection();
  }, [open, resetSelection]);

  const selectedCount = selectedProductIds.length;
  const isAssigning = updateMutation.isPending;
  const drawerTitle = categoryName ? `${copy.title}: ${categoryName}` : copy.title;

  return (
    <DrawerFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={drawerTitle}
      description={copy.description}
      widthClassName="w-full max-w-full sm:max-w-2xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="mr-auto text-xs text-muted-foreground">
            {copy.selectedCountLabel}: {selectedCount}
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
          >
            {copy.closeAction}
          </button>
          <button
            type="button"
            disabled={selectedCount === 0 || isAssigning || !categoryId}
            onClick={async () => {
              try {
                await assignSelectedProducts();
                await onAssigned?.();
                toast.success(copy.assignedSuccess);
                onOpenChange(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : copy.assignedFailed);
              }
            }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition disabled:opacity-60"
          >
            {isAssigning ? copy.assigningAction : copy.assignAction}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => {
              setPage(1);
              setSearchInput(event.target.value);
            }}
            placeholder={copy.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
          />
        </div>

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : null}

        <div className="space-y-2">
          {items.map((product) => {
            const checked = selectedProductIdSet.has(product.id);
            const alreadyInCategory = product.productCategoryId === categoryId;

            return (
              <label
                key={product.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={alreadyInCategory || isAssigning}
                  onChange={() => toggleProduct(product.id)}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {product.name}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {copy.productCodeLabel}: {product.productCode}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {copy.currentCategoryLabel}: {product.categoryName ?? copy.noCategoryLabel}
                  </span>
                </span>
                {alreadyInCategory ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    {categoryName}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>

        {!query.isFetching && items.length === 0 ? (
          <p className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {copy.empty}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
            disabled={page <= 1 || query.isFetching}
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
            disabled={page >= totalPages || query.isFetching}
            className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
          >
            {copy.nextPage}
          </button>
        </div>
      </div>
    </DrawerFormShell>
  );
}
