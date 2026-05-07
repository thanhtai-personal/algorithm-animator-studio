import { SupabaseClient } from "@supabase/supabase-js";
import { RevenueOrderRow } from "../interfaces";

export async function fetchRevenueOrdersByIds(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    orderIds: string[];
  },
): Promise<RevenueOrderRow[]> {
  if (options.orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from("rental_orders")
    .select("id, order_type, total_amount")
    .in("id", options.orderIds)
    .eq("branch_id", options.branchId)
    .returns<RevenueOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}