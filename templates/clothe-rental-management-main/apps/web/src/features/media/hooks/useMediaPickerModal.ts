"use client";

import { useCallback, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { useMediaLibraryQuery, useUploadMediaMutation } from "@/features/media/queries/useMediaQueries";
import { MediaApiError } from "@/features/media/services/mediaClientService";
import { useDebouncedValue } from "@/features/products/utils/useDebouncedValue";
import type { MediaAssetDto, MediaAssetType, MediaUsageDto } from "@/types/mediaLibrary";

interface MediaPickerCopy {
  title: string;
  description: string;
  searchPlaceholder: string;
  typeAll: string;
  typeImage: string;
  typeVideo: string;
  uploadAction: string;
  uploadingAction: string;
  uploadFailed: string;
  quotaFull: string;
  empty: string;
  noBranchContext: string;
  closeAction: string;
  selectAction: string;
  selectedAction: string;
  selectedCountLabel: string;
  confirmSelectionAction: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
}

const COPY_MAP: Record<AppLocale, MediaPickerCopy> = {
  vi: {
    title: "Chọn media",
    description: "Tìm, chọn hoặc upload media để chèn vào form.",
    searchPlaceholder: "Tìm media...",
    typeAll: "Tất cả",
    typeImage: "Ảnh",
    typeVideo: "Video",
    uploadAction: "Upload mới",
    uploadingAction: "Đang upload",
    uploadFailed: "Upload media thất bại.",
    quotaFull: "Bộ nhớ đã đầy, không thể upload thêm.",
    empty: "Không có media phù hợp.",
    noBranchContext: "Thiếu ngữ cảnh chi nhánh.",
    closeAction: "Đóng",
    selectAction: "Chọn",
    selectedAction: "Đã chọn",
    selectedCountLabel: "Đã chọn",
    confirmSelectionAction: "Xác nhận chèn",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
  },
  en: {
    title: "Select media",
    description: "Search, select, or upload media into the product form.",
    searchPlaceholder: "Search media...",
    typeAll: "All",
    typeImage: "Image",
    typeVideo: "Video",
    uploadAction: "Upload new",
    uploadingAction: "Uploading",
    uploadFailed: "Media upload failed.",
    quotaFull: "Storage is full. Upload is blocked.",
    empty: "No matching media found.",
    noBranchContext: "Missing branch context.",
    closeAction: "Close",
    selectAction: "Select",
    selectedAction: "Selected",
    selectedCountLabel: "Selected",
    confirmSelectionAction: "Confirm insert",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
  },
};

type MediaTypeFilter = "all" | MediaAssetType;

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

export function useMediaPickerModal(options: {
  locale: AppLocale;
  branchId: string | null;
  defaultMediaType?: MediaAssetType | null;
  enabled?: boolean;
}) {
  const copy = COPY_MAP[options.locale];

  const [searchInput, setSearchInput] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>(
    options.defaultMediaType ?? "all"
  );
  const [page, setPage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>(INITIAL_UPLOAD_PROGRESS);

  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const query = useMediaLibraryQuery({
    branchId: options.enabled === false ? null : options.branchId,
    search: debouncedSearch,
    mediaType: mediaTypeFilter === "all" ? null : mediaTypeFilter,
    page,
    pageSize: 24,
  });

  const uploadMutation = useUploadMediaMutation();

  const items: MediaAssetDto[] = query.data?.items ?? [];
  const usage = query.data?.usage ?? FALLBACK_USAGE;

  const mapErrorToMessage = (error: unknown): string => {
    if (error instanceof MediaApiError) {
      if (error.code === "MEDIA_STORAGE_LIMIT_EXCEEDED") {
        return copy.quotaFull;
      }
      return error.code;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return copy.uploadFailed;
  };

  const uploadFiles = async (files: File[]) => {
    if (!options.branchId) {
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
          branchId: options.branchId,
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

    await query.refetch();
  };

  const setDefaultMediaType = useCallback((mediaType: MediaAssetType | null | undefined) => {
    setPage(1);
    setMediaTypeFilter(mediaType ?? "all");
  }, []);

  return {
    copy,
    query,
    uploadMutation,
    searchInput,
    setSearchInput,
    mediaTypeFilter,
    setMediaTypeFilter,
    setDefaultMediaType,
    page,
    setPage,
    items,
    usage,
    uploadProgress,
    uploadFiles,
    mapErrorToMessage,
    totalPages: Math.max(1, Math.ceil((query.data?.total ?? 0) / 24)),
  };
}
