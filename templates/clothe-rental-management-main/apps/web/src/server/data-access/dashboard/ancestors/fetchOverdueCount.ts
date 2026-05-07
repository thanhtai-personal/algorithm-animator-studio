import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchOverdueCount(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    today: string;
  },
): Promise<number> {
  const { count, error } = await supabase
    .from("rental_orders")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", options.branchId)
    .lt("end_date", options.today)
    .eq("status", "PICKED_UP");

  if (error) throw error;
  return count ?? 0;
}