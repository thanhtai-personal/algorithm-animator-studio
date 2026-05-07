"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import {
  clearStoredAuthTokens,
  persistAuthTokens,
  readStoredAccessToken,
  readStoredRefreshToken,
} from "@/lib/supabase/tokenStorage";

let browserClient: SupabaseClient | null = null;

type RefreshApiResponse = {
  session?: {
    access_token?: string;
    refresh_token?: string;
  } | null;
};

function decodeJwtPayload(token: string): { exp?: number } | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    if (typeof atob === "function") {
      return JSON.parse(atob(padded)) as { exp?: number };
    }
  } catch {
    return null;
  }

  return null;
}

function isTokenNearExpiry(token: string, safetyWindowInSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + safetyWindowInSeconds;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const response = await fetch(buildNestApiUrl("/api/v1/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const payload = (await response.json().catch(() => ({}))) as RefreshApiResponse;
  const accessToken = payload.session?.access_token?.trim();
  const nextRefreshToken = payload.session?.refresh_token?.trim();

  if (!response.ok || !accessToken) {
    clearStoredAuthTokens();
    return null;
  }

  persistAuthTokens({
    accessToken,
    refreshToken: nextRefreshToken ?? refreshToken,
  });
  return accessToken;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase config missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return browserClient;
}

export function createSupabaseAuthedClient(token: string): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase config missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const storedAccessToken = readStoredAccessToken();
  if (storedAccessToken && !isTokenNearExpiry(storedAccessToken)) {
    return storedAccessToken;
  }

  const storedRefreshToken = readStoredRefreshToken();
  if (storedRefreshToken) {
    const refreshedAccessToken = await refreshAccessToken(storedRefreshToken);
    if (refreshedAccessToken) {
      return refreshedAccessToken;
    }
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token ?? null;
  const refreshToken = data.session?.refresh_token ?? null;

  if (accessToken && refreshToken) {
    persistAuthTokens({ accessToken, refreshToken });
  }

  return accessToken;
}

export async function getSupabaseAuthHeaders(): Promise<Record<string, string>> {
  const token = await getSupabaseAccessToken().catch(() => null);

  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  return {};
}
