import storageAdapter from "@/lib/storageAdapter";

const ACCESS_TOKEN_STORAGE_KEY = "auth:accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "auth:refreshToken";

function sanitizeToken(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readStoredAccessToken(): string | null {
  return sanitizeToken(storageAdapter.getItem(ACCESS_TOKEN_STORAGE_KEY));
}

export function readStoredRefreshToken(): string | null {
  return sanitizeToken(storageAdapter.getItem(REFRESH_TOKEN_STORAGE_KEY));
}

export function persistAuthTokens(payload: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): void {
  const accessToken = sanitizeToken(payload.accessToken);
  const refreshToken = sanitizeToken(payload.refreshToken);

  if (accessToken) {
    storageAdapter.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  } else {
    storageAdapter.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  if (refreshToken) {
    storageAdapter.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } else {
    storageAdapter.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

export function clearStoredAuthTokens(): void {
  storageAdapter.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  storageAdapter.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}
