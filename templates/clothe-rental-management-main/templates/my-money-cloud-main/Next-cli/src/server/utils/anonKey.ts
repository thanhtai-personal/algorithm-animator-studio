import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

export function readAnonKey(request: Request): string | null {
  const headerKey =
    request.headers.get("x-anon-key") ?? request.headers.get("X-Anon-Key") ?? null;
  if (headerKey) return headerKey;
  const url = new URL(request.url);
  return url.searchParams.get("anonKey");
}

export function createServiceRoleClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
