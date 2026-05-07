import { SupabaseClient } from "@supabase/supabase-js";
import { CustomerRefRow } from "../interfaces";

export async function fetchCustomersByIds(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    customerIds: string[];
  },
): Promise<Map<string, CustomerRefRow>> {
  if (options.customerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .in("id", options.customerIds)
    .eq("branch_id", options.branchId)
    .returns<CustomerRefRow[]>();

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id, row]));
}