"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseAuthHeaders, getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  clearStoredAuthTokens,
  persistAuthTokens,
  readStoredAccessToken,
  readStoredRefreshToken,
} from "@/lib/supabase/tokenStorage";
import { EMAIL_SENDER_DISABLED_MESSAGE, enabledEmailSender } from "@/lib/config/emailSender";
import type { AuthProfileContext, ProfileBranchAccess, ShowroomProfile } from "@/types/showroomAuth";
import { normalizeShowroomRole } from "@/features/auth/utils/permissions";
import { normalizeAppLocale } from "@/utils/locale";

type SignInPayload =
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

type SignUpPayload = {
  email: string;
  password: string;
  metadata?: Record<string, string>;
  emailRedirectTo?: string;
};

type GoogleSignInPayload = {
  redirectTo?: string;
};

type PasswordResetPayload = {
  email: string;
  redirectTo?: string;
};

type PasswordUpdatePayload = {
  password: string;
};

type ExchangeCodePayload = {
  code: string;
};

type SetSessionPayload = {
  accessToken: string;
  refreshToken: string;
};

type AuthContextApiProfile = {
  id?: string;
  auth_user_id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  branch_id?: string | null;
  default_branch_id?: string | null;
  locale?: string | null;
  active?: boolean;
};

type AuthContextApiBranchAccess = {
  branch_id?: string;
  is_default?: boolean;
  branch_name?: string | null;
  branch_domain?: string | null;
  shop_domain?: string | null;
};

type AuthContextApiResponse = {
  user?: unknown;
  profile?: AuthContextApiProfile | null;
  branch_access?: AuthContextApiBranchAccess[];
  warning?: string | null;
  error?: string;
};

type AuthSignInApiResponse = {
  session?: Session | null;
  user?: unknown;
  error?: string;
};

function isSupabaseUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && typeof (value as { id?: unknown }).id === "string";
}

function getOptionalBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return getSupabaseBrowserClient();
}

function requireSupabaseBrowserClient(): SupabaseClient {
  const client = getOptionalBrowserClient();
  if (client) return client;
  throw new Error(
    "Supabase browser auth client is unavailable. This flow still requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

function storeSessionTokens(session: Session | null | undefined): void {
  const accessToken = session?.access_token?.trim();
  const refreshToken = session?.refresh_token?.trim();
  if (!accessToken || !refreshToken) return;
  persistAuthTokens({ accessToken, refreshToken });
}

function normalizeProfileLocale(locale: string | null | undefined): "vi" | "en" | null {
  return normalizeAppLocale(locale);
}

function mapApiProfile(profile: AuthContextApiProfile | null | undefined): ShowroomProfile | null {
  if (!profile?.id) return null;
  const defaultBranchId = profile.default_branch_id ?? profile.branch_id ?? null;
  return {
    id: profile.id,
    authUserId: profile.auth_user_id ?? profile.id,
    fullName: profile.full_name ?? null,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    role: normalizeShowroomRole(profile.role),
    defaultBranchId,
    branchId: profile.branch_id ?? defaultBranchId,
    locale: normalizeProfileLocale(profile.locale),
    isActive: profile.active ?? true,
  };
}

function mapApiBranchAccess(branchAccess: AuthContextApiBranchAccess[] | null | undefined): ProfileBranchAccess[] {
  if (!Array.isArray(branchAccess)) return [];
  return branchAccess
    .filter(
      (
        item
      ): item is {
        branch_id: string;
        is_default?: boolean;
        branch_name?: string | null;
        branch_domain?: string | null;
        shop_domain?: string | null;
      } =>
        typeof item?.branch_id === "string"
    )
    .map((item) => ({
      branchId: item.branch_id,
      branchName: typeof item.branch_name === "string" ? item.branch_name.trim() || null : null,
      branchDomain:
        typeof item.branch_domain === "string" ? item.branch_domain.trim() || null : null,
      shopDomain:
        typeof item.shop_domain === "string" ? item.shop_domain.trim() || null : null,
      isDefault: Boolean(item.is_default),
    }));
}

async function syncSupabaseBrowserSession(session: Session): Promise<void> {
  const browserClient = getOptionalBrowserClient();
  if (!browserClient) return;

  await browserClient.auth
    .setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    .catch(() => undefined);
}

export const authBrowserService = {
  async getCurrentSession(): Promise<Session | null> {
    const browserClient = getOptionalBrowserClient();
    if (browserClient) {
      const { data, error } = await browserClient.auth.getSession();
      if (error) throw error;
      storeSessionTokens(data.session);
      return data.session ?? null;
    }

    const headers = await getSupabaseAuthHeaders();
    if (!headers.Authorization) {
      return null;
    }

    const response = await fetch(buildNestApiUrl("/api/v1/auth/user"), {
      method: "GET",
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as AuthContextApiResponse;
    if (response.status === 401) {
      clearStoredAuthTokens();
      return null;
    }
    if (!response.ok || !isSupabaseUser(payload.user)) {
      return null;
    }

    const accessToken = readStoredAccessToken();
    if (!accessToken) {
      return null;
    }

    return {
      access_token: accessToken,
      refresh_token: readStoredRefreshToken() ?? "",
      token_type: "bearer",
      expires_in: 0,
      expires_at: undefined,
      user: payload.user,
    };
  },

  async getCurrentAuthContext(): Promise<AuthProfileContext> {
    const headers = await getSupabaseAuthHeaders();
    const response = await fetch(buildNestApiUrl("/api/v1/auth/user"), {
      method: "GET",
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as AuthContextApiResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load auth profile context");
    }

    return {
      profile: mapApiProfile(payload.profile ?? null),
      branchAccess: mapApiBranchAccess(payload.branch_access ?? []),
    };
  },

  subscribeToAuthChanges(onChange: (event: AuthChangeEvent, session: Session | null) => void) {
    const browserClient = getOptionalBrowserClient();
    if (!browserClient) {
      return () => undefined;
    }

    const { data } = browserClient.auth.onAuthStateChange((event, session) => onChange(event, session));
    return () => data.subscription.unsubscribe();
  },

  async signInWithPassword(payload: SignInPayload) {
    const response = await fetch(buildNestApiUrl("/api/v1/auth/sign-in"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const apiPayload = (await response.json().catch(() => ({}))) as AuthSignInApiResponse;
    if (!response.ok || !apiPayload.session || !isSupabaseUser(apiPayload.user)) {
      throw new Error(apiPayload.error ?? "Sign-in failed");
    }

    storeSessionTokens(apiPayload.session);
    await syncSupabaseBrowserSession(apiPayload.session);

    return {
      session: apiPayload.session,
      user: apiPayload.user,
    };
  },

  async signUpWithPassword(payload: SignUpPayload) {
    if (!enabledEmailSender) {
      throw new Error(EMAIL_SENDER_DISABLED_MESSAGE);
    }

    const response = await fetch(buildNestApiUrl("/api/v1/auth/sign-up"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });

    const apiPayload = (await response.json().catch(() => ({}))) as AuthSignInApiResponse;
    if (!response.ok) {
      throw new Error(apiPayload.error ?? "Sign-up failed");
    }

    if (apiPayload.session) {
      storeSessionTokens(apiPayload.session);
      await syncSupabaseBrowserSession(apiPayload.session);
    }

    return {
      session: apiPayload.session ?? null,
      user: isSupabaseUser(apiPayload.user) ? apiPayload.user : null,
    };
  },

  async signInWithGoogle(payload: GoogleSignInPayload) {
    const supabase = requireSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: payload.redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
    return data;
  },

  async requestPasswordReset(payload: PasswordResetPayload) {
    if (!enabledEmailSender) {
      throw new Error(EMAIL_SENDER_DISABLED_MESSAGE);
    }

    const supabase = requireSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      payload.email,
      payload.redirectTo ? { redirectTo: payload.redirectTo } : undefined
    );
    if (error) throw error;
    return true;
  },

  async confirmPasswordReset(payload: PasswordUpdatePayload) {
    const supabase = requireSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: payload.password });
    if (error) throw error;
    return true;
  },

  async signOut() {
    const headers = await getSupabaseAuthHeaders();

    if (headers.Authorization) {
      await fetch(buildNestApiUrl("/api/v1/auth/sign-out"), {
        method: "POST",
        headers,
        credentials: "same-origin",
        cache: "no-store",
      }).catch(() => undefined);
    }

    clearStoredAuthTokens();

    const browserClient = getOptionalBrowserClient();
    if (browserClient) {
      await browserClient.auth.signOut().catch(() => undefined);
    }

    return true;
  },

  async exchangeCodeForSession(payload: ExchangeCodePayload) {
    const supabase = requireSupabaseBrowserClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(payload.code);
    if (error) throw error;
    storeSessionTokens(data.session);
    return data;
  },

  async setSessionFromTokens(payload: SetSessionPayload) {
    const supabase = requireSupabaseBrowserClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken,
    });
    if (error) throw error;
    storeSessionTokens(data.session);
    return data;
  },
};
