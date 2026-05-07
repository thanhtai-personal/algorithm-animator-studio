import { SupabaseClient } from "@supabase/supabase-js";
import { fetchSalesProfitOrderItems } from "./fetchSalesProfitOrderItems";
import { fetchSalesProfitOrders } from "./fetchSalesProfitOrders";
import { roundMoney, parseNumeric } from "../utils";

export async function computeSalesProfitByRange(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    startIso: string;
    endExclusiveIso: string;
  },
): Promise<number> {
  const orders = await fetchSalesProfitOrders(supabase, {
    branchId: options.branchId,
    startIso: options.startIso,
    endExclusiveIso: options.endExclusiveIso,
  });

  if (orders.length === 0) return 0;

  const orderItems = await fetchSalesProfitOrderItems(
    supabase,
    orders.map((order) => order.id),
  );
  if (orderItems.length === 0) return 0;

  let salesAmount = 0;
  let soldCogsAmount = 0;
  for (const item of orderItems) {
    salesAmount = roundMoney(
      salesAmount + Math.max(0, parseNumeric(item.rent_price)),
    );
    soldCogsAmount = roundMoney(
      soldCogsAmount + Math.max(0, parseNumeric(item.cogs_snapshot_amount)),
    );
  }

  return roundMoney(salesAmount - soldCogsAmount);
}