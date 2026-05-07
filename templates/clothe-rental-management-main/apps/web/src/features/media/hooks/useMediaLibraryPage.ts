"use client";

import { useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useDeleteMediaMutation, useMediaLibraryQuery, useUploadMediaMutation } from "@/features/media/queries/useMediaQueries";
import { MediaApiError } from "@/features/media/services/mediaClientService";
import { mediaStore } from "@/features/media/stores/mediaStore";
import { useDebouncedValue } from "@/features/products/utils/useDebouncedValue";
import type { MediaAssetType, MediaUsageDto } from "@/types/mediaLibrary";

export type MediaTypeFilter = "all" | MediaAssetType;

interface MediaLibraryCopy {
  title: string;
  subtitle: string;
  uploadAction: string;
  uploadingAction: string;
  deleteAction: string;
  searchPlaceholder: string;
  typeFilterLabel: string;
  typeAll: string;
  typeImage: string;
  typeVideo: string;
  tableFile: string;
  tableType: string;
  tableSize: string;
  tableUploadedAt: string;
  tableActions: string;
  loading: string;
  empty: string;
  noBranchContext: string;
  noPermission: string;
  quotaTitle: string;
  quotaLimit: string;
  quotaUsed: string;
  quotaReserved: string;
  quotaRemaining: string;
  quotaWarning: string;
  quotaFull: string;
  uploadSuccess: string;
  uploadFailed: string;
  deleteSuccess: string;
  deleteFailed: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  retry: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
}

const COPY_MAP: Record<AppLocale, MediaLibraryCopy> = {
  vi: {
    title: "Thư viện media",
    subtitle: "Quản lý ảnh/video dùng chung cho sản phẩm.",
    uploadAction: "Upload media",
    uploadingAction: "Đang upload",
    deleteAction: "Xóa",
    searchPlaceholder: "Tìm theo tên file hoặc đường dẫn...",
    typeFilterLabel: "Loại",
    typeAll: "Tất cả",
    typeImage: "Ảnh",
    typeVideo: "Video",
    tableFile: "File",
    tableType: "Loại",
    tableSize: "Dung lượng",
    tableUploadedAt: "Thời gian tải",
    tableActions: "Thao tác",
    loading: "Đang tải thư viện media...",
    empty: "Chưa có media phù hợp bộ lọc.",
    noBranchContext: "Thiếu ngữ cảnh chi nhánh để tải media.",
    noPermission: "Bạn không có quyền truy cập module Media.",
    quotaTitle: "Dung lượng lưu trữ",
    quotaLimit: "Giới hạn",
    quotaUsed: "Đã dùng",
    quotaReserved: "Đang giữ chỗ upload",
    quotaRemaining: "Còn lại",
    quotaWarning: "Dung lượng sắp đầy. Vui lòng xóa bớt media trước khi upload thêm.",
    quotaFull: "Bộ nhớ đã đầy (9GB). Không thể upload thêm.",
    uploadSuccess: "Upload media thành công.",
    uploadFailed: "Upload media thất bại.",
    deleteSuccess: "Đã xóa media.",
    deleteFailed: "Xóa media thất bại.",
    deleteConfirmTitle: "Xác nhận xóa media này?",
    deleteConfirmDesc: "File sẽ bị xóa khỏi storage và không thể khôi phục.",
    retry: "Thử lại",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
  },
  en: {
    title: "Media library",
    subtitle: "Manage shared images/videos used by products.",
    uploadAction: "Upload media",
    uploadingAction: "Uploading",
    deleteAction: "Delete",
    searchPlaceholder: "Search by file name or path...",
    typeFilterLabel: "Type",
    typeAll: "All",
    typeImage: "Image",
    typeVideo: "Video",
    tableFile: "File",
    tableType: "Type",
    tableSize: "Size",
    tableUploadedAt: "Uploaded",
    tableActions: "Actions",
    loading: "Loading media library...",
    empty: "No media matched the current filters.",
    noBranchContext: "Missing branch context for media module.",
    noPermission: "You do not have access to the media module.",
    quotaTitle: "Storage usage",
    quotaLimit: "Limit",
    quotaUsed: "Used",
    quotaReserved: "Reserved",
    quotaRemaining: "Remaining",
    quotaWarning: "Storage is nearly full. Remove some media before uploading more.",
    quotaFull: "Storage is full (9GB). Upload is blocked.",
    uploadSuccess: "Media uploaded.",
    uploadFailed: "Media upload failed.",
    deleteSuccess: "Media deleted.",
    deleteFailed: "Media delete failed.",
    deleteConfirmTitle: "Delete this media item?",
    deleteConfirmDesc: "The file will be removed from storage and cannot be restored.",
    retry: "Retry",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
  },
};

