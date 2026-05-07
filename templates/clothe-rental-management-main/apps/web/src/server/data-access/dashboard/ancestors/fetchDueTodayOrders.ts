import { SupabaseClient } from "@supabase/supabase-js";
import { DashboardOrderRow } from "../interfaces";
import { DUE_TODAY_STATUSES } from "../constants";

export async function fetchDueTodayOrders(
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
    .eq("end_date", options.today)
    .in("status", DUE_TODAY_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(options.limit)
    .returns<DashboardOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}