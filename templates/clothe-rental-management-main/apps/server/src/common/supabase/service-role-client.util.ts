import { createClient } from '@supabase/supabase-js';

function resolveSupabaseUrl(): string | null {
  const value =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function resolveSupabaseServiceRoleKey(): string | null {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

export function createServiceRoleClient() {
  const supabaseUrl = resolveSupabaseUrl();
  const serviceRoleKey = resolveSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing service role config');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
