import { SupabaseClient } from "@supabase/supabase-js";
import { summarizeOutstandingDebtByOrder } from "../../orderFinance";
import { fetchDebtOrders } from "./fetchDebtOrders";
import { fetchDebtPaymentsByOrderIds } from "./fetchDebtPaymentsByOrderIds";

export async function computeOutstandingDebtTotal(
  supabase: SupabaseClient,
  branchId: string,
): Promise<number> {
  const orders = await fetchDebtOrders(supabase, branchId);
  if (orders.length === 0) return 0;

  const payments = await fetchDebtPaymentsByOrderIds(supabase, {
    branchId,
    orderIds: orders.map((order) => order.id),
  });

  return summarizeOutstandingDebtByOrder({
    orders: orders.map((order) => ({
      orderId: order.id,
      totalAmount: order.total_amount,
      status: order.status,
    })),
    payments: payments.map((payment) => ({
      orderId: payment.order_id,
      type: payment.type,
      status: payment.status,
      amount: payment.amount,
      reason: payment.reason,
      source: payment.source,
    })),
    excludedOrderStatuses: ["CANCELLED"],
  });
}