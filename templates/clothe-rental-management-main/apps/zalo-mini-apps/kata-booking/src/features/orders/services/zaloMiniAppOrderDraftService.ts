import { requestJson } from "@/lib/httpClient";
import type {
  ZaloMiniAppCreateOrderDraftPayload,
  ZaloMiniAppOrderDraftDto,
} from "@/lib/contracts";

interface CreateOrderDraftResponse {
  draft: ZaloMiniAppOrderDraftDto;
}

interface GetOrderDraftResponse {
  draft: ZaloMiniAppOrderDraftDto;
}

export const zaloMiniAppOrderDraftService = {
  createDraft(
    payload: Omit<ZaloMiniAppCreateOrderDraftPayload, "branchId">,
    sessionToken: string
  ): Promise<CreateOrderDraftResponse> {
    return requestJson<CreateOrderDraftResponse>("/api/v1/orders/drafts", {
      method: "POST",
      body: payload,
      sessionToken,
    });
  },

  getDraft(draftId: string, sessionToken: string): Promise<GetOrderDraftResponse> {
    const query = new URLSearchParams({ draftId });
    return requestJson<GetOrderDraftResponse>(`/api/v1/orders/drafts?${query.toString()}`, {
      sessionToken,
    });
  },
};
