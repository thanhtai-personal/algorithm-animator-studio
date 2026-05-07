import { SupabaseClient } from "@supabase/supabase-js";
import { DUE_TODAY_STATUSES } from "../constants";

export async function fetchDueTodayCount(
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
    .eq("end_date", options.today)
    .in("status", DUE_TODAY_STATUSES);

  if (error) throw error;
  return count ?? 0;
}