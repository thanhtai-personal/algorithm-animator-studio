import Constants from "expo-constants";

function getExtraValue(key: string): string | undefined {
  const expoConfig = (Constants as any).expoConfig ?? (Constants as any).manifest;
  return expoConfig?.extra?.[key];
}

function joinUrl(base: string, path: string) {
  if (!base) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

export function getApiBaseUrl(): string | null {
  return (
    getExtraValue("API_BASE_URL") ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    null
  );
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? joinUrl(base, path) : path;
}

export function apiFetch(input: string, init?: RequestInit) {
  return fetch(buildApiUrl(input), init);
}
