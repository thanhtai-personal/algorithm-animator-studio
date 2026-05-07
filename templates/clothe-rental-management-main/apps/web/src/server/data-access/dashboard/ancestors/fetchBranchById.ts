import { SupabaseClient } from "@supabase/supabase-js";
import { BranchRow } from "../interfaces";


export async function fetchBranchById(
  supabase: SupabaseClient,
  branchId: string,
): Promise<BranchRow | null> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, timezone, currency_code")
    .eq("id", branchId)
    .maybeSingle<BranchRow>();

  if (error) throw error;
  return data ?? null;
}