import type { SupabaseClient } from "@supabase/supabase-js";

export type UserSecuritySettings = {
  screen_lock_enabled?: boolean;
  screen_lock_method?: string | null;
  screen_lock_pin_hash?: string | null;
};

export async function getUserSecuritySettings(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("user_security_settings")
    .select("screen_lock_enabled,screen_lock_method,screen_lock_pin_hash")
    .eq("user_id", userId)
    .single();
}

export async function upsertUserSecuritySettings(
  supabase: SupabaseClient,
  userId: string,
  payload: UserSecuritySettings,
) {
  return supabase
    .from("user_security_settings")
    .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" })
    .select("screen_lock_enabled,screen_lock_method,screen_lock_pin_hash")
    .single();
}
