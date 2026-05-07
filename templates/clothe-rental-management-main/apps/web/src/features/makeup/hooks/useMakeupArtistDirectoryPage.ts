"use client";

import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useMakeupArtistsQuery } from "@/features/makeup/queries/useMakeupQueries";
import { makeupStore } from "@/features/makeup/stores/makeupStore";

const COPY = {
  vi: {
    title: "Danh sách chuyên viên makeup",
    subtitle: "Xem chuyên viên theo chi nhánh và mở lịch chi tiết.",
    loading: "Đang tải danh sách chuyên viên...",
    loadError: "Tải danh sách chuyên viên thất bại.",
    retryAction: "Thử lại",
    noData: "Chưa có chuyên viên makeup trong chi nhánh.",
    openSchedule: "Xem lịch",
  },
  en: {
    title: "Makeup artist directory",
    subtitle: "Browse branch artists and open their schedules.",
    loading: "Loading artist directory...",
    loadError: "Failed to load artist directory.",
    retryAction: "Retry",
    noData: "No makeup artists in this branch.",
    openSchedule: "Open schedule",
  },
} as const;

export function useMakeupArtistDirectoryPage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const canAccess = role === "owner_admin" || role === "manager";

  const query = useMakeupArtistsQuery(currentBranchId, canAccess);

  return {
    copy,
    canAccess,
    query,
    artists: makeupStore.artists?.items ?? [],
  };
}
