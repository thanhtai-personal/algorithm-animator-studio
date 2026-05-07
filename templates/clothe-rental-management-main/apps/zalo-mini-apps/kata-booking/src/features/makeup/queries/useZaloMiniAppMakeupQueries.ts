import { useMutation, useQuery } from "@tanstack/react-query";
import { zaloMiniAppMakeupService } from "@/features/makeup/services/zaloMiniAppMakeupService";
import type {
  ZaloMiniAppMakeupArtistsResponse,
  ZaloMiniAppCreateMakeupEventPayload,
  ZaloMiniAppParseBookingInputPayload,
} from "@/features/makeup/types/makeup";
import { zaloMiniAppMakeupStore } from "@/features/makeup/stores/zaloMiniAppMakeupStore";

const zaloMiniAppMakeupQueryKeys = {
  artists: (branchId: string | null | undefined) =>
    ["zalo-mini-app", "makeup", "artists", branchId ?? ""] as const,
};

export function useZaloMiniAppMakeupArtistsQuery(
  branchId?: string | null
) {
  return useQuery<ZaloMiniAppMakeupArtistsResponse>({
    queryKey: zaloMiniAppMakeupQueryKeys.artists(branchId),
    queryFn: () => zaloMiniAppMakeupService.fetchPublicArtists(branchId),
    staleTime: 30_000,
  });
}

export function useParseMakeupBookingInputMutation() {
  return useMutation({
    mutationFn: (payload: ZaloMiniAppParseBookingInputPayload) =>
      zaloMiniAppMakeupService.parseBookingInput(payload),
  });
}

export function useCreatePublicMakeupBookingMutation() {
  return useMutation({
    mutationFn: (payload: ZaloMiniAppCreateMakeupEventPayload) =>
      zaloMiniAppMakeupService.createPublicBooking(payload),
    onSuccess: (response) => {
      zaloMiniAppMakeupStore.hydrateCreatedEvent(response.event);
    },
  });
}
