import { useMutation } from "@tanstack/react-query";
import { zaloMiniAppAuthApiService } from "@/features/auth/services/zaloMiniAppAuthApiService";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";
import type { ZaloMiniAppCreateSessionPayload } from "@/lib/contracts";

export function useCreateMiniAppSessionMutation() {
  return useMutation({
    mutationFn: (payload: ZaloMiniAppCreateSessionPayload) =>
      zaloMiniAppAuthApiService.createSession(payload),
    onSuccess: (session) => {
      zaloMiniAppAuthStore.setSession(session);
    },
  });
}
