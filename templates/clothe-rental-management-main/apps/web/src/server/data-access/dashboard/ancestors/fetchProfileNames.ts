import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileNameRow } from "../interfaces";

export async function fetchProfileNames(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, ProfileNameRow>> {
  if (profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds)
    .returns<ProfileNameRow[]>();

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id, row]));
}