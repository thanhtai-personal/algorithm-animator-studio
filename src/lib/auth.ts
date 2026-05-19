const ACCESS_TOKEN_STORAGE_KEY = "auth:accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "auth:refreshToken";

export type AuthProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
};

type AuthSession = {
  access_token?: string;
  refresh_token?: string;
};

type SignInResponse = {
  session?: AuthSession | null;
  access_token?: string;
  refresh_token?: string;
  error?: string;
};

type RefreshResponse = SignInResponse;

type UserContextResponse = {
  profile?: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  error?: string;
};

function sanitize(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveApiBaseUrl(): string {
  const fromEnv = sanitize(import.meta.env.VITE_NEST_API_BASE_URL);
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return import.meta.env.API_BASE_URL;
}

export function buildApiUrl(path: string): string {
  return `${resolveApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function persistTokens(session: AuthSession): void {
  const accessToken = sanitize(session.access_token);
  const refreshToken = sanitize(session.refresh_token);

  if (accessToken) localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function readAccessToken(): string | null {
  return sanitize(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY));
}

function readRefreshToken(): string | null {
  return sanitize(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY));
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function normalizeRole(role: string | null | undefined): string | null {
  const normalized = sanitize(role)?.toLowerCase() ?? null;
  if (normalized === "admin") return "owner_admin";
  return normalized;
}

export function isSuperAdminProfile(profile: AuthProfile | null): boolean {
  return normalizeRole(profile?.role) === "owner_admin";
}

export async function signInWithPassword(payload: {
  email: string;
  password: string;
}): Promise<AuthProfile> {
  const response = await fetch(buildApiUrl("/api/v1/auth/sign-in"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as SignInResponse;
  const session = normalizeSession(data);
  if (!response.ok || !session.access_token) {
    throw new Error(data.error ?? "Login failed");
  }

  persistTokens(session);
  return getCurrentProfile();
}

async function refreshAuthSession(): Promise<string | null> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(buildApiUrl("/api/v1/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ refreshToken, refresh_token: refreshToken }),
  });

  const data = (await response.json().catch(() => ({}))) as RefreshResponse;
  const session = normalizeSession(data);
  if (!response.ok || !session.access_token) return null;

  persistTokens(session);
  return sanitize(session.access_token);
}

export async function getCurrentProfile(): Promise<AuthProfile> {
  let accessToken = readAccessToken();
  if (!accessToken) accessToken = await refreshAuthSession();
  if (!accessToken) throw new Error("Unauthorized");

  let response = await fetchProfile(accessToken);
  if (response.status === 401) {
    accessToken = await refreshAuthSession();
    if (accessToken) response = await fetchProfile(accessToken);
  }

  const data = (await response.json().catch(() => ({}))) as UserContextResponse;
  if (!response.ok || !data.profile?.id) {
    if (response.status === 401) clearAuthTokens();
    throw new Error(data.error ?? "Failed to load user profile");
  }

  return {
    id: data.profile.id,
    fullName: data.profile.full_name ?? null,
    email: data.profile.email ?? null,
    role: normalizeRole(data.profile.role),
  };
}

function normalizeSession(data: SignInResponse): AuthSession {
  return {
    access_token: data.session?.access_token ?? data.access_token,
    refresh_token: data.session?.refresh_token ?? data.refresh_token,
  };
}

function fetchProfile(accessToken: string) {
  return fetch(buildApiUrl("/api/v1/auth/user"), {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "same-origin",
    cache: "no-store",
  });
}

export async function signOut(): Promise<void> {
  const accessToken = readAccessToken();
  if (accessToken) {
    await fetch(buildApiUrl("/api/v1/auth/sign-out"), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => undefined);
  }
  clearAuthTokens();
}
