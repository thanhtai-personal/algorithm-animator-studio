"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import type { ShowroomRole } from "@/types/showroomAuth";
import type { SettingLocale, SettingsUpdateUserPayload } from "@/types/settingsModule";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateSettingsUserMutation,
  useResetSettingsUserPasswordMutation,
  useSettingsUsersQuery,
  useUpdateSettingsUserMutation,
} from "@/features/settings/queries/useSettingsQueries";
import { settingsStore } from "@/features/settings/stores/settingsStore";
import { ROLE_OPTIONS, USERS_PAGE_SIZE_OPTIONS } from "./constants";
import { USERS_COPY } from "./copy";
import type { UserRowDraft } from "./types";
import {
  areBranchIdsEqual,
  parseBranchIdsText,
  resolveSettingsUsersActionErrorMessage,
  toggleArrayValue,
} from "./utils";

export function useSettingsUsersPage(locale: AppLocale) {
  const copy = USERS_COPY[locale];
  const { can } = useAuthAccess();
  const canManageSettings = can("users.manage");

  const [branchFilter, setBranchFilter] = useState<string>("");

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createRole, setCreateRole] = useState<ShowroomRole>("staff");
  const [createLocale, setCreateLocale] = useState<SettingLocale>("vi");
  const [createDefaultBranchId, setCreateDefaultBranchId] = useState<string>("");
  const [createBranchIds, setCreateBranchIds] = useState<string[]>([]);
  const [resetPasswordDraftByUserId, setResetPasswordDraftByUserId] = useState<Record<string, string>>({});
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(USERS_PAGE_SIZE_OPTIONS[1] ?? 10);

  const [rowDraftById, setRowDraftById] = useState<Record<string, UserRowDraft>>({});

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const query = useSettingsUsersQuery(branchFilter || null, canManageSettings);
  const createMutation = useCreateSettingsUserMutation();
  const updateMutation = useUpdateSettingsUserMutation();
  const resetMutation = useResetSettingsUserPasswordMutation();

  const usersPayload = settingsStore.users;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!usersPayload) return;

    if (!createDefaultBranchId && usersPayload.branches.length > 0) {
      setCreateDefaultBranchId(usersPayload.branches[0]?.id ?? "");
      setCreateBranchIds([usersPayload.branches[0]?.id ?? ""]);
    }

    const nextDraftById: Record<string, UserRowDraft> = {};
    for (const user of usersPayload.items) {
      nextDraftById[user.profileId] = {
        fullName: user.fullName ?? "",
        role: user.role,
        locale: user.locale,
        isActive: user.isActive,
        defaultBranchId: user.defaultBranchId,
        branchIds: user.branchIds,
      };
    }
    setRowDraftById(nextDraftById);
  }, [query.data, usersPayload, createDefaultBranchId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const branchOptions = useMemo(
    () =>
      (usersPayload?.branches ?? []).map((entry) => ({
        value: entry.id,
        label: `${entry.code} - ${entry.name}`,
      })),
    [usersPayload?.branches]
  );
  const usersTotalCount = usersPayload?.items.length ?? 0;
  const usersTotalPages = Math.max(1, Math.ceil(usersTotalCount / usersPageSize));
  const usersCurrentPage = Math.min(usersPage, usersTotalPages);
  const usersPageStartIndex = (usersCurrentPage - 1) * usersPageSize;
  const usersRangeStart = usersTotalCount === 0 ? 0 : usersPageStartIndex + 1;
  const usersRangeEnd =
    usersTotalCount === 0 ? 0 : Math.min(usersPageStartIndex + usersPageSize, usersTotalCount);
  const pagedUsers = useMemo(
    () =>
      (usersPayload?.items ?? []).slice(
        usersPageStartIndex,
        usersPageStartIndex + usersPageSize
      ),
    [usersPayload?.items, usersPageStartIndex, usersPageSize]
  );

  const setRowDraft = (userId: string, patch: Partial<UserRowDraft>) => {
    setRowDraftById((previous) => ({
      ...previous,
      [userId]: {
        ...previous[userId],
        ...patch,
      },
    }));
  };

  const onCreateUser = async () => {
    setActionError(null);
    setActionSuccess(null);

    const nextPassword = createPassword.trim();
    if (nextPassword && nextPassword.length < 6) {
      setActionError(copy.createPasswordInvalidError);
      toast.error(copy.createPasswordInvalidError);
      return;
    }

    try {
      await createMutation.mutateAsync({
        email: createEmail,
        password: nextPassword || null,
        fullName: createFullName,
        phone: createPhone,
        role: createRole,
        locale: createLocale,
        defaultBranchId: createDefaultBranchId || null,
        branchIds: createBranchIds,
      });

      setActionSuccess(copy.successCreate);
      toast.success(copy.successCreate);
      setCreateEmail("");
      setCreatePassword("");
      setCreateFullName("");
      setCreatePhone("");
    } catch (error) {
      const message = resolveSettingsUsersActionErrorMessage({
        error,
        copy,
      });
      setActionError(message);
      toast.error(message);
    }
  };

  const onUpdateUser = async (userId: string) => {
    const draft = rowDraftById[userId];
    const current = usersPayload?.items.find((entry) => entry.profileId === userId);
    if (!draft || !current) return;

    setActionError(null);
    setActionSuccess(null);

    const payload: SettingsUpdateUserPayload = {};

    if (draft.role !== current.role) {
      payload.role = draft.role;
    }

    const draftFullName = draft.fullName.trim();
    const currentFullName = (current.fullName ?? "").trim();
    if (draftFullName !== currentFullName) {
      payload.fullName = draftFullName || null;
    }

    if (draft.locale !== current.locale) {
      payload.locale = draft.locale;
    }

    if (draft.isActive !== current.isActive) {
      payload.isActive = draft.isActive;
    }

    const currentDefaultBranchId = current.defaultBranchId ?? null;
    const draftDefaultBranchId = draft.defaultBranchId ?? null;
    if (draftDefaultBranchId !== currentDefaultBranchId) {
      payload.defaultBranchId = draftDefaultBranchId;
    }

    if (!areBranchIdsEqual(draft.branchIds, current.branchIds)) {
      payload.branchIds = draft.branchIds;
    }

    const newPassword = resetPasswordDraftByUserId[userId]?.trim() ?? "";
    if (newPassword && newPassword.length < 6) {
      setActionError(copy.resetPasswordInvalidError);
      toast.error(copy.resetPasswordInvalidError);
      return;
    }

    const hasProfileChanges = Object.keys(payload).length > 0;
    const shouldResetPassword = Boolean(newPassword);

    if (!hasProfileChanges && !shouldResetPassword) {
      setActionSuccess(copy.successUpdate);
      toast.success(copy.successUpdate);
      return;
    }

    try {
      if (hasProfileChanges) {
        await updateMutation.mutateAsync({
          userId,
          payload,
        });
      }

      if (shouldResetPassword) {
        await resetMutation.mutateAsync({
          userId,
          payload: {
            newPassword,
          },
        });
        setResetPasswordDraft(userId, "");
      }

      const nextSuccessMessage =
        hasProfileChanges && shouldResetPassword
          ? `${copy.successUpdate} ${copy.successReset}`
          : hasProfileChanges
            ? copy.successUpdate
            : copy.successReset;
      setActionSuccess(nextSuccessMessage);
      toast.success(nextSuccessMessage);
    } catch (error) {
      const message = resolveSettingsUsersActionErrorMessage({
        error,
        copy,
      });
      setActionError(message);
      toast.error(message);
    }
  };

  const setResetPasswordDraft = (userId: string, value: string) => {
    setResetPasswordDraftByUserId((previous) => ({
      ...previous,
      [userId]: value,
    }));
  };

  const goToPrevUsersPage = () => {
    setUsersPage((previous) => Math.max(1, previous - 1));
  };

  const goToNextUsersPage = () => {
    setUsersPage((previous) => Math.min(usersTotalPages, previous + 1));
  };

  const changeUsersPageSize = (value: number) => {
    if (!Number.isFinite(value) || value < 1) return;
    setUsersPageSize(value);
    setUsersPage(1);
  };

  return {
    copy,
    canManageSettings,
    query,
    createMutation,
    updateMutation,
    resetMutation,
    usersPayload,
    pagedUsers,
    usersTotalCount,
    usersTotalPages,
    usersCurrentPage,
    usersRangeStart,
    usersRangeEnd,
    usersPageSize,
    usersPageSizeOptions: USERS_PAGE_SIZE_OPTIONS,
    canGoPrevUsersPage: usersCurrentPage > 1,
    canGoNextUsersPage: usersCurrentPage < usersTotalPages,
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
    roleOptions: ROLE_OPTIONS,
    actionError,
    actionSuccess,
  };
}
