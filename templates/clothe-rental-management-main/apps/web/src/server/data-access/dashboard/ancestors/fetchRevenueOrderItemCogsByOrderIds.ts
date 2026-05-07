import { SupabaseClient } from "@supabase/supabase-js";
import { RevenueOrderItemCogsRow } from "../interfaces";

export async function fetchRevenueOrderItemCogsByOrderIds(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<RevenueOrderItemCogsRow[]> {
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from("rental_order_items")
    .select("order_id, cogs_snapshot_amount")
    .in("order_id", orderIds)
    .returns<RevenueOrderItemCogsRow[]>();

  if (error) throw error;
  return data ?? [];
}