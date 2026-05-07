import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAnonKeyForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ anonKey: string | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("anon_key")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { anonKey: null, error: new Error(error.message) };
  }

  return { anonKey: data?.anon_key ?? null, error: null };
}
