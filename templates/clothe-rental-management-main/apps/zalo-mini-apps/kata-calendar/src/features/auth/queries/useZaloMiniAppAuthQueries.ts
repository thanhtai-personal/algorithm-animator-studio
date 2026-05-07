import { useMutation, useQuery } from "@tanstack/react-query";
import { zaloMiniAppAuthApiService } from "@/features/auth/services/zaloMiniAppAuthApiService";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";

type SignInWithPasswordPayload =
  | {
      email: string;
      password: string;
      phone?: never;
    }
  | {
      phone: string;
      password: string;
      email?: never;
    };

export const zaloMiniAppAuthQueryKeys = {
  all: ["zalo-mini-app-auth"] as const,
  authContext: (accessToken: string | null) =>
    [...zaloMiniAppAuthQueryKeys.all, "auth-context", accessToken ?? ""] as const,
};

export function useSignInWithPasswordMutation() {
  return useMutation({
    mutationFn: (payload: SignInWithPasswordPayload) => zaloMiniAppAuthApiService.signIn(payload),
    onSuccess: (session) => {
      zaloMiniAppAuthStore.setSession(session);
    },
  });
}

export function useMiniAppAuthContextQuery(accessToken: string | null) {
  return useQuery({
    queryKey: zaloMiniAppAuthQueryKeys.authContext(accessToken),
    enabled: Boolean(accessToken),
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Missing access token.");
      }

      return zaloMiniAppAuthApiService.fetchAuthContext(accessToken);
    },
    retry: false,
    staleTime: 30_000,
  });
}
