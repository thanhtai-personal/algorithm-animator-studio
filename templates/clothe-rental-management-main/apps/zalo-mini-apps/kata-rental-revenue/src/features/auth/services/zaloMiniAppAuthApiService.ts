import { requestJson } from "@/lib/httpClient";

export interface MiniAppAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
}

export interface MiniAppAuthSignInPayload {
  email: string;
  password: string;
}

interface AuthApiSession {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number | null;
}

interface AuthApiSessionResponse {
  session?: AuthApiSession | null;
  error?: string;
}

function mapAuthSession(payload: AuthApiSessionResponse): MiniAppAuthSession {
  const session = payload.session;
  if (!session?.access_token || !session.refresh_token) {
    throw new Error(payload.error ?? "Không lấy được phiên đăng nhập");
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt:
      typeof session.expires_at === "number" && Number.isFinite(session.expires_at)
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
  };
}

export const zaloMiniAppAuthApiService = {
  async signInWithPassword(payload: MiniAppAuthSignInPayload): Promise<MiniAppAuthSession> {
    const response = await requestJson<AuthApiSessionResponse>("/api/v1/auth/sign-in", {
      method: "POST",
      body: payload,
    });
    return mapAuthSession(response);
  },

  async refreshSession(refreshToken: string): Promise<MiniAppAuthSession> {
    const response = await requestJson<AuthApiSessionResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body: {
        refresh_token: refreshToken,
      },
    });
    return mapAuthSession(response);
  },

  async signOut(accessToken: string): Promise<void> {
    await requestJson<{ success: boolean }>("/api/v1/auth/sign-out", {
      method: "POST",
      authorizationToken: accessToken,
    });
  },
};
