import { useQuery } from "@tanstack/react-query";
import type {
  ZaloMiniAppCalendarArtistsResponse,
  ZaloMiniAppCalendarEventsQuery,
} from "@/features/calendar/types/calendar";
import { zaloMiniAppCalendarService } from "@/features/calendar/services/zaloMiniAppCalendarService";

export const zaloMiniAppCalendarQueryKeys = {
  all: ["zalo-mini-app-calendar"] as const,
  artists: (branchId: string | null) =>
    [...zaloMiniAppCalendarQueryKeys.all, "artists", branchId ?? ""] as const,
  events: (query: ZaloMiniAppCalendarEventsQuery | null) =>
    [
      ...zaloMiniAppCalendarQueryKeys.all,
      "events",
      query?.branchId ?? "",
      query?.artistProfileId ?? "",
      query?.startDate ?? "",
      query?.endDate ?? "",
    ] as const,
};

export function useMiniAppCalendarEventsQuery(
  query: ZaloMiniAppCalendarEventsQuery | null,
  accessToken: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: zaloMiniAppCalendarQueryKeys.events(query),
    enabled: Boolean(enabled && query && accessToken),
    queryFn: () => {
      if (!query || !accessToken) {
        throw new Error("Missing query/access token for calendar events.");
      }

      return zaloMiniAppCalendarService.getEvents(query, accessToken);
    },
    staleTime: 10_000,
  });
}

export function useMiniAppCalendarArtistsQuery(
  branchId: string | null,
  accessToken: string | null,
  enabled: boolean
) {
  return useQuery<ZaloMiniAppCalendarArtistsResponse>({
    queryKey: zaloMiniAppCalendarQueryKeys.artists(branchId),
    enabled: Boolean(enabled && branchId && accessToken),
    queryFn: () => {
      if (!branchId || !accessToken) {
        throw new Error("Missing branch/access token for makeup artists.");
      }

      return zaloMiniAppCalendarService.getArtists(branchId, accessToken);
    },
    staleTime: 30_000,
  });
}
