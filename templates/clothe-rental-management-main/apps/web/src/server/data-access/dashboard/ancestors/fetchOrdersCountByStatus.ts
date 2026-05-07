import { OrderStatus } from "@/types/domainPrimitives";
import { SupabaseClient } from "@supabase/supabase-js";

export async function fetchOrdersCountByStatus(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    status: OrderStatus;
  },
): Promise<number> {
  const { count, error } = await supabase
    .from("rental_orders")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", options.branchId)
    .eq("status", options.status);

  if (error) throw error;
  return count ?? 0;
}