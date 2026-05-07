"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { useCustomersListPage } from "@/features/customers/hooks/useCustomersListPage";
import { formatDateLabel } from "@/utils/format/date";
import { formatMoney } from "@/utils/format/money";

interface CustomersListPageProps {
  locale: AppLocale;
}

function resolveTagIntent(tagName: string): "vip" | "blacklist" | null {
  const normalized = tagName.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("vip")) return "vip";
  if (
    normalized.includes("blacklist") ||
    normalized.includes("black list") ||
    normalized.includes("black-listed") ||
    normalized.includes("den") ||
    normalized.includes("đen") ||
    normalized.includes("cam")
  ) {
    return "blacklist";
  }

  return null;
}

export const CustomersListPage = observer(function CustomersListPage({
  locale,
}: CustomersListPageProps) {
  const {
    copy,
    searchInput,
    setSearchInput,
    tagId,
    setTagId,
    page,
    setPage,
    totalPages,
    listQuery,
    listItems,
    tags,
    createOpen,
    setCreateOpen,
    createDraft,
    setCreateDraft,
    createMutation,
    handleCreateCustomer,
    toggleCreateTag,
    phoneValidation,
    phoneTypeaheadQuery,
    duplicateCandidates,
    handleQuickNote,
    updateAnyMutation,
  } = useCustomersListPage(locale);

  const [actionError, setActionError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const { prompt } = useAppModal();

  const tableRows = useMemo(
    () =>
      listItems.map((item) => {
        const vipTag = item.tags.find((tag) => resolveTagIntent(tag.name) === "vip");
        const blacklistTag = item.tags.find((tag) => resolveTagIntent(tag.name) === "blacklist");

        return (
          <tr
            key={item.id}
            className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
          >
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">{item.fullName}</p>
                {vipTag ? (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {vipTag.name}
                  </span>
                ) : null}
                {blacklistTag ? (
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                    {blacklistTag.name}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.phone ?? "-"}</p>
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{item.totalOrders}</td>
            <td className="px-4 py-3 text-xs font-medium text-foreground">
              {formatMoney(item.totalSpent, { locale, currency: "VND" }) || "-"}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              {item.lastOrderDate ? formatDateLabel(item.lastOrderDate, { locale }) : "-"}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {item.tags.length > 0 ? (
                  item.tags.map((tag) => {
                    const intent = resolveTagIntent(tag.name);

                    return (
                      <span
                        key={tag.id}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          intent === "vip"
                            ? "bg-primary/15 text-primary"
                            : intent === "blacklist"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {tag.name}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/${locale}/customers/${item.id}`}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {copy.viewDetail}
                </Link>
                <Link
                  href={`/${locale}/customers/${item.id}`}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {copy.editAction}
                </Link>
                <button
                  type="button"
                  disabled={updateAnyMutation.isPending}
                  onClick={async () => {
                    const quickNote = await prompt({
                      title: copy.quickNotePrompt,
                      defaultValue: item.note ?? "",
                    });
                    if (quickNote === null) return;

                    try {
                      setActionError(null);
                      await handleQuickNote(item.id, quickNote);
                      toast.success(
                        locale === "vi" ? "Đã cập nhật ghi chú khách hàng." : "Customer note updated."
                      );
                    } catch (error) {
                      const message = error instanceof Error ? error.message : copy.quickNoteFailed;
                      setActionError(message);
                      toast.error(message);
                    }
                  }}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
                >
                  {copy.addNoteAction}
                </button>
              </div>
            </td>
          </tr>
        );
      }),
    [
      copy.addNoteAction,
      copy.editAction,
      copy.quickNotePrompt,
      copy.quickNoteFailed,
      copy.viewDetail,
      handleQuickNote,
      listItems,
      locale,
      prompt,
      updateAnyMutation.isPending,
    ]
  );

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            {copy.createAction}
          </button>
        </div>
      </header>

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
          <span>{copy.tagFilterLabel}</span>
          <select
            value={tagId}
            onChange={(event) => setTagId(event.target.value)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="">{copy.allTags}</option>
            {tags.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      </FilterBarShell>

      <DataTableShell
        locale={locale}
        title={copy.title}
        subtitle={copy.subtitle}
        isLoading={listQuery.isFetching && listItems.length === 0}
        isEmpty={!listQuery.isFetching && listItems.length === 0}
        loadingState={copy.loading}
        emptyState={copy.empty}
        className="rounded-3xl shadow-md"
        columns={[
          { key: "customer", header: copy.tableHeaders.customer },
          { key: "totalOrders", header: copy.tableHeaders.totalOrders },
          { key: "totalSpent", header: copy.tableHeaders.totalSpent },
          { key: "lastOrderDate", header: copy.tableHeaders.lastOrderDate },
          { key: "tags", header: copy.tableHeaders.tags },
          { key: "actions", header: copy.tableHeaders.actions },
        ]}
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
        {tableRows}
      </DataTableShell>

      {actionError ? <p className="text-xs text-destructive">{actionError}</p> : null}

      <DrawerFormShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={copy.createPanelTitle}
        description={copy.createPanelDescription}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setCreateError(null);
              }}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
            >
              {copy.createCancel}
            </button>
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={async () => {
                try {
                  setCreateError(null);
                  await handleCreateCustomer();
                  toast.success(
                    locale === "vi" ? "Đã thêm khách hàng thành công." : "Customer created successfully."
                  );
                } catch (error) {
                  const message = error instanceof Error ? error.message : copy.createFailed;
                  setCreateError(message);
                  toast.error(message);
                }
              }}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {copy.createSubmit}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <VoiceDictationField
            locale={locale}
            label={copy.createFields.fullName}
            fieldType="input"
            value={createDraft.fullName}
            onValueChange={(value) =>
              setCreateDraft((previous) => ({
                ...previous,
                fullName: value,
              }))
            }
            language={locale === "vi" ? "vi-VN" : "en-US"}
          />

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.createFields.phone}
            </span>
            <input
              type="tel"
              value={createDraft.phone}
              onChange={(event) =>
                setCreateDraft((previous) => ({
                  ...previous,
                  phone: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          </label>

          {createDraft.phone ? (
            <p
              className={`text-xs ${phoneValidation.isValid ? "text-success" : "text-destructive"}`}
            >
              {phoneValidation.isValid
                ? createDraft.phone.trim()
                : copy.phoneInvalid}
            </p>
          ) : null}

          {duplicateCandidates.length > 0 ? (
            <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
              <p className="font-semibold">{copy.duplicateHintTitle}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {duplicateCandidates.map((candidate) => (
                  <Link
                    key={candidate.id}
                    href={`/${locale}/customers/${candidate.id}`}
                    className="rounded border border-border px-2 py-1 text-xs text-muted-foreground"
                  >
                    {candidate.fullName} · {candidate.phone ?? "-"}
                  </Link>
                ))}
                {phoneTypeaheadQuery.isFetching ? (
                  <span className="text-muted-foreground">
                    {locale === "vi" ? "Đang kiểm tra..." : "Checking..."}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.createFields.socialLink}
            </span>
            <input
              type="text"
              value={createDraft.socialLink}
              onChange={(event) =>
                setCreateDraft((previous) => ({
                  ...previous,
                  socialLink: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          </label>

          <VoiceDictationField
            locale={locale}
            label={copy.createFields.address}
            value={createDraft.address}
            onValueChange={(value) =>
              setCreateDraft((previous) => ({
                ...previous,
                address: value,
              }))
            }
            rows={3}
            language={locale === "vi" ? "vi-VN" : "en-US"}
          />

          <VoiceDictationField
            locale={locale}
            label={copy.createFields.note}
            value={createDraft.note}
            onValueChange={(value) =>
              setCreateDraft((previous) => ({
                ...previous,
                note: value,
              }))
            }
            rows={4}
            language={locale === "vi" ? "vi-VN" : "en-US"}
          />

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.createFields.tags}
            </legend>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-xs text-muted-foreground">-</span>
              ) : (
                tags.map((tag) => {
                  const active = createDraft.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleCreateTag(tag.id)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </fieldset>

          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={createDraft.isActive}
              onChange={(event) =>
                setCreateDraft((previous) => ({
                  ...previous,
                  isActive: event.target.checked,
                }))
              }
            />
            {copy.createFields.active}
          </label>

          {createError ? <p className="text-xs text-destructive">{createError}</p> : null}
        </div>
      </DrawerFormShell>
    </section>
  );
});
