import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileActorRow } from "../interfaces";

export async function fetchActorProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, default_branch_id")
    .eq("id", profileId)
    .eq("is_active", true)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  return data ?? null;
}