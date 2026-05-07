"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import type { ShowroomRole } from "@/types/showroomAuth";
import { SettingsAccessDenied } from "@/features/settings/components/SettingsAccessDenied";
import { useSettingsUsersPage } from "@/features/settings/hooks/useSettingsUsersPage";
import { PasswordVisibilityButton } from "./PasswordVisibilityButton";
import { SettingsUsersBranchFilter } from "./SettingsUsersBranchFilter";
import { SettingsUsersPageHeader } from "./SettingsUsersPageHeader";
import { SettingsUsersPaginationControls } from "./SettingsUsersPaginationControls";
import { SettingsUsersErrorState, SettingsUsersLoadingState } from "./SettingsUsersPageStates";
import { SettingsUsersStatusMessage } from "./SettingsUsersStatusMessage";
import type { SettingsUsersPageProps } from "./types";

export const SettingsUsersPage = observer(function SettingsUsersPage({
  locale,
}: SettingsUsersPageProps) {
  const {
    copy,
    canManageSettings,
    query,
    createMutation,
    updateMutation,
    usersPayload,
    pagedUsers,
    usersTotalCount,
    usersTotalPages,
    usersCurrentPage,
    usersRangeStart,
    usersRangeEnd,
    usersPageSize,
    usersPageSizeOptions,
    canGoPrevUsersPage,
    canGoNextUsersPage,
    goToPrevUsersPage,
    goToNextUsersPage,
    changeUsersPageSize,
    branchFilter,
    setBranchFilter,
    branchOptions,
    createEmail,
    setCreateEmail,
    createPassword,
    setCreatePassword,
    createFullName,
    setCreateFullName,
    createPhone,
    setCreatePhone,
    createRole,
    setCreateRole,
    createLocale,
    setCreateLocale,
    createDefaultBranchId,
    setCreateDefaultBranchId,
    createBranchIds,
    setCreateBranchIds,
    resetPasswordDraftByUserId,
    setResetPasswordDraft,
    rowDraftById,
    setRowDraft,
    onCreateUser,
    onUpdateUser,
    toggleArrayValue,
    parseBranchIdsText,
    roleOptions,
    actionError,
    actionSuccess,
  } = useSettingsUsersPage(locale);
  const [expandedUserById, setExpandedUserById] = useState<Record<string, boolean>>({});
  const [isCreatePasswordVisible, setCreatePasswordVisible] = useState(false);
  const [resetPasswordVisibleByUserId, setResetPasswordVisibleByUserId] = useState<
    Record<string, boolean>
  >({});

  const toggleResetPasswordVisible = (userId: string) => {
    setResetPasswordVisibleByUserId((previous) => ({
      ...previous,
      [userId]: !previous[userId],
    }));
  };

  if (!canManageSettings) {
    return <SettingsAccessDenied locale={locale} message={copy.noPermission} />;
  }

  if (!usersPayload && query.isLoading) {
    return <SettingsUsersLoadingState label={copy.loading} />;
  }

  if (!usersPayload && query.isError) {
    return (
      <SettingsUsersErrorState
        label={copy.loadError}
        retryLabel={copy.retryAction}
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (!usersPayload) {
    return null;
  }

  return (
    <section className="animate-fade-in space-y-5">
      <SettingsUsersPageHeader locale={locale} title={copy.title} subtitle={copy.subtitle} />
      <SettingsUsersStatusMessage message={actionError} tone="error" />
      <SettingsUsersStatusMessage message={actionSuccess} tone="success" />

      <SettingsUsersBranchFilter
        label={copy.branchFilterLabel}
        allBranchesLabel={copy.allBranchesOption}
        value={branchFilter}
        options={branchOptions}
        onChange={setBranchFilter}
      />

      <section className="space-y-3 rounded-3xl border border-primary/25 bg-primary/5 p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{copy.createTitle}</h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.emailLabel}</span>
            <input
              type="email"
              value={createEmail}
              onChange={(event) => setCreateEmail(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.passwordLabel}</span>
            <div className="relative">
              <input
                type={isCreatePasswordVisible ? "text" : "password"}
                value={createPassword}
                onChange={(event) => setCreatePassword(event.target.value)}
                placeholder={copy.createPasswordPlaceholder}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 pr-10 text-sm text-foreground"
              />
              <PasswordVisibilityButton
                visible={isCreatePasswordVisible}
                onToggle={() => setCreatePasswordVisible((previous) => !previous)}
              />
            </div>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.fullNameLabel}</span>
            <input
              type="text"
              value={createFullName}
              onChange={(event) => setCreateFullName(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.phoneLabel}</span>
            <input
              type="text"
              value={createPhone}
              onChange={(event) => setCreatePhone(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.roleLabel}</span>
            <select
              value={createRole}
              onChange={(event) =>
                setCreateRole(event.target.value as ShowroomRole)
              }
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.localeLabel}</span>
            <select
              value={createLocale}
              onChange={(event) => setCreateLocale(event.target.value as "vi" | "en")}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="vi">vi</option>
              <option value="en">en</option>
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.defaultBranchLabel}</span>
            <select
              value={createDefaultBranchId}
              onChange={(event) => setCreateDefaultBranchId(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{copy.noneOption}</option>
              {branchOptions.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.branchAccessLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {branchOptions.map((entry) => (
              <label
                key={entry.value}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground"
              >
                <input
                  type="checkbox"
                  checked={createBranchIds.includes(entry.value)}
                  onChange={() => setCreateBranchIds(toggleArrayValue(createBranchIds, entry.value))}
                />
                <span>{entry.label}</span>
              </label>
            ))}
          </div>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.branchIdsFieldLabel}</span>
            <input
              type="text"
              value={createBranchIds.join(", ")}
              onChange={(event) => setCreateBranchIds(parseBranchIdsText(event.target.value))}
              placeholder={copy.branchIdsFieldPlaceholder}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void onCreateUser()}
            disabled={createMutation.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {copy.createAction}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{copy.listTitle}</h2>
          <p className="text-xs text-muted-foreground">
            {copy.paginationShowingLabel} {usersRangeStart}-{usersRangeEnd}/{usersTotalCount}
          </p>
        </div>

        <SettingsUsersPaginationControls
          perPageLabel={copy.paginationPerPageLabel}
          pageLabel={copy.paginationPageLabel}
          prevLabel={copy.paginationPrevAction}
          nextLabel={copy.paginationNextAction}
          pageSize={usersPageSize}
          pageSizeOptions={usersPageSizeOptions}
          currentPage={usersCurrentPage}
          totalPages={usersTotalPages}
          canGoPrev={canGoPrevUsersPage}
          canGoNext={canGoNextUsersPage}
          onChangePageSize={changeUsersPageSize}
          onPrev={goToPrevUsersPage}
          onNext={goToNextUsersPage}
        />

        <div className="space-y-3">
          {pagedUsers.map((user) => {
            const draft = rowDraftById[user.profileId];
            if (!draft) return null;
            const isExpanded = Boolean(expandedUserById[user.profileId]);
            const detailPanelId = `settings-user-detail-${user.profileId}`;
            const isOwnerAdminUser = user.role === "owner_admin";
            const editableRoleOptions = isOwnerAdminUser
              ? (["owner_admin", ...roleOptions] as ShowroomRole[])
              : roleOptions;
            const isResetPasswordVisible = Boolean(resetPasswordVisibleByUserId[user.profileId]);

            return (
              <article key={user.profileId} className="rounded-2xl border border-border bg-muted/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{user.email ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {copy.roleLabel}: <span className="font-semibold text-foreground">{draft.role}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedUserById((previous) => ({
                        ...previous,
                        [user.profileId]: !previous[user.profileId],
                      }))
                    }
                    aria-expanded={isExpanded}
                    aria-controls={detailPanelId}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent"
                  >
                    {isExpanded ? copy.collapseAction : copy.expandAction}
                  </button>
                </div>

                {isExpanded ? (
                  <div id={detailPanelId} className="mt-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{user.fullName ?? "-"}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{user.profileId}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span>{copy.fullNameLabel}</span>
                        <input
                          type="text"
                          value={draft.fullName}
                          onChange={(event) =>
                            setRowDraft(user.profileId, {
                              fullName: event.target.value,
                            })
                          }
                          className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                        />
                      </label>

                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span>{copy.roleLabel}</span>
                        <select
                          value={draft.role}
                          onChange={(event) =>
                            setRowDraft(user.profileId, {
                              role: event.target.value as ShowroomRole,
                            })
                          }
                          disabled={isOwnerAdminUser}
                          className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                        >
                          {editableRoleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        {isOwnerAdminUser ? (
                          <p className="text-[11px] text-muted-foreground">{copy.ownerAdminRoleLocked}</p>
                        ) : null}
                      </label>

                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span>{copy.localeLabel}</span>
                        <select
                          value={draft.locale}
                          onChange={(event) =>
                            setRowDraft(user.profileId, {
                              locale: event.target.value as "vi" | "en",
                            })
                          }
                          className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                        >
                          <option value="vi">vi</option>
                          <option value="en">en</option>
                        </select>
                      </label>

                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span>{copy.defaultBranchLabel}</span>
                        <select
                          value={draft.defaultBranchId ?? ""}
                          onChange={(event) =>
                            setRowDraft(user.profileId, {
                              defaultBranchId: event.target.value || null,
                            })
                          }
                          className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                        >
                          <option value="">{copy.noneOption}</option>
                          {branchOptions.map((entry) => (
                            <option key={entry.value} value={entry.value}>
                              {entry.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="inline-flex items-center gap-2 self-end rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(event) =>
                            setRowDraft(user.profileId, {
                              isActive: event.target.checked,
                            })
                          }
                        />
                        <span>{copy.activeLabel}</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {copy.branchAccessLabel}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {branchOptions.map((entry) => (
                          <label
                            key={entry.value}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
                          >
                            <input
                              type="checkbox"
                              checked={draft.branchIds.includes(entry.value)}
                              onChange={() =>
                                setRowDraft(user.profileId, {
                                  branchIds: toggleArrayValue(draft.branchIds, entry.value),
                                })
                              }
                            />
                            <span>{entry.label}</span>
                          </label>
                        ))}
                      </div>

                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span>{copy.branchIdsFieldLabel}</span>
                        <input
                          type="text"
                          value={draft.branchIds.join(", ")}
                          onChange={(event) =>
                            setRowDraft(user.profileId, {
                              branchIds: parseBranchIdsText(event.target.value),
                            })
                          }
                          placeholder={copy.branchIdsFieldPlaceholder}
                          className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span>{copy.resetPasswordInputLabel}</span>
                        <div className="relative">
                          <input
                            type={isResetPasswordVisible ? "text" : "password"}
                            value={resetPasswordDraftByUserId[user.profileId] ?? ""}
                            onChange={(event) => setResetPasswordDraft(user.profileId, event.target.value)}
                            placeholder={copy.resetPasswordInputPlaceholder}
                            className="h-9 w-full rounded-xl border border-border bg-background px-3 pr-10 text-sm text-foreground"
                          />
                          <PasswordVisibilityButton
                            visible={isResetPasswordVisible}
                            onToggle={() => toggleResetPasswordVisible(user.profileId)}
                          />
                        </div>
                      </label>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void onUpdateUser(user.profileId)}
                        disabled={updateMutation.isPending}
                        className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
                      >
                        {copy.saveAction}
                      </button>
                    </div>
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
