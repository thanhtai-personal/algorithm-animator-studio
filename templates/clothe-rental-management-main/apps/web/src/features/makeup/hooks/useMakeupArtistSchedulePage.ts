"use client";

import { useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useMakeupArtistScheduleQuery } from "@/features/makeup/queries/useMakeupQueries";

const COPY = {
  vi: {
    title: "Lịch chuyên viên",
    subtitle: "Theo dõi lịch makeup của chuyên viên đã chọn.",
    loading: "Đang tải lịch chuyên viên...",
    loadError: "Tải lịch chuyên viên thất bại.",
    retryAction: "Thử lại",
  },
  en: {
    title: "Artist schedule",
    subtitle: "Track bookings for selected makeup artist.",
    loading: "Loading artist schedule...",
    loadError: "Failed to load artist schedule.",
    retryAction: "Retry",
  },
} as const;

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useMakeupArtistSchedulePage(locale: AppLocale, artistProfileId: string) {
  const copy = COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const canAccess = role === "owner_admin" || role === "manager";

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return toIsoDate(date);
  });
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));

  const query = useMakeupArtistScheduleQuery(
    artistProfileId,
    {
      branchId: currentBranchId,
      startDate,
      endDate,
    },
    canAccess
  );

  return {
    copy,
    canAccess,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    query,
    events: query.data?.events ?? [],
  };
}
