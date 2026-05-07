import { SupabaseClient } from "@supabase/supabase-js";
import { SalesProfitOrderItemRow } from "../interfaces";

export async function fetchSalesProfitOrderItems(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<SalesProfitOrderItemRow[]> {
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from("rental_order_items")
    .select("rent_price, cogs_snapshot_amount")
    .in("order_id", orderIds)
    .returns<SalesProfitOrderItemRow[]>();

  if (error) throw error;
  return data ?? [];
}