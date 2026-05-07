import { SupabaseClient } from "@supabase/supabase-js";
import { SalesProfitOrderRow } from "../interfaces";


export async function fetchSalesProfitOrders(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    startIso: string;
    endExclusiveIso: string;
  },
): Promise<SalesProfitOrderRow[]> {
  const { data, error } = await supabase
    .from("rental_orders")
    .select("id")
    .eq("branch_id", options.branchId)
    .eq("order_type", "SALE")
    .in("status", ["CONFIRMED", "DEBT", "COMPLETED"])
    .gte("created_at", options.startIso)
    .lt("created_at", options.endExclusiveIso)
    .returns<SalesProfitOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}