import { SupabaseClient } from "@supabase/supabase-js";
import { isMissingOptionalPaymentColumnsError, roundMoney, parseNumeric, sanitizeText } from "..";
import { PaymentCapitalImportRow } from "../interfaces";

export async function fetchInitialCapitalAndImportOrderTotals(
  supabase: SupabaseClient,
  branchId: string,
): Promise<{
  initialCapitalInflowTotal: number;
  initialCapitalOutflowTotal: number;
  initialCapitalNetTotal: number;
  importOrderExpenseTotal: number;
}> {
  const { data, error } = await supabase
    .from("payments")
    .select("type, amount, is_initial_capital, is_import_order")
    .eq("branch_id", branchId)
    .eq("is_delete", false)
    .eq("status", "POSTED")
    .returns<PaymentCapitalImportRow[]>();

  if (error) {
    if (isMissingOptionalPaymentColumnsError(error)) {
      return {
        initialCapitalInflowTotal: 0,
        initialCapitalOutflowTotal: 0,
        initialCapitalNetTotal: 0,
        importOrderExpenseTotal: 0,
      };
    }
    throw error;
  }

  let initialCapitalInflowTotal = 0;
  let initialCapitalOutflowTotal = 0;
  let importOrderExpenseTotal = 0;

  for (const payment of data ?? []) {
    const amount = roundMoney(Math.max(0, parseNumeric(payment.amount)));
    if (amount <= 0) continue;

    const normalizedType = sanitizeText(payment.type)?.toUpperCase() ?? "";
    const isOutflowType =
      normalizedType === "EXPENSE" || normalizedType === "REFUND";

    if (payment.is_initial_capital === true) {
      if (isOutflowType) {
        initialCapitalOutflowTotal = roundMoney(
          initialCapitalOutflowTotal + amount,
        );
      } else {
        initialCapitalInflowTotal = roundMoney(
          initialCapitalInflowTotal + amount,
        );
      }
    }

    if (payment.is_import_order === true) {
      importOrderExpenseTotal = roundMoney(importOrderExpenseTotal + amount);
    }
  }

  return {
    initialCapitalInflowTotal,
    initialCapitalOutflowTotal,
    initialCapitalNetTotal: roundMoney(
      initialCapitalInflowTotal - initialCapitalOutflowTotal,
    ),
    importOrderExpenseTotal,
  };
}