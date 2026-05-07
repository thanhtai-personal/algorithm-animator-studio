import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserSettings(supabase: SupabaseClient, userId: string) {
  return supabase.from("user_settings").select("*").eq("user_id", userId).single();
}

export async function upsertUserSettings(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, any>,
) {
  return supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" })
    .select()
    .single();
}
