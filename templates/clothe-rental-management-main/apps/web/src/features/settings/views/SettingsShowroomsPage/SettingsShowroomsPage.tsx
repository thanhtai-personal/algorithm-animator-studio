"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { SettingsAccessDenied } from "@/features/settings/components/SettingsAccessDenied";
import { SettingsShowroomPagesPage } from "@/features/settings/components/SettingsShowroomPagesPage";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";
import { useSettingsShowroomsPage } from "@/features/settings/hooks/useSettingsShowroomsPage";

interface SettingsShowroomsPageProps {
  locale: AppLocale;
}

export const SettingsShowroomsPage = observer(function SettingsShowroomsPage({
  locale,
}: SettingsShowroomsPageProps) {
  const {
    copy,
    canManageSettings,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
    showroomsPayload,
    createName,
    setCreateName,
    createSlug,
    setCreateSlug,
    createBranchId,
    setCreateBranchId,
    createIsActive,
    setCreateIsActive,
    rowDraftById,
    setRowDraft,
    onCreateShowroom,
    onUpdateShowroom,
    onDeleteShowroom,
    actionError,
    actionSuccess,
  } = useSettingsShowroomsPage(locale);
  const [expandedShowroomId, setExpandedShowroomId] = useState<string | null>(null);

  if (!canManageSettings) {
    return <SettingsAccessDenied locale={locale} message={copy.noPermission} />;
  }

  if (!showroomsPayload && query.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      </section>
    );
  }

  if (!showroomsPayload && query.isError) {
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

  if (!showroomsPayload) {
    return null;
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <SettingsTabs locale={locale} activeTab="showrooms" />
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

      <section className="space-y-3 rounded-3xl border border-primary/25 bg-primary/5 p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{copy.createTitle}</h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <span>{copy.slugLabel}</span>
            <input
              type="text"
              value={createSlug}
              onChange={(event) => setCreateSlug(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.branchLabel}</span>
            <select
              value={createBranchId}
              onChange={(event) => setCreateBranchId(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              {showroomsPayload.branches.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.code} - {entry.name}
                </option>
              ))}
            </select>
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
            onClick={() => void onCreateShowroom()}
            disabled={createMutation.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {copy.createAction}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{copy.listTitle}</h2>

        <div className="space-y-3">
          {showroomsPayload.items.map((row) => {
            const draft = rowDraftById[row.id];
            if (!draft) return null;
            const isShowroomPageExpanded = expandedShowroomId === row.id;

            return (
              <article key={row.id} className="rounded-2xl border border-border bg-muted/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {row.name}
                      {row.isDefault ? " (Default)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.slug} - {row.branchCode} / {row.branchName}
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      disabled={row.isDefault}
                      onChange={(event) =>
                        setRowDraft(row.id, {
                          isActive: event.target.checked,
                        })
                      }
                    />
                    <span>{copy.activeLabel}</span>
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.nameLabel}</span>
                    <input
                      type="text"
                      value={draft.name}
                      disabled={row.isDefault}
                      onChange={(event) =>
                        setRowDraft(row.id, {
                          name: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-70"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.slugLabel}</span>
                    <input
                      type="text"
                      value={draft.slug}
                      disabled={row.isDefault}
                      onChange={(event) =>
                        setRowDraft(row.id, {
                          slug: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-70"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.branchLabel}</span>
                    <select
                      value={draft.branchId}
                      disabled={row.isDefault}
                      onChange={(event) =>
                        setRowDraft(row.id, {
                          branchId: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-70"
                    >
                      {showroomsPayload.branches.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.code} - {entry.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {row.isDefault ? (
                  <p className="mt-3 text-xs text-muted-foreground">{copy.defaultLockedHint}</p>
                ) : null}

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedShowroomId((previous) =>
                        previous === row.id ? null : row.id
                      )
                    }
                    className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    {isShowroomPageExpanded
                      ? copy.closeShowroomPageAction
                      : copy.openShowroomPageAction}
                  </button>

                  {!row.isDefault ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(copy.confirmDelete)) return;
                        void onDeleteShowroom(row.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-60"
                    >
                      {copy.deleteAction}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void onUpdateShowroom(row.id)}
                    disabled={updateMutation.isPending || row.isDefault}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
                  >
                    {copy.saveAction}
                  </button>
                </div>

                {isShowroomPageExpanded ? (
                  <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-3 md:p-4">
                    <SettingsShowroomPagesPage
                      locale={locale}
                      embedded
                      fixedBranchId={row.branchId}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
});
