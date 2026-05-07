import { SupabaseClient } from "@supabase/supabase-js";
import { DebtOrderRow } from "../interfaces";

export async function fetchDebtOrders(
  supabase: SupabaseClient,
  branchId: string,
): Promise<DebtOrderRow[]> {
  const { data, error } = await supabase
    .from("rental_orders")
    .select("id, total_amount, status")
    .eq("branch_id", branchId)
    .returns<DebtOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}