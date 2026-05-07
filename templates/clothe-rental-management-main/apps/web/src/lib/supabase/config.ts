export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SUPABASE_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function resolveSiteUrl(fallback?: string | null): string | null {
  if (SUPABASE_SITE_URL) return SUPABASE_SITE_URL;
  if (fallback) return fallback;
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return null;
}
