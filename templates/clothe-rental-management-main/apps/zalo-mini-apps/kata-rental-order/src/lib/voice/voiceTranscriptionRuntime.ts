export function resolveApiBaseUrl(): string {
  const fromNestEnv = import.meta.env.VITE_NEST_API_BASE_URL as string | undefined;
  return fromNestEnv?.trim() || "http://localhost:3056";
}
