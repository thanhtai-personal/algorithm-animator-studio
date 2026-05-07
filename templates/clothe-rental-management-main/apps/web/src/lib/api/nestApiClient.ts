const PROD_NEST_API_BASE_URL = "https://kata-center-api.vercel.app";
const DEV_NEST_API_BASE_URL = "http://localhost:3056";

function sanitizeBaseUrl(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

export function resolveNestApiClientBaseUrl(): string {
  const fromEnv = sanitizeBaseUrl(process.env.NEXT_PUBLIC_NEST_API_BASE_URL);
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    return PROD_NEST_API_BASE_URL;
  }

  return DEV_NEST_API_BASE_URL;
}

export function buildNestApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveNestApiClientBaseUrl()}${normalizedPath}`;
}
