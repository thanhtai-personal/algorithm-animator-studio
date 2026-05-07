import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchLaundryItemsCount(
  supabase: SupabaseClient,
  branchId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId)
    .eq("status", "LAUNDRY");

  if (error) throw error;
  return count ?? 0;
}