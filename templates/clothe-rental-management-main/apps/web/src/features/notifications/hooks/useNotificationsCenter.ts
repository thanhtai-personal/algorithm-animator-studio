"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  notificationsQueryKeys,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsInfiniteQuery,
} from "@/features/notifications/queries/useNotificationsQueries";
import { notificationsStore } from "@/features/notifications/stores/notificationsStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface NotificationsCenterCopy {
  title: string;
  markAll: string;
  refresh: string;
  loading: string;
  empty: string;
  loadMore: string;
  loadingMore: string;
  errorFallback: string;
  retry: string;
  unreadBadge: string;
  realtimeConnected: string;
  realtimeFallback: string;
  justNow: string;
}

const NOTIFICATIONS_CENTER_COPY: Record<AppLocale, NotificationsCenterCopy> = {
  vi: {
    title: "Thông báo",
    markAll: "Đánh dấu đã đọc",
    refresh: "Làm mới",
    loading: "Đang tải thông báo...",
    empty: "Chưa có thông báo nào.",
    loadMore: "Tải thêm",
    loadingMore: "Đang tải thêm...",
    errorFallback: "Không thể tải thông báo.",
    retry: "Thử lại",
    unreadBadge: "chưa đọc",
    realtimeConnected: "Realtime",
    realtimeFallback: "Polling",
    justNow: "Vừa xong",
  },
  en: {
    title: "Notifications",
    markAll: "Mark all read",
    refresh: "Refresh",
    loading: "Loading notifications...",
    empty: "No notifications yet.",
    loadMore: "Load more",
    loadingMore: "Loading more...",
    errorFallback: "Unable to load notifications.",
    retry: "Retry",
    unreadBadge: "unread",
    realtimeConnected: "Realtime",
    realtimeFallback: "Polling",
    justNow: "Just now",
  },
};

function formatRelativeTime(value: string, locale: AppLocale, justNowLabel: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return justNowLabel;

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes <= 0) return justNowLabel;
  if (diffMinutes < 60) {
    return locale === "vi" ? `${diffMinutes} phút trước` : `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return locale === "vi" ? `${diffHours} giờ trước` : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return locale === "vi" ? `${diffDays} ngày trước` : `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function useNotificationsCenter(locale: AppLocale) {
  const copy = NOTIFICATIONS_CENTER_COPY[locale];
  const queryClient = useQueryClient();
  const { hasCloudSession, profile, profileLoadStatus } = useAuthAccess();

  const [channelState, setChannelState] = useState<"realtime" | "polling">("polling");

  const enabled =
    hasCloudSession && profileLoadStatus === "ready" && Boolean(profile?.id);

  const notificationsQuery = useNotificationsInfiniteQuery({
    enabled,
    limit: 20,
    pollingIntervalMs: channelState === "realtime" ? 90_000 : 30_000,
  });

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (!enabled || !profile?.id) {
      return;
    }

    let disposed = false;
    const supabase = getSupabaseBrowserClient();

    const channel: RealtimeChannel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_profile_id=eq.${profile.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.lists() });
        }
      )
      .subscribe((status) => {
        if (disposed) return;
        if (status === "SUBSCRIBED") {
          setChannelState("realtime");
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setChannelState("polling");
        }
      });

    return () => {
      disposed = true;
      void supabase.removeChannel(channel);
    };
  }, [enabled, profile?.id, queryClient]);

  const errorMessage =
    notificationsQuery.error instanceof Error
      ? notificationsQuery.error.message
      : copy.errorFallback;

  const items = notificationsStore.listItems;
  const unreadCount = notificationsStore.unreadCount;

  const loadMore = useCallback(() => {
    if (!notificationsQuery.hasNextPage || notificationsQuery.isFetchingNextPage) return;
    void notificationsQuery.fetchNextPage();
  }, [notificationsQuery]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      const target = notificationsStore.listItems.find((entry) => entry.id === notificationId);
      if (!target || target.isRead || markReadMutation.isPending) return;
      void markReadMutation.mutateAsync(notificationId);
    },
    [markReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    if (unreadCount <= 0 || markAllReadMutation.isPending) return;
    void markAllReadMutation.mutateAsync();
  }, [markAllReadMutation, unreadCount]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.lists() });
  }, [queryClient]);

  const realtimeLabel = useMemo(
    () => (channelState === "realtime" ? copy.realtimeConnected : copy.realtimeFallback),
    [channelState, copy.realtimeConnected, copy.realtimeFallback]
  );

  return {
    copy,
    items,
    unreadCount,
    errorMessage,
    realtimeLabel,
    isRealtime: channelState === "realtime",
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    isRefreshing: notificationsQuery.isRefetching,
    isLoadingMore: notificationsQuery.isFetchingNextPage,
    hasMore: Boolean(notificationsQuery.hasNextPage),
    markReadPending: markReadMutation.isPending,
    markAllReadPending: markAllReadMutation.isPending,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    formatRelativeTime: (value: string) => formatRelativeTime(value, locale, copy.justNow),
  };
}
