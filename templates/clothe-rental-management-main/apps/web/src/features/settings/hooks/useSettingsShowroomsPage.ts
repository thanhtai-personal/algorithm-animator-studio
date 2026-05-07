"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateSettingsShowroomMutation,
  useDeleteSettingsShowroomMutation,
  useSettingsShowroomsQuery,
  useUpdateSettingsShowroomMutation,
} from "@/features/settings/queries/useSettingsQueries";
import { settingsStore } from "@/features/settings/stores/settingsStore";

interface SettingsShowroomsCopy {
  title: string;
  subtitle: string;
  noPermission: string;
  createTitle: string;
  nameLabel: string;
  slugLabel: string;
  branchLabel: string;
  activeLabel: string;
  createAction: string;
  listTitle: string;
  saveAction: string;
  deleteAction: string;
  defaultLockedHint: string;
  confirmDelete: string;
  retryAction: string;
  loading: string;
  loadError: string;
  successCreate: string;
  successUpdate: string;
  successDelete: string;
  openShowroomPageAction: string;
  closeShowroomPageAction: string;
}

const SHOWROOMS_COPY: Record<AppLocale, SettingsShowroomsCopy> = {
  vi: {
    title: "Phòng trưng bày",
    subtitle: "Quản lý phòng trưng bày công khai theo slug và gắn branch tương ứng.",
    noPermission: "Chỉ Owner/Admin được phép quản lý phòng trưng bày.",
    createTitle: "Tạo phòng trưng bày mới",
    nameLabel: "Tên phòng trưng bày",
    slugLabel: "Slug (không dấu, dùng cho URL)",
    branchLabel: "Chi nhánh",
    activeLabel: "Hoạt động",
    createAction: "Tạo phòng trưng bày",
    listTitle: "Danh sách phòng trưng bày",
    saveAction: "Lưu",
    deleteAction: "Xóa",
    defaultLockedHint: "Phòng trưng bày mặc định không được phép sửa/xóa.",
    confirmDelete: "Xác nhận xóa phòng trưng bày này?",
    retryAction: "Thử lại",
    loading: "Đang tải phòng trưng bày...",
    loadError: "Tải phòng trưng bày thất bại.",
    successCreate: "Đã tạo phòng trưng bày.",
    successUpdate: "Đã cập nhật phòng trưng bày.",
    successDelete: "Đã xóa phòng trưng bày.",
    openShowroomPageAction: "Mở trang phòng trưng bày",
    closeShowroomPageAction: "Ẩn trang phòng trưng bày",
  },
  en: {
    title: "Showrooms",
    subtitle: "Manage public showroom entries mapped to branch and slug.",
    noPermission: "Only Owner/Admin can manage showrooms.",
    createTitle: "Create showroom",
    nameLabel: "Showroom name",
    slugLabel: "Slug (URL)",
    branchLabel: "Branch",
    activeLabel: "Active",
    createAction: "Create showroom",
    listTitle: "Showroom list",
    saveAction: "Save",
    deleteAction: "Delete",
    defaultLockedHint: "Default showroom is locked for update/delete.",
    confirmDelete: "Delete this showroom?",
    retryAction: "Retry",
    loading: "Loading showrooms...",
    loadError: "Failed to load showrooms.",
    successCreate: "Showroom created.",
    successUpdate: "Showroom updated.",
    successDelete: "Showroom deleted.",
    openShowroomPageAction: "Open showroom page",
    closeShowroomPageAction: "Hide showroom page",
  },
};

interface ShowroomRowDraft {
  name: string;
  slug: string;
  branchId: string;
  isActive: boolean;
}

export function useSettingsShowroomsPage(locale: AppLocale) {
  const copy = SHOWROOMS_COPY[locale];
  const { can, role } = useAuthAccess();
  const normalizedRole = role?.trim().toLowerCase() ?? "";
  const canManageSettings =
    can("settings.manage") &&
    (normalizedRole === "owner_admin" || normalizedRole === "admin");

  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createBranchId, setCreateBranchId] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);

  const [rowDraftById, setRowDraftById] = useState<Record<string, ShowroomRowDraft>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const query = useSettingsShowroomsQuery(canManageSettings);
  const createMutation = useCreateSettingsShowroomMutation();
  const updateMutation = useUpdateSettingsShowroomMutation();
  const deleteMutation = useDeleteSettingsShowroomMutation();

  const showroomsPayload = settingsStore.showrooms;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!showroomsPayload) return;

    const nextDraftById: Record<string, ShowroomRowDraft> = {};
    for (const row of showroomsPayload.items) {
      nextDraftById[row.id] = {
        name: row.name,
        slug: row.slug,
        branchId: row.branchId,
        isActive: row.isActive,
      };
    }

    setRowDraftById(nextDraftById);
    if (!createBranchId) {
      setCreateBranchId(showroomsPayload.branches[0]?.id ?? "");
    }
  }, [createBranchId, query.data, showroomsPayload]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setRowDraft = (showroomId: string, patch: Partial<ShowroomRowDraft>) => {
    setRowDraftById((previous) => ({
      ...previous,
      [showroomId]: {
        ...previous[showroomId],
        ...patch,
      },
    }));
  };

  const onCreateShowroom = async () => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await createMutation.mutateAsync({
        name: createName,
        slug: createSlug || null,
        branchId: createBranchId,
        isActive: createIsActive,
      });

      setCreateName("");
      setCreateSlug("");
      setCreateIsActive(true);
      setActionSuccess(copy.successCreate);
      toast.success(copy.successCreate);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
    }
  };

  const onUpdateShowroom = async (showroomId: string) => {
    const draft = rowDraftById[showroomId];
    if (!draft) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      await updateMutation.mutateAsync({
        showroomId,
        payload: {
          name: draft.name,
          slug: draft.slug,
          branchId: draft.branchId,
          isActive: draft.isActive,
        },
      });

      setActionSuccess(copy.successUpdate);
      toast.success(copy.successUpdate);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
    }
  };

  const onDeleteShowroom = async (showroomId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await deleteMutation.mutateAsync(showroomId);
      setActionSuccess(copy.successDelete);
      toast.success(copy.successDelete);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
    }
  };

  return {
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
  };
}
