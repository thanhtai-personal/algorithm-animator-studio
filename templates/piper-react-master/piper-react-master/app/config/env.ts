const DEFAULT_CLIENT_ORIGIN = "http://localhost:6868";
const DEFAULT_API_URL = "http://localhost:8888";

function normalizeLocalUrl(value: string | undefined, legacyValues: string[], fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed || legacyValues.includes(trimmed)) {
    return fallback;
  }

  return trimmed;
}

export const CLIENT_ORIGIN = normalizeLocalUrl(
  import.meta.env.VITE_CLIENT_ORIGIN,
  ["http://localhost:5173", "http://localhost:6666", "http://localhost:6677"],
  DEFAULT_CLIENT_ORIGIN
);
export const API_URL = normalizeLocalUrl(
  import.meta.env.VITE_API_URL,
  ["http://localhost:5050"],
  DEFAULT_API_URL
);
