import { useState } from "react";
import { useCreateMiniAppSessionMutation } from "@/features/auth/queries/useZaloMiniAppAuthQueries";
import { useZaloAuthorizeMutation } from "@/features/platform/queries/useZaloPlatformQueries";
import { zaloSdkService } from "@/features/platform/services/zaloSdkService";
import { zaloPlatformStore } from "@/features/platform/stores/zaloPlatformStore";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";

export function useZaloMiniAppAuth() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const authorizeMutation = useZaloAuthorizeMutation();
  const createSessionMutation = useCreateMiniAppSessionMutation();

  const login = async () => {
    setErrorMessage(null);

    try {
      const auth = await authorizeMutation.mutateAsync();
      const userInfo = await zaloSdkService.getUserInfo();

      if (!userInfo?.id) {
        throw new Error("Khong lay duoc thong tin nguoi dung Zalo");
      }

      zaloPlatformStore.hydrateUserInfo(userInfo);

      await createSessionMutation.mutateAsync({
        zaloUserId: userInfo.id,
        displayName: userInfo.name ?? null,
        avatarUrl: userInfo.avatar ?? null,
        consentScopes: auth.scopes,
        zaloAccessToken: auth.accessToken,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dang nhap that bai";
      setErrorMessage(message);
      throw error;
    }
  };

  return {
    isAuthenticated: zaloMiniAppAuthStore.isAuthenticated,
    sessionToken: zaloMiniAppAuthStore.sessionToken,
    login,
    logout: () => zaloMiniAppAuthStore.setSession(null),
    isLoading: authorizeMutation.isPending || createSessionMutation.isPending,
    errorMessage,
  };
}
