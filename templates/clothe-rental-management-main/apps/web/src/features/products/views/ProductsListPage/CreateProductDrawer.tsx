"use client";

import { toast } from "sonner";
import type { Dispatch, SetStateAction } from "react";
import type { AppLocale } from "@/constants/locale";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { ProductOverviewForm } from "@/features/products/components/ProductOverviewForm";
import type { ProductInitialItemStatus } from "@/types/productsCatalog";
import type { ProductsListPageState } from "./types";

interface CreateProductDrawerProps {
  locale: AppLocale;
  copy: ProductsListPageState["copy"];
  createOpen: boolean;
  createDraft: ProductsListPageState["createDraft"];
  setCreateDraft: ProductsListPageState["setCreateDraft"];
  createItemQuantityInput: string;
  setCreateItemQuantityInput: (value: string) => void;
  createGeneratedItemCodes: string[];
  createInitialItemStatus: ProductInitialItemStatus;
  setCreateInitialItemStatus: (value: ProductInitialItemStatus) => void;
  createItemSize: string;
  setCreateItemSize: (value: string) => void;
  initialItemStatusOptions: ProductsListPageState["initialItemStatusOptions"];
  openCreatePanel: () => void;
  closeCreatePanel: () => void;
  regenerateCreateProductCode: () => void;
  handleCreateProduct: () => Promise<void>;
  resolveCreateErrorMessage: ProductsListPageState["resolveCreateErrorMessage"];
  createMutation: ProductsListPageState["createMutation"];
  categories: ProductsListPageState["categories"];
  tags: ProductsListPageState["tags"];
  genderOptions: ProductsListPageState["genderOptions"];
  canEditPricing: boolean;
  currentBranchId: string | null;
  createError: string | null;
  setCreateError: Dispatch<SetStateAction<string | null>>;
}

export function CreateProductDrawer({
  locale,
  copy,
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
  resolveCreateErrorMessage,
  createMutation,
  categories,
  tags,
  genderOptions,
  canEditPricing,
  currentBranchId,
  createError,
  setCreateError,
}: CreateProductDrawerProps) {
  return (
    <DrawerFormShell
      open={createOpen}
      onOpenChange={(open) => {
        if (open) {
          setCreateError(null);
          openCreatePanel();
          return;
        }
        setCreateError(null);
        closeCreatePanel();
      }}
      title={copy.createPanelTitle}
      description={copy.createPanelDescription}
      widthClassName="w-full max-w-full sm:max-w-[85vw] xl:w-[85vw]"
      footer={
        <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={() => {
              closeCreatePanel();
              setCreateError(null);
            }}
            className="min-h-10 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
          >
            {copy.createCancel}
          </button>
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={async () => {
              try {
                setCreateError(null);
                await handleCreateProduct();
                toast.success(copy.createSuccess);
              } catch (error) {
                const message = resolveCreateErrorMessage(error, copy.createFailed);
                setCreateError(message);
                toast.error(message);
              }
            }}
            className="min-h-10 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {copy.createSubmit}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <ProductOverviewForm
          locale={locale}
          draft={createDraft}
          setDraft={setCreateDraft}
          labels={copy.createFields}
          categories={categories}
          tags={tags}
          genderOptions={genderOptions}
          canEditPricing={canEditPricing}
          allCategoriesLabel={copy.allCategories}
          mediaUrlHint={copy.mediaUrlHint}
          regenerateCodeLabel={copy.regenerateCode}
          onRegenerateCode={regenerateCreateProductCode}
          branchId={currentBranchId}
          layoutMode="twoColumn"
        />

        <section className="space-y-2 rounded-xl border border-border/70 p-3">
          <h3 className="text-sm font-semibold text-foreground">{copy.createItemsTitle}</h3>
          <p className="text-xs text-muted-foreground">{copy.createItemsDescription}</p>

          <div className="grid gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.createFields.itemQuantity}
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={createItemQuantityInput}
                onChange={(event) => setCreateItemQuantityInput(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">{copy.createItemsQuantityHint}</p>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.createFields.initialItemStatus}
              </span>
              <select
                value={createInitialItemStatus}
                onChange={(event) =>
                  setCreateInitialItemStatus(event.target.value as ProductInitialItemStatus)
                }
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                {initialItemStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.createFields.itemSize}
              </span>
              <input
                value={createItemSize}
                onChange={(event) => setCreateItemSize(event.target.value)}
                placeholder={locale === "vi" ? "VD: M, L, XL..." : "Example: M, L, XL..."}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.createFields.itemCodes}
            </span>
            {createGeneratedItemCodes.length > 0 ? (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border bg-background p-2">
                {createGeneratedItemCodes.map((itemCode) => (
                  <p key={itemCode} className="font-mono text-[11px] text-foreground">
                    {itemCode}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{copy.createItemsPreviewEmpty}</p>
            )}
          </div>
        </section>

        {createError ? <p className="text-xs text-destructive">{createError}</p> : null}
        {createMutation.error ? (
          <p className="text-xs text-destructive">
            {resolveCreateErrorMessage(createMutation.error, copy.createFailed)}
          </p>
        ) : null}
      </div>
    </DrawerFormShell>
  );
}
