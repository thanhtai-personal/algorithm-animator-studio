"use client";

import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { PackagePlus, Pencil, Trash2 } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { ProductCategoryAssignmentDrawer } from "@/features/products";
import { useSettingsCategoriesPage } from "@/features/settings/hooks/useSettingsCategoriesPage";
import { paginateItems } from "@/utils/pagination";

interface SettingsCategoriesPageProps {
  locale: AppLocale;
}

const SETTINGS_CATEGORIES_PAGE_SIZE = 12;

export const SettingsCategoriesPage = observer(function SettingsCategoriesPage({
  locale,
}: SettingsCategoriesPageProps) {
  const {
    copy,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
    categoriesPayload,
    branchId,
    setBranchId,
    branchOptions,
    createCode,
    setCreateCode,
    createName,
    setCreateName,
    createSortOrder,
    setCreateSortOrder,
    createIsActive,
    setCreateIsActive,
    rowDraftById,
    setRowDraft,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
    actionError,
    actionSuccess,
  } = useSettingsCategoriesPage(locale);
  const { confirm } = useAppModal();

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [assigningCategoryId, setAssigningCategoryId] = useState<string | null>(null);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const cancelActionLabel = locale === "vi" ? "Hủy" : "Cancel";
  const addProductsActionLabel = locale === "vi" ? "Thêm sản phẩm" : "Add products";

  const editingCategory = useMemo(() => {
    if (!categoriesPayload || !editingCategoryId) return null;
    return categoriesPayload.items.find((entry) => entry.id === editingCategoryId) ?? null;
  }, [categoriesPayload, editingCategoryId]);

  const editingDraft = editingCategoryId ? rowDraftById[editingCategoryId] ?? null : null;
  const assigningCategory = useMemo(() => {
    if (!categoriesPayload || !assigningCategoryId) return null;
    return categoriesPayload.items.find((entry) => entry.id === assigningCategoryId) ?? null;
  }, [assigningCategoryId, categoriesPayload]);
  const isEditModalOpen = Boolean(editingCategory && editingDraft);
  const categoriesPagination = paginateItems(
    categoriesPayload?.items ?? [],
    categoriesPage,
    SETTINGS_CATEGORIES_PAGE_SIZE
  );

  const tableRows = useMemo(() => {
    if (!categoriesPayload) return null;

    return categoriesPagination.items.map((row) => {
      const isDeleteDisabled = row.isSystem || row.productCount > 0;

      return (
        <tr key={row.id} className="border-b border-border/70 last:border-0">
          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.code}</td>
          <td className="px-4 py-3 text-sm text-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">{row.name}</span>
              {row.isSystem ? (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {copy.systemLabel}
                </span>
              ) : null}
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">{row.sortOrder}</td>
          <td className="px-4 py-3 text-xs">
            <span
              className={`rounded-full px-2.5 py-1 font-semibold ${
                row.isActive
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {row.isActive ? copy.activeLabel : copy.inactiveLabel}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">{row.productCount}</td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAssigningCategoryId(row.id)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs text-foreground transition hover:bg-accent/60"
              >
                <PackagePlus className="h-3.5 w-3.5" />
                {addProductsActionLabel}
              </button>

              <button
                type="button"
                onClick={() => setEditingCategoryId(row.id)}
                disabled={row.isSystem}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs text-foreground transition hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Pencil className="h-3.5 w-3.5" />
                {copy.editAction}
              </button>

              <button
                type="button"
                onClick={async () => {
                  const accepted = await confirm({
                    title: copy.confirmDelete,
                    tone: "danger",
                    confirmText: copy.deleteAction,
                    cancelText: cancelActionLabel,
                  });
                  if (!accepted) return;
                  void onDeleteCategory(row.id);
                }}
                disabled={isDeleteDisabled || deleteMutation.isPending}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/40 px-2.5 text-xs text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {copy.deleteAction}
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }, [
    cancelActionLabel,
    addProductsActionLabel,
    categoriesPayload,
    categoriesPagination.items,
    confirm,
    copy.activeLabel,
    copy.confirmDelete,
    copy.deleteAction,
    copy.editAction,
    copy.inactiveLabel,
    copy.systemLabel,
    deleteMutation.isPending,
    onDeleteCategory,
  ]);

  if (!categoriesPayload && query.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      </section>
    );
  }

  if (!categoriesPayload && query.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/5 p-6 shadow-md">
        <p className="text-sm text-destructive">{copy.loadError}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {copy.retryAction}
        </button>
      </section>
    );
  }

  if (!categoriesPayload) {
    return null;
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
      </header>

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      {actionSuccess ? (
        <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
          {actionSuccess}
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{copy.branchLabel}</span>
          <select
            value={branchId ?? categoriesPayload.branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              setCategoriesPage(1);
            }}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          >
            {branchOptions.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{copy.createTitle}</h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.codeLabel}</span>
            <input
              type="text"
              value={createCode}
              onChange={(event) => setCreateCode(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.nameLabel}</span>
            <input
              type="text"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.sortOrderLabel}</span>
            <input
              type="number"
              min={0}
              step={1}
              value={createSortOrder}
              onChange={(event) => setCreateSortOrder(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={createIsActive}
              onChange={(event) => setCreateIsActive(event.target.checked)}
            />
            <span>{copy.activeLabel}</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void onCreateCategory()}
            disabled={createMutation.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {copy.createAction}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <DataTableShell
          locale={locale}
          title={copy.listTitle}
          columns={[
            { key: "code", header: copy.tableCode },
            { key: "name", header: copy.tableName },
            { key: "sortOrder", header: copy.tableSortOrder },
            { key: "status", header: copy.tableStatus },
            { key: "productCount", header: copy.tableProductCount },
            { key: "actions", header: copy.tableActions },
          ]}
          isLoading={query.isFetching && categoriesPayload.items.length === 0}
          isEmpty={!query.isFetching && categoriesPayload.items.length === 0}
          loadingState={copy.loading}
          emptyState={copy.emptyList}
          className="rounded-2xl"
          pagination={
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() =>
                  setCategoriesPage(Math.max(1, categoriesPagination.page - 1))
                }
                disabled={categoriesPagination.page <= 1}
                className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {locale === "vi" ? "Trước" : "Prev"}
              </button>
              <span>
                {locale === "vi" ? "Trang" : "Page"} {categoriesPagination.page}/
                {categoriesPagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCategoriesPage(
                    Math.min(categoriesPagination.totalPages, categoriesPagination.page + 1)
                  )
                }
                disabled={categoriesPagination.page >= categoriesPagination.totalPages}
                className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {locale === "vi" ? "Sau" : "Next"}
              </button>
            </div>
          }
        >
          {tableRows}
        </DataTableShell>
      </section>

      <DrawerFormShell
        open={isEditModalOpen}
        title={copy.editTitle}
        description={copy.editDescription}
        onOpenChange={(open) => {
          if (!open) setEditingCategoryId(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingCategoryId(null)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
            >
              {cancelActionLabel}
            </button>
            <button
              type="button"
              disabled={Boolean(editingCategory?.isSystem) || updateMutation.isPending}
              onClick={async () => {
                if (!editingCategoryId) return;
                const isSuccess = await onUpdateCategory(editingCategoryId);
                if (isSuccess) {
                  setEditingCategoryId(null);
                }
              }}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
            >
              {copy.saveAction}
            </button>
          </div>
        }
      >
        {editingCategory && editingDraft ? (
          <div className="space-y-4">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.codeLabel}</span>
              <input
                type="text"
                value={editingDraft.code}
                disabled={editingCategory.isSystem}
                onChange={(event) =>
                  setRowDraft(editingCategory.id, {
                    code: event.target.value,
                  })
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-70"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.nameLabel}</span>
              <input
                type="text"
                value={editingDraft.name}
                disabled={editingCategory.isSystem}
                onChange={(event) =>
                  setRowDraft(editingCategory.id, {
                    name: event.target.value,
                  })
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-70"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.sortOrderLabel}</span>
              <input
                type="number"
                min={0}
                step={1}
                value={editingDraft.sortOrder}
                disabled={editingCategory.isSystem}
                onChange={(event) =>
                  setRowDraft(editingCategory.id, {
                    sortOrder: event.target.value,
                  })
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-70"
              />
            </label>

            <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={editingDraft.isActive}
                disabled={editingCategory.isSystem}
                onChange={(event) =>
                  setRowDraft(editingCategory.id, {
                    isActive: event.target.checked,
                  })
                }
              />
              <span>{copy.activeLabel}</span>
            </label>

            <p className="text-xs text-muted-foreground">
              {copy.productCountLabel}: {editingCategory.productCount}
            </p>
            {editingCategory.productCount > 0 ? (
              <p className="text-xs text-muted-foreground">{copy.inUseHint}</p>
            ) : null}
          </div>
        ) : null}
      </DrawerFormShell>

      <ProductCategoryAssignmentDrawer
        locale={locale}
        open={Boolean(assigningCategory)}
        onOpenChange={(open) => {
          if (!open) setAssigningCategoryId(null);
        }}
        branchId={branchId ?? categoriesPayload.branchId}
        categoryId={assigningCategory?.id ?? null}
        categoryName={assigningCategory?.name ?? ""}
        onAssigned={async () => {
          await query.refetch();
        }}
      />
    </section>
  );
});
