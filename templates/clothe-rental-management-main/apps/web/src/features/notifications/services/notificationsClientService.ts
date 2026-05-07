"use client";

import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationsListQuery,
  NotificationsListResponse,
} from "@/types/notificationsModule";

function toQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  const raw = search.toString();
  return raw ? `?${raw}` : "";
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

async function buildRequestInit(
  method: "GET" | "PATCH",
  body?: unknown
): Promise<RequestInit> {
  const authHeaders = await getSupabaseAuthHeaders();
  const headers: Record<string, string> = {
    ...authHeaders,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return {
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
}

// Map to dedupe concurrent identical requests. Keyed by full request URL.
const inFlightFetches = new Map<string, Promise<NotificationsListResponse>>();

export const notificationsClientService = {
  async fetchNotifications(query: NotificationsListQuery): Promise<NotificationsListResponse> {
    const queryString = toQueryString({
      cursor: query.cursor,
      limit: query.limit,
      isRead: query.isRead,
    });

    const url = `/api/notifications${queryString}`;

    const existing = inFlightFetches.get(url);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const response = await fetch(url, await buildRequestInit("GET"));
        return await parseJsonResponse<NotificationsListResponse>(response);
      } finally {
        inFlightFetches.delete(url);
      }
    })();

    inFlightFetches.set(url, promise);
    return promise;
  },

  async markNotificationRead(notificationId: string): Promise<MarkNotificationReadResponse> {
    const response = await fetch(
      `/api/notifications/${notificationId}/read`,
      await buildRequestInit("PATCH")
    );

    return parseJsonResponse<MarkNotificationReadResponse>(response);
  },

  async markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
    const response = await fetch(
      "/api/notifications/read-all",
      await buildRequestInit("PATCH")
    );

    return parseJsonResponse<MarkAllNotificationsReadResponse>(response);
  },
};
