import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchSoldItemsTotalCount(
  supabase: SupabaseClient,
  branchId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId)
    .eq("status", "SOLD");

  if (error) throw error;
  return count ?? 0;
}