import { SupabaseClient } from "@supabase/supabase-js";
import { isMissingOptionalPaymentColumnsError } from "..";
import { DebtPaymentRow, DebtPaymentLegacyRow } from "../interfaces";

export async function fetchDebtPaymentsByOrderIds(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    orderIds: string[];
  },
): Promise<DebtPaymentRow[]> {
  if (options.orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from("payments")
    .select("order_id, type, status, amount, reason, source")
    .in("order_id", options.orderIds)
    .eq("branch_id", options.branchId)
    .eq("status", "POSTED")
    .returns<DebtPaymentRow[]>();

  if (!error) return data ?? [];
  if (!isMissingOptionalPaymentColumnsError(error)) {
    throw error;
  }

  const { data: legacyRows, error: legacyError } = await supabase
    .from("payments")
    .select("order_id, type, status, amount")
    .in("order_id", options.orderIds)
    .eq("branch_id", options.branchId)
    .eq("status", "POSTED")
    .returns<DebtPaymentLegacyRow[]>();

  if (legacyError) throw legacyError;
  return (legacyRows ?? [])
    .filter((row): row is DebtPaymentLegacyRow & { order_id: string } =>
      Boolean(row.order_id),
    )
    .map((row) => ({
      ...row,
      reason: null,
      source: null,
    }));
}