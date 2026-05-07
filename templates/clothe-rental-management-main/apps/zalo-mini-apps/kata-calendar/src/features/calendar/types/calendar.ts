import type {
  ZaloMiniAppMakeupArtistsResponse,
  ZaloMiniAppMakeupEventsResponse,
} from "@/lib/contracts";

export type ZaloMiniAppCalendarEventsResponse = ZaloMiniAppMakeupEventsResponse;
export type ZaloMiniAppCalendarArtistsResponse = ZaloMiniAppMakeupArtistsResponse;

export interface ZaloMiniAppCalendarEventsQuery {
  branchId?: string | null;
  startDate: string;
  endDate: string;
  artistProfileId?: string | null;
}
