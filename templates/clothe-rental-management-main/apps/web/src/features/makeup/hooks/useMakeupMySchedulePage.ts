"use client";

import { useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useMakeupEventsQuery } from "@/features/makeup/queries/useMakeupQueries";
import { makeupStore } from "@/features/makeup/stores/makeupStore";

const COPY = {
  vi: {
    title: "Lịch cá nhân makeup",
    subtitle: "Xem các lịch được phân công cho bạn.",
    loading: "Đang tải lịch...",
    loadError: "Tải lịch thất bại.",
    retryAction: "Thử lại",
  },
  en: {
    title: "My makeup schedule",
    subtitle: "Review all bookings assigned to you.",
    loading: "Loading schedule...",
    loadError: "Failed to load schedule.",
    retryAction: "Retry",
  },
} as const;

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useMakeupMySchedulePage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId, profile } = useAuthAccess();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return toIsoDate(date);
  });
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));

  const eventsQuery = useMakeupEventsQuery({
    branchId: currentBranchId,
    startDate,
    endDate,
    artistProfileId: profile?.id ?? undefined,
  });

  const events = makeupStore.events?.events ?? [];

  return {
    copy,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    eventsQuery,
    events,
  };
}
