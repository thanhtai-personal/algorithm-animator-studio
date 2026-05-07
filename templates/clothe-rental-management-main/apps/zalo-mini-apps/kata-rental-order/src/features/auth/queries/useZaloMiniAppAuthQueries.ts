import { useMutation } from "@tanstack/react-query";
import {
  zaloMiniAppAuthApiService,
  type MiniAppAuthSignInPayload,
} from "@/features/auth/services/zaloMiniAppAuthApiService";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";

export function usePasswordSignInMutation() {
  return useMutation({
    mutationFn: (payload: MiniAppAuthSignInPayload) =>
      zaloMiniAppAuthApiService.signInWithPassword(payload),
    onSuccess: (session) => {
      zaloMiniAppAuthStore.setSession(session);
    },
  });
}

export function useSignOutMutation() {
  return useMutation({
    mutationFn: (accessToken: string) => zaloMiniAppAuthApiService.signOut(accessToken),
    onSuccess: () => {
      zaloMiniAppAuthStore.setSession(null);
    },
  });
}

export function useRefreshSessionMutation() {
  return useMutation({
    mutationFn: (refreshToken: string) => zaloMiniAppAuthApiService.refreshSession(refreshToken),
    onSuccess: (session) => {
      zaloMiniAppAuthStore.setSession(session);
    },
  });
}
