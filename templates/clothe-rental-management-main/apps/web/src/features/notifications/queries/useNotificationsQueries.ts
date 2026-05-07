"use client";

import { useEffect } from "react";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { notificationsClientService } from "@/features/notifications/services/notificationsClientService";
import { notificationsStore } from "@/features/notifications/stores/notificationsStore";
import type { NotificationsListResponse } from "@/types/notificationsModule";

const notificationsQueryKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationsQueryKeys.all, "list"] as const,
  list: (options: { isRead?: boolean | null; limit?: number }) =>
    [...notificationsQueryKeys.lists(), options.isRead ?? "all", options.limit ?? 20] as const,
};

export function useNotificationsInfiniteQuery(options?: {
  enabled?: boolean;
  isRead?: boolean | null;
  limit?: number;
  pollingIntervalMs?: number;
}) {
  const queryResult = useInfiniteQuery<
    NotificationsListResponse,
    Error,
    InfiniteData<NotificationsListResponse, string | null>,
    ReturnType<typeof notificationsQueryKeys.list>,
    string | null
  >({
    queryKey: notificationsQueryKeys.list({
      isRead: options?.isRead,
      limit: options?.limit,
    }),
    queryFn: ({ pageParam }) =>
      notificationsClientService.fetchNotifications({
        cursor: pageParam,
        isRead: options?.isRead,
        limit: options?.limit,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 15_000,
    refetchInterval: options?.pollingIntervalMs ?? 60_000,
    enabled: options?.enabled ?? true,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    notificationsStore.replaceFromPages(queryResult.data.pages);
  }, [queryResult.data]);

  useEffect(() => {
    if (options?.enabled === false) {
      notificationsStore.clear();
    }
  }, [options?.enabled]);

  return queryResult;
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsClientService.markNotificationRead(notificationId),
    onSuccess: async (payload) => {
      notificationsStore.upsertListItem(payload.item);
      notificationsStore.setUnreadCount(payload.unreadCount);
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.lists() });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsClientService.markAllNotificationsRead(),
    onSuccess: async (payload) => {
      notificationsStore.markAllAsRead();
      notificationsStore.setUnreadCount(payload.unreadCount);
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.lists() });
    },
  });
}

export { notificationsQueryKeys };
