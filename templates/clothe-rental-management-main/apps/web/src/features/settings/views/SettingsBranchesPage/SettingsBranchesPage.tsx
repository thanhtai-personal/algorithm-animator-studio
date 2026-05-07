"use client";

import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { SettingsAccessDenied } from "@/features/settings/components/SettingsAccessDenied";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";
import { useSettingsBranchesPage } from "@/features/settings/hooks/useSettingsBranchesPage";

interface SettingsBranchesPageProps {
  locale: AppLocale;
}

export const SettingsBranchesPage = observer(function SettingsBranchesPage({
  locale,
}: SettingsBranchesPageProps) {
  const {
    copy,
    canManageSettings,
    isGlobalSettingsAdmin,
    isManager,
    query,
    createMutation,
    updateMutation,
    branchesPayload,
    createCode,
    setCreateCode,
    createName,
    setCreateName,
    createShopDomain,
    setCreateShopDomain,
    createAddress,
    setCreateAddress,
    createPhone,
    setCreatePhone,
    createTimezone,
    setCreateTimezone,
    createCurrencyCode,
    setCreateCurrencyCode,
    rowDraftById,
    setRowDraft,
    onCreateBranch,
    onUpdateBranch,
    actionError,
    actionSuccess,
  } = useSettingsBranchesPage(locale);

  if (!canManageSettings) {
    return <SettingsAccessDenied locale={locale} message={copy.noPermission} />;
  }

  if (!branchesPayload && query.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      </section>
    );
  }

  if (!branchesPayload && query.isError) {
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

  if (!branchesPayload) {
    return null;
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          {isManager ? (
            <p className="mt-1 text-xs text-muted-foreground">{copy.managerScopeHint}</p>
          ) : null}
        </div>
        <SettingsTabs locale={locale} activeTab="branches" />
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

      {isGlobalSettingsAdmin ? (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold text-foreground">{copy.createTitle}</h2>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              <span>{copy.shopDomainLabel}</span>
              <input
                type="text"
                value={createShopDomain}
                onChange={(event) => setCreateShopDomain(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
              <p>{copy.shopDomainHint}</p>
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.addressLabel}</span>
              <input
                type="text"
                value={createAddress}
                onChange={(event) => setCreateAddress(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.phoneLabel}</span>
              <input
                type="tel"
                value={createPhone}
                onChange={(event) => setCreatePhone(event.target.value)}
                placeholder="0393545364 / +84393545364"
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.timezoneLabel}</span>
              <input
                type="text"
                value={createTimezone}
                onChange={(event) => setCreateTimezone(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.currencyLabel}</span>
              <select
                value={createCurrencyCode}
                onChange={(event) => setCreateCurrencyCode(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="VND">VND</option>
              </select>
              <p>{copy.currencyHint}</p>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void onCreateBranch()}
              disabled={createMutation.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
            >
              {copy.createAction}
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{copy.listTitle}</h2>

        <div className="space-y-3">
          {branchesPayload.items.map((branch) => {
            const draft = rowDraftById[branch.id];
            if (!draft) return null;

            return (
              <article key={branch.id} className="rounded-2xl border border-border bg-muted/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {branch.code} - {branch.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{branch.id}</p>
                  </div>
                  {isGlobalSettingsAdmin ? (
                    <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(event) =>
                          setRowDraft(branch.id, {
                            isActive: event.target.checked,
                          })
                        }
                      />
                      <span>{copy.activeLabel}</span>
                    </label>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.shopDomainLabel}</span>
                    <input
                      type="text"
                      value={draft.shopDomain}
                      onChange={(event) =>
                        setRowDraft(branch.id, {
                          shopDomain: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    />
                    <p>{copy.shopDomainHint}</p>
                  </label>

                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.nameLabel}</span>
                    <input
                      type="text"
                      value={draft.name}
                      disabled={!isGlobalSettingsAdmin}
                      onChange={(event) =>
                        setRowDraft(branch.id, {
                          name: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.addressLabel}</span>
                    <input
                      type="text"
                      value={draft.address}
                      disabled={!isGlobalSettingsAdmin}
                      onChange={(event) =>
                        setRowDraft(branch.id, {
                          address: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.phoneLabel}</span>
                    <input
                      type="tel"
                      value={draft.phone}
                      disabled={!isGlobalSettingsAdmin}
                      placeholder="0393545364 / +84393545364"
                      onChange={(event) =>
                        setRowDraft(branch.id, {
                          phone: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.timezoneLabel}</span>
                    <input
                      type="text"
                      value={draft.timezone}
                      disabled={!isGlobalSettingsAdmin}
                      onChange={(event) =>
                        setRowDraft(branch.id, {
                          timezone: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>{copy.currencyLabel}</span>
                    <select
                      value={draft.currencyCode}
                      disabled={!isGlobalSettingsAdmin}
                      onChange={(event) =>
                        setRowDraft(branch.id, {
                          currencyCode: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    >
                      <option value="VND">VND</option>
                    </select>
                    <p>{copy.currencyHint}</p>
                  </label>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void onUpdateBranch(branch.id)}
                    disabled={updateMutation.isPending}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
                  >
                    {copy.saveAction}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
});
