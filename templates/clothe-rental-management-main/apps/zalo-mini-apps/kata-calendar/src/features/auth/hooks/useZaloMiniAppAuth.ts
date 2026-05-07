import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/httpClient";
import { zaloMiniAppAuthApiService } from "@/features/auth/services/zaloMiniAppAuthApiService";
import {
  zaloMiniAppAuthQueryKeys,
  useMiniAppAuthContextQuery,
  useSignInWithPasswordMutation,
} from "@/features/auth/queries/useZaloMiniAppAuthQueries";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";

const ALLOWED_CALENDAR_ROLE_SET = new Set(["owner_admin", "manager", "makeup_artist"]);

type SignInMethod = "email" | "phone";

function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapRoleLabel(role: string | null): string {
  if (role === "makeup_artist") return "Chuyên viên makeup";
  if (role === "owner_admin" || role === "manager") return "Admin";
  return role ?? "-";
}

function buildUserFacingError(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 401) {
    return "Sai thông tin đăng nhập hoặc tài khoản chưa được cấp quyền.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Đăng nhập thất bại.";
}

export function useZaloMiniAppAuth() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signInMutation = useSignInWithPasswordMutation();
  const authContextQuery = useMiniAppAuthContextQuery(zaloMiniAppAuthStore.accessToken);

  useEffect(() => {
    if (!authContextQuery.data) return;
    zaloMiniAppAuthStore.setAuthContext(authContextQuery.data);
  }, [authContextQuery.data]);

  useEffect(() => {
    if (!authContextQuery.error) return;

    if (authContextQuery.error instanceof ApiClientError && authContextQuery.error.status === 401) {
      zaloMiniAppAuthStore.logout();
      setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    const message =
      authContextQuery.error instanceof Error
        ? authContextQuery.error.message
        : "Không tải được thông tin tài khoản.";

    setErrorMessage(message);
  }, [authContextQuery.error]);

  const login = async (payload: {
    signInMethod: SignInMethod;
    identifier: string;
    password: string;
  }) => {
    setErrorMessage(null);

    const identifier = payload.identifier.trim();
    const password = payload.password;

    if (!identifier || !password.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }

    try {
      const session = await signInMutation.mutateAsync(
        payload.signInMethod === "phone"
          ? { phone: identifier, password }
          : { email: identifier, password }
      );

      const authContext = await queryClient.fetchQuery({
        queryKey: zaloMiniAppAuthQueryKeys.authContext(session.accessToken),
        queryFn: () => zaloMiniAppAuthApiService.fetchAuthContext(session.accessToken),
        staleTime: 30_000,
      });

      zaloMiniAppAuthStore.setAuthContext(authContext);
    } catch (error) {
      setErrorMessage(buildUserFacingError(error));
      throw error;
    }
  };

  const profile = zaloMiniAppAuthStore.authContext?.profile ?? null;
  const branchId = (() => {
    if (profile?.branchId) return profile.branchId;
    if (profile?.defaultBranchId) return profile.defaultBranchId;

    const defaultBranch = zaloMiniAppAuthStore.authContext?.branchAccess.find((item) => item.isDefault);
    if (defaultBranch?.branchId) return defaultBranch.branchId;

    return zaloMiniAppAuthStore.authContext?.branchAccess[0]?.branchId ?? null;
  })();

  const normalizedRole = sanitizeText(profile?.role)?.toLowerCase() ?? null;
  const hasCalendarAccess = normalizedRole ? ALLOWED_CALENDAR_ROLE_SET.has(normalizedRole) : false;
  const roleLabel = mapRoleLabel(normalizedRole);
  const displayName = profile?.fullName ?? profile?.email ?? profile?.phone ?? null;
  const isAuthContextLoading =
    zaloMiniAppAuthStore.isAuthenticated && authContextQuery.isFetching && !zaloMiniAppAuthStore.authContext;

  return {
    isAuthenticated: zaloMiniAppAuthStore.isAuthenticated,
    accessToken: zaloMiniAppAuthStore.accessToken,
    authContext: zaloMiniAppAuthStore.authContext,
    profileId: profile?.id ?? null,
    role: normalizedRole,
    branchId,
    hasCalendarAccess,
    roleLabel,
    displayName,
    login,
    logout: () => {
      setErrorMessage(null);
      zaloMiniAppAuthStore.logout();
      void queryClient.invalidateQueries({ queryKey: zaloMiniAppAuthQueryKeys.all });
    },
    isAuthContextLoading,
    isLoading: signInMutation.isPending || authContextQuery.isFetching,
    errorMessage,
  };
}
