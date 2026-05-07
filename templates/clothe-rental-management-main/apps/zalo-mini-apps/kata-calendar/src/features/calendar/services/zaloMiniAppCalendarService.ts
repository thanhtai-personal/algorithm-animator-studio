import { requestJson } from "@/lib/httpClient";
import type {
  ZaloMiniAppCalendarArtistsResponse,
  ZaloMiniAppCalendarEventsQuery,
  ZaloMiniAppCalendarEventsResponse,
} from "@/features/calendar/types/calendar";

export const zaloMiniAppCalendarService = {
  getEvents(
    query: ZaloMiniAppCalendarEventsQuery,
    accessToken: string
  ): Promise<ZaloMiniAppCalendarEventsResponse> {
    const params = new URLSearchParams();
    if (query.branchId) params.set("branchId", query.branchId);
    if (query.artistProfileId) params.set("artistProfileId", query.artistProfileId);
    params.set("startDate", query.startDate);
    params.set("endDate", query.endDate);

    return requestJson<ZaloMiniAppCalendarEventsResponse>(`/api/v1/makeup/events?${params.toString()}`, {
      accessToken,
    });
  },

  getArtists(
    branchId: string | null,
    accessToken: string
  ): Promise<ZaloMiniAppCalendarArtistsResponse> {
    const params = new URLSearchParams();
    if (branchId) params.set("branchId", branchId);
    return requestJson<ZaloMiniAppCalendarArtistsResponse>(`/api/v1/makeup/artists?${params.toString()}`, {
      accessToken,
    });
  },
};
