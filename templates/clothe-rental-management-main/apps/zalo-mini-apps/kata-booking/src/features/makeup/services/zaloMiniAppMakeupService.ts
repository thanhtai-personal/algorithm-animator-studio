import { requestJson } from "@/lib/httpClient";
import type {
  ZaloMiniAppMakeupArtistsResponse,
  ZaloMiniAppCreateMakeupEventPayload,
  ZaloMiniAppMakeupEventMutationResponse,
  ZaloMiniAppParseBookingInputPayload,
  ZaloMiniAppParsedBookingDraft,
} from "@/features/makeup/types/makeup";

interface ParseBookingInputResponse {
  draft: ZaloMiniAppParsedBookingDraft;
}

export const zaloMiniAppMakeupService = {
  fetchPublicArtists(
    branchId?: string | null
  ): Promise<ZaloMiniAppMakeupArtistsResponse> {
    const params = new URLSearchParams();
    if (branchId && branchId.trim().length > 0) {
      params.set("branchId", branchId.trim());
    }

    const queryString = params.toString();
    const path = queryString
      ? `/api/v1/makeup/artists/public?${queryString}`
      : "/api/v1/makeup/artists/public";

    return requestJson<ZaloMiniAppMakeupArtistsResponse>(path, {
      method: "GET",
    });
  },

  async parseBookingInput(
    payload: ZaloMiniAppParseBookingInputPayload
  ): Promise<ZaloMiniAppParsedBookingDraft> {
    const response = await requestJson<ParseBookingInputResponse>("/api/v1/makeup/events/parse", {
      method: "POST",
      body: payload,
    });

    return response.draft;
  },

  createPublicBooking(
    payload: ZaloMiniAppCreateMakeupEventPayload
  ): Promise<ZaloMiniAppMakeupEventMutationResponse> {
    return requestJson<ZaloMiniAppMakeupEventMutationResponse>("/api/v1/makeup/events", {
      method: "POST",
      body: {
        ...payload,
        requestAsPublic: true,
      },
    });
  },
};
