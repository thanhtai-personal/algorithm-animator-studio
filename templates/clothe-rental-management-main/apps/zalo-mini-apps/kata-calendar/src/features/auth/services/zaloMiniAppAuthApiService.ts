import { requestJson } from "@/lib/httpClient";
import type {
  ZaloMiniAppWebAuthBranchAccess,
  ZaloMiniAppWebAuthContext,
  ZaloMiniAppWebAuthProfile,
  ZaloMiniAppWebAuthSession,
} from "@/lib/contracts";

type WebSignInPayload =
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

type SignInApiResponse = {
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number | null;
  } | null;
  error?: string;
};

type AuthContextApiResponse = {
  profile?: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    branch_id?: string | null;
    default_branch_id?: string | null;
  } | null;
  branch_access?: Array<{
    branch_id?: string;
    branch_name?: string | null;
    is_default?: boolean;
  }> | null;
  error?: string;
};

function sanitizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapAuthProfile(
  profile: AuthContextApiResponse["profile"]
): ZaloMiniAppWebAuthProfile | null {
  if (!profile?.id || typeof profile.id !== "string") return null;

  return {
    id: profile.id,
    fullName: sanitizeText(profile.full_name),
    email: sanitizeText(profile.email),
    phone: sanitizeText(profile.phone),
    role: sanitizeText(profile.role),
    branchId: sanitizeText(profile.branch_id),
    defaultBranchId: sanitizeText(profile.default_branch_id),
  };
}

function mapBranchAccess(
  branchAccess: AuthContextApiResponse["branch_access"]
): ZaloMiniAppWebAuthBranchAccess[] {
  if (!Array.isArray(branchAccess)) return [];

  return branchAccess
    .filter((item): item is { branch_id: string; branch_name?: string | null; is_default?: boolean } => {
      return typeof item?.branch_id === "string" && item.branch_id.trim().length > 0;
    })
    .map((item) => ({
      branchId: item.branch_id,
      branchName: sanitizeText(item.branch_name),
      isDefault: Boolean(item.is_default),
    }));
}

export const zaloMiniAppAuthApiService = {
  async signIn(payload: WebSignInPayload): Promise<ZaloMiniAppWebAuthSession> {
    const response = await requestJson<SignInApiResponse>("/api/v1/auth/sign-in", {
      method: "POST",
      body: payload,
    });

    const accessToken = sanitizeText(response.session?.access_token);
    const refreshToken = sanitizeText(response.session?.refresh_token);

    if (!accessToken || !refreshToken) {
      throw new Error(response.error ?? "Đăng nhập thất bại.");
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: typeof response.session?.expires_at === "number" ? response.session.expires_at : null,
    };
  },

  async fetchAuthContext(accessToken: string): Promise<ZaloMiniAppWebAuthContext> {
    const response = await requestJson<AuthContextApiResponse>("/api/v1/auth/user", {
      accessToken,
    });

    return {
      profile: mapAuthProfile(response.profile),
      branchAccess: mapBranchAccess(response.branch_access),
    };
  },
};
