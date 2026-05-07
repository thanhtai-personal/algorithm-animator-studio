"use client";

import { useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useMakeupMyStatsQuery } from "@/features/makeup/queries/useMakeupQueries";
import { makeupStore } from "@/features/makeup/stores/makeupStore";

const COPY = {
  vi: {
    title: "Thống kê makeup của tôi",
    subtitle: "Theo dõi doanh thu/lợi nhuận cá nhân.",
    loading: "Đang tải thống kê...",
    loadError: "Tải thống kê thất bại.",
    retryAction: "Thử lại",
  },
  en: {
    title: "My makeup stats",
    subtitle: "Track your personal revenue/profit.",
    loading: "Loading stats...",
    loadError: "Failed to load stats.",
    retryAction: "Retry",
  },
} as const;

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useMakeupMyStatsPage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const canAccess = role === "makeup_artist";

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return toIsoDate(date);
  });
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));

  const query = useMakeupMyStatsQuery(
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
    query,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    stats: makeupStore.myStats,
  };
}