const MEDIA_ALLOWED_ROLE_SET = new Set(["owner_admin", "admin", "manager"]);

function normalizeRole(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "admin") return "owner_admin";
  return normalized || null;
}

const FALLBACK_USAGE: MediaUsageDto = {
  usedBytes: 0,
  reservedBytes: 0,
  limitBytes: 9 * 1024 * 1024 * 1024,
  remainingBytes: 9 * 1024 * 1024 * 1024,
  usageRatio: 0,
  isFull: false,
  warning: false,
};

interface UploadProgressState {
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  currentFileName: string | null;
}

const INITIAL_UPLOAD_PROGRESS: UploadProgressState = {
  isUploading: false,
  totalFiles: 0,
  completedFiles: 0,
  currentFileName: null,
};

const MEDIA_PAGE_SIZE = 24;

export function useMediaLibraryPage(locale: AppLocale) {
  const copy = COPY_MAP[locale];
  const { currentBranchId, role } = useAuthAccess();

  const [searchInput, setSearchInput] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>("all");
  const [page, setPage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>(INITIAL_UPLOAD_PROGRESS);

  const debouncedSearch = useDebouncedValue(searchInput, 250);
  const normalizedRole = normalizeRole(role);
  const canAccessMedia = Boolean(normalizedRole && MEDIA_ALLOWED_ROLE_SET.has(normalizedRole));
  const queryMediaType = mediaTypeFilter === "all" ? null : mediaTypeFilter;

  const query = useMediaLibraryQuery({
    branchId: currentBranchId,
    search: debouncedSearch,
    mediaType: queryMediaType,
    page,
    pageSize: MEDIA_PAGE_SIZE,
  });

  const uploadMutation = useUploadMediaMutation();
  const deleteMutation = useDeleteMediaMutation();

  const normalizedSearch = debouncedSearch.trim() || null;
  const isStoreForCurrentFilter =
    mediaStore.branchId === currentBranchId &&
    mediaStore.pageSize === MEDIA_PAGE_SIZE &&
    mediaStore.search === normalizedSearch &&
    mediaStore.mediaType === queryMediaType;
  const isStoreForCurrentList = isStoreForCurrentFilter && mediaStore.page === page;

  const items = isStoreForCurrentList ? mediaStore.items : query.data?.items ?? [];
  const total = isStoreForCurrentFilter ? mediaStore.total : query.data?.total ?? 0;
  const usage =
    mediaStore.branchId === currentBranchId && mediaStore.usage
      ? mediaStore.usage
      : query.data?.usage ?? FALLBACK_USAGE;

  const totalPages = Math.max(1, Math.ceil(total / MEDIA_PAGE_SIZE));

  const mapErrorToMessage = (error: unknown): string => {
    if (error instanceof MediaApiError) {
      if (error.code === "MEDIA_STORAGE_LIMIT_EXCEEDED") {
        return usage.isFull ? copy.quotaFull : copy.quotaWarning;
      }

      if (error.code === "FORBIDDEN_MEDIA_ACCESS") {
        return copy.noPermission;
      }

      if (error.code === "MISSING_BRANCH_CONTEXT") {
        return copy.noBranchContext;
      }

      return error.code;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return copy.uploadFailed;
  };

  const uploadFiles = async (files: File[]) => {
    if (!currentBranchId) {
      throw new Error(copy.noBranchContext);
    }

    const validFiles = files.filter((file): file is File => Boolean(file));
    if (validFiles.length === 0) return;

    setUploadProgress({
      isUploading: true,
      totalFiles: validFiles.length,
      completedFiles: 0,
      currentFileName: validFiles[0]?.name ?? null,
    });

    try {
      for (const [index, file] of validFiles.entries()) {
        setUploadProgress((previous) => ({
          ...previous,
          currentFileName: file.name,
          completedFiles: index,
        }));

        await uploadMutation.mutateAsync({
          branchId: currentBranchId,
          file,
        });

        setUploadProgress((previous) => ({
          ...previous,
          completedFiles: index + 1,
        }));
      }
    } finally {
      setUploadProgress(INITIAL_UPLOAD_PROGRESS);
    }
  };

  const deleteMediaAsset = async (mediaAssetId: string) => {
    await deleteMutation.mutateAsync(mediaAssetId);
  };

  return {
    copy,
    currentBranchId,
    canAccessMedia,
    query,
    uploadMutation,
    deleteMutation,
    searchInput,
    setSearchInput,
    mediaTypeFilter,
    setMediaTypeFilter,
    page,
    setPage,
    totalPages,
    items,
    usage,
    uploadProgress,
    uploadFiles,
    deleteMediaAsset,
    mapErrorToMessage,
  };
}
