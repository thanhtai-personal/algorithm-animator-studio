import { SupabaseClient } from "@supabase/supabase-js";
import { isMissingOptionalPaymentColumnsError, sanitizeText, roundMoney } from "..";
import { summarizeFinancialPayments, summarizeRealProfitCashflow, computeRecognizedCogs, computeProfitMetrics } from "../../orderFinance";
import { PaymentAmountRow, PaymentAmountLegacyRow } from "../interfaces";
import { buildRevenueOrderFinancialContextMap } from "./buildRevenueOrderFinancialContextMap";
import { computeSalesProfitByRange } from "./computeSalesProfitByRange";
import { fetchRevenueOrdersByIds } from "./fetchRevenueOrdersByIds";
import { fetchRevenueOrderItemCogsByOrderIds } from "./fetchRevenueOrderItemCogsByOrderIds";

export async function fetchRevenueToday(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    startIso: string;
    endExclusiveIso: string;
  },
): Promise<{
  revenueToday: number;
  revenueGrossToday: number;
  refundEffectiveToday: number;
  cogsToday: number;
  grossProfitToday: number;
  profitMarginToday: number;
  salesProfitToday: number;
  realProfitToday: number;
  realInflowToday: number;
  realOutflowToday: number;
  depositCollectedToday: number;
  depositRefundedToday: number;
}> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      "order_id, type, status, amount, reason, source, is_initial_capital",
    )
    .eq("branch_id", options.branchId)
    .eq("status", "POSTED")
    .gte("created_at", options.startIso)
    .lt("created_at", options.endExclusiveIso)
    .returns<PaymentAmountRow[]>();

  let paymentRows: PaymentAmountRow[] = data ?? [];
  if (error) {
    if (!isMissingOptionalPaymentColumnsError(error)) {
      throw error;
    }

    const { data: legacyRows, error: legacyError } = await supabase
      .from("payments")
      .select("order_id, type, status, amount")
      .eq("branch_id", options.branchId)
      .eq("status", "POSTED")
      .gte("created_at", options.startIso)
      .lt("created_at", options.endExclusiveIso)
      .returns<PaymentAmountLegacyRow[]>();

    if (legacyError) throw legacyError;
    paymentRows = (legacyRows ?? []).map((row) => ({
      ...row,
      reason: null,
      source: null,
      is_initial_capital: false,
    }));
  }

  const statisticPaymentRows = paymentRows.filter(
    (payment) => payment.is_initial_capital !== true,
  );
  const orderIds = Array.from(
    new Set(
      statisticPaymentRows
        .map((payment) => sanitizeText(payment.order_id ?? null))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const [orders, orderItemCogsRows] = await Promise.all([
    fetchRevenueOrdersByIds(supabase, {
      branchId: options.branchId,
      orderIds,
    }),
    fetchRevenueOrderItemCogsByOrderIds(supabase, orderIds),
  ]);
  const orderFinancialContextById = buildRevenueOrderFinancialContextMap({
    orders,
    orderItemCogsRows,
  });

  const paymentSummary = summarizeFinancialPayments(
    statisticPaymentRows.map((payment) => ({
      type: payment.type,
      status: payment.status,
      amount: payment.amount,
      reason: payment.reason,
      source: payment.source,
    })),
  );
  const realProfitSummary = summarizeRealProfitCashflow(
    statisticPaymentRows.map((payment) => ({
      type: payment.type,
      status: payment.status,
      amount: payment.amount,
      reason: payment.reason,
      source: payment.source,
    })),
  );
  const realCashflowSummary = summarizeRealProfitCashflow(
    paymentRows.map((payment) => ({
      type: payment.type,
      status: payment.status,
      amount: payment.amount,
      reason: payment.reason,
      source: payment.source,
    })),
  );
  let recognizedCogs = 0;

  for (const payment of statisticPaymentRows) {
    const paymentOrderId = sanitizeText(payment.order_id ?? null);
    if (!paymentOrderId) continue;

    const orderFinancialContext = orderFinancialContextById.get(paymentOrderId);
    if (!orderFinancialContext) continue;

    const paymentContribution = summarizeFinancialPayments([
      {
        type: payment.type,
        status: payment.status,
        amount: payment.amount,
        reason: payment.reason,
        source: payment.source,
      },
    ]);
    if (paymentContribution.revenueNet === 0) continue;

    recognizedCogs = roundMoney(
      recognizedCogs +
      computeRecognizedCogs({
        orderCogsAmount: orderFinancialContext.cogsAmount,
        receivableAmount: orderFinancialContext.receivableAmount,
        revenueNet: paymentContribution.revenueNet,
      }),
    );
  }
  const profitMetrics = computeProfitMetrics({
    revenueNet: paymentSummary.revenueNet,
    cogs: recognizedCogs,
  });
  const salesProfitToday = await computeSalesProfitByRange(supabase, {
    branchId: options.branchId,
    startIso: options.startIso,
    endExclusiveIso: options.endExclusiveIso,
  });

  return {
    revenueToday: paymentSummary.revenueNet,
    revenueGrossToday: paymentSummary.revenueGross,
    refundEffectiveToday: paymentSummary.refundEffective,
    cogsToday: profitMetrics.cogs,
    grossProfitToday: profitMetrics.grossProfit,
    profitMarginToday: profitMetrics.profitMargin,
    salesProfitToday,
    realProfitToday: realProfitSummary.realProfit,
    realInflowToday: realCashflowSummary.inflowTotal,
    realOutflowToday: realCashflowSummary.outflowTotal,
    depositCollectedToday: paymentSummary.depositCollectedTotal,
    depositRefundedToday: paymentSummary.depositRefundedTotal,
  };
}