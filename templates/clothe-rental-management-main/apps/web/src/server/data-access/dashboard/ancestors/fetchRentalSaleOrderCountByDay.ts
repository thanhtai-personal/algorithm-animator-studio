import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchRentalSaleOrderCountByDay(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    startIso: string;
    endExclusiveIso: string;
  },
): Promise<number> {
  const { count, error } = await supabase
    .from("rental_orders")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", options.branchId)
    .neq("status", "CANCELLED")
    .gte("created_at", options.startIso)
    .lt("created_at", options.endExclusiveIso);

  if (error) throw error;
  return count ?? 0;
}