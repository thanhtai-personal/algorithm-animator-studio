import {
  usePasswordSignInMutation,
  useRefreshSessionMutation,
  useSignOutMutation,
} from "@/features/auth/queries/useZaloMiniAppAuthQueries";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";

function normalizeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useZaloMiniAppAuth() {
  const signInMutation = usePasswordSignInMutation();
  const refreshMutation = useRefreshSessionMutation();
  const signOutMutation = useSignOutMutation();

  const login = async (email: string, password: string) => {
    zaloMiniAppAuthStore.clearError();

    try {
      await signInMutation.mutateAsync({
        email: email.trim(),
        password,
      });
    } catch (error) {
      const message = normalizeErrorMessage(error, "Đăng nhập thất bại");
      zaloMiniAppAuthStore.setErrorMessage(message);
      throw error;
    }
  };

  const logout = async () => {
    zaloMiniAppAuthStore.clearError();

    const accessToken = zaloMiniAppAuthStore.accessToken;
    if (!accessToken) {
      zaloMiniAppAuthStore.setSession(null);
      return;
    }

    try {
      await signOutMutation.mutateAsync(accessToken);
    } catch {
      zaloMiniAppAuthStore.setSession(null);
    }
  };

  const refreshSession = async () => {
    const refreshToken = zaloMiniAppAuthStore.refreshToken;
    if (!refreshToken) return;

    try {
      await refreshMutation.mutateAsync(refreshToken);
      zaloMiniAppAuthStore.clearError();
    } catch (error) {
      zaloMiniAppAuthStore.setSession(null);
      const message = normalizeErrorMessage(error, "Phiên đăng nhập đã hết hạn");
      zaloMiniAppAuthStore.setErrorMessage(message);
      throw error;
    }
  };

  return {
    isAuthenticated: zaloMiniAppAuthStore.isAuthenticated,
    accessToken: zaloMiniAppAuthStore.accessToken,
    login,
    logout,
    refreshSession,
    isLoading:
      signInMutation.isPending || refreshMutation.isPending || signOutMutation.isPending,
    errorMessage: zaloMiniAppAuthStore.errorMessage,
    clearError: () => zaloMiniAppAuthStore.clearError(),
  };
}
