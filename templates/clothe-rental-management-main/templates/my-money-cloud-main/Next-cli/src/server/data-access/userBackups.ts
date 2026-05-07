import type { SupabaseClient } from "@supabase/supabase-js";

export type UserBackupPayload = {
  device?: string | null;
  data: Record<string, unknown>;
};

export async function createUserBackup(
  supabase: SupabaseClient,
  userId: string,
  payload: UserBackupPayload,
) {
  return supabase
    .from("user_backups")
    .insert({
      user_id: userId,
      device: payload.device ?? null,
      data: payload.data,
    })
    .select()
    .single();
}
