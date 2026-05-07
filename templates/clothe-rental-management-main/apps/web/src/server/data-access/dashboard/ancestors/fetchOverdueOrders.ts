import { SupabaseClient } from "@supabase/supabase-js";
import { DashboardOrderRow } from "../interfaces";

export async function fetchOverdueOrders(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    today: string;
    limit: number;
  },
): Promise<DashboardOrderRow[]> {
  const { data, error } = await supabase
    .from("rental_orders")
    .select(
      "id, order_code, customer_id, status, start_date, end_date, updated_at",
    )
    .eq("branch_id", options.branchId)
    .lt("end_date", options.today)
    .eq("status", "PICKED_UP")
    .order("end_date", { ascending: true })
    .limit(options.limit)
    .returns<DashboardOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}
