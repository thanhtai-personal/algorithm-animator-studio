"use client";

import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { useMakeupInventoryPage } from "@/features/makeup/hooks/useMakeupInventoryPage";

interface MakeupInventoryPageProps {
  locale: AppLocale;
}

export const MakeupInventoryPage = observer(function MakeupInventoryPage({
  locale,
}: MakeupInventoryPageProps) {
  const model = useMakeupInventoryPage(locale);
  if (!model.canManage) return null;

  if (!model.inventoryQuery.data && model.inventoryQuery.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{model.copy.loading}</p>
      </section>
    );
  }

  if (!model.inventoryQuery.data && model.inventoryQuery.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/10 p-6 shadow-md">
        <p className="text-sm text-destructive">{model.copy.loadError}</p>
        <button
          type="button"
          onClick={() => void model.inventoryQuery.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {model.copy.retryAction}
        </button>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <h1 className="text-2xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Tên món hàng" : "Item name"}</span>
            <input
              type="text"
              value={model.name}
              onChange={(event) => model.setName(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Nhóm hàng" : "Category"}</span>
            <input
              type="text"
              value={model.category}
              onChange={(event) => model.setCategory(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Link Shopee" : "Shopee URL"}</span>
            <input
              type="url"
              value={model.shopeeUrl}
              onChange={(event) => model.setShopeeUrl(event.target.value)}
              placeholder="https://shopee.vn/..."
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Gói makeup" : "Package"}</span>
            <select
              value={model.packageId}
              onChange={(event) => model.setPackageId(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">-</option>
              {model.packageOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.code} - {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Chuyên viên" : "Artist"}</span>
            <select
              value={model.artistProfileId}
              onChange={(event) => model.setArtistProfileId(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">-</option>
              {model.artistOptions.map((entry) => (
                <option key={entry.profileId} value={entry.profileId}>
                  {entry.fullName ?? entry.profileId}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Trạng thái" : "Status"}</span>
            <select
              value={model.isActive ? "active" : "inactive"}
              onChange={(event) => model.setIsActive(event.target.value === "active")}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="active">{locale === "vi" ? "Đang dùng" : "Active"}</option>
              <option value="inactive">{locale === "vi" ? "Đã ẩn" : "Inactive"}</option>
            </select>
          </label>
        </div>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{locale === "vi" ? "Ghi chú" : "Note"}</span>
          <textarea
            value={model.note}
            onChange={(event) => model.setNote(event.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        <div className="flex flex-wrap justify-end gap-2">
          {model.editingItemId ? (
            <button
              type="button"
              onClick={model.onCancelEdit}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground"
            >
              {model.copy.cancelEditAction}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void model.onSubmit()}
            disabled={model.createMutation.isPending || model.updateMutation.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {model.editingItemId ? model.copy.updateAction : model.copy.saveAction}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Tìm kiếm" : "Search"}</span>
            <input
              type="search"
              value={model.search}
              onChange={(event) => model.setSearch(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Lọc theo gói" : "Package filter"}</span>
            <select
              value={model.packageFilter}
              onChange={(event) => model.setPackageFilter(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{locale === "vi" ? "Tất cả" : "All"}</option>
              {model.packageOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.code} - {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Lọc theo chuyên viên" : "Artist filter"}</span>
            <select
              value={model.artistFilter}
              onChange={(event) => model.setArtistFilter(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{locale === "vi" ? "Tất cả" : "All"}</option>
              {model.artistOptions.map((entry) => (
                <option key={entry.profileId} value={entry.profileId}>
                  {entry.fullName ?? entry.profileId}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Lọc trạng thái" : "Status filter"}</span>
            <select
              value={model.statusFilter}
              onChange={(event) =>
                model.setStatusFilter(event.target.value as "all" | "active" | "inactive")
              }
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">{locale === "vi" ? "Tất cả" : "All"}</option>
              <option value="active">{locale === "vi" ? "Đang dùng" : "Active"}</option>
              <option value="inactive">{locale === "vi" ? "Đã ẩn" : "Inactive"}</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          {model.items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-muted/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.packageCode ?? "-") + " - " + (item.packageName ?? "-")} |{" "}
                    {item.artistName ?? item.artistProfileId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.category ?? "-"} | {item.isActive ? "Active" : "Inactive"}
                  </p>
                  {item.shopeeUrl ? (
                    <a
                      href={item.shopeeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      {item.shopeeUrl}
                    </a>
                  ) : null}
                  {item.note ? <p className="text-xs text-muted-foreground">{item.note}</p> : null}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => model.onEdit(item)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    {model.copy.editAction}
                  </button>
                  <button
                    type="button"
                    onClick={() => void model.onToggleActive(item)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    {item.isActive ? model.copy.deactivateAction : model.copy.activateAction}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
});
