import Constants from "expo-constants";

const expoConfig = (Constants as any).expoConfig ?? (Constants as any).manifest;
const extra = expoConfig?.extra ?? {};

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  extra.SUPABASE_URL;
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  extra.SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SUPABASE_SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ?? process.env.SITE_URL;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function resolveSiteUrl(fallback?: string | null): string | null {
  if (SUPABASE_SITE_URL) return SUPABASE_SITE_URL;
  if (fallback) return fallback;
  return null;
}
