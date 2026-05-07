import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ZaloMiniAppDraftItemInput } from "@/lib/contracts";
import { zaloMiniAppOrderDraftService } from "@/features/orders/services/zaloMiniAppOrderDraftService";
import { zaloMiniAppOrderStore } from "@/features/orders/stores/zaloMiniAppOrderStore";

export const zaloOrderDraftQueryKeys = {
  all: ["zalo-order-draft"] as const,
  detail: (draftId: string | null) => [...zaloOrderDraftQueryKeys.all, draftId ?? ""] as const,
};

export function useCreateOrderDraftMutation(sessionToken: string | null) {
  return useMutation({
    mutationFn: (payload: {
      items: ZaloMiniAppDraftItemInput[];
      note?: string;
      discountAmount?: number;
      surchargeAmount?: number;
    }) => {
      if (!sessionToken) throw new Error("Missing mini app session");
      return zaloMiniAppOrderDraftService.createDraft(payload, sessionToken);
    },
    onSuccess: (response) => {
      zaloMiniAppOrderStore.hydrateDraft(response.draft);
    },
  });
}

export function useOrderDraftDetailQuery(draftId: string | null, sessionToken: string | null) {
  const query = useQuery({
    queryKey: zaloOrderDraftQueryKeys.detail(draftId),
    enabled: Boolean(draftId && sessionToken),
    queryFn: async () => {
      if (!draftId || !sessionToken) throw new Error("Missing draftId/sessionToken");
      return zaloMiniAppOrderDraftService.getDraft(draftId, sessionToken);
    },
  });

  useEffect(() => {
    if (!query.data?.draft) return;
    zaloMiniAppOrderStore.hydrateDraft(query.data.draft);
  }, [query.data]);

  return query;
}
