import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchReservedPickupTodayCount(
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
    .eq("status", "RESERVED")
    .eq("start_date", options.today);

  if (error) throw error;
  return count ?? 0;
}
