import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeOrderCogsAmount,
  computeProfitMetrics,
  computeRecognizedCogs,
  summarizeFinancialPayments,
  summarizeRealProfitCashflow,
} from '../../../orders/infrastructure/order-finance.data-access';
import type {
  RevenueDailyRowDto,
  RevenueKpiDto,
  RevenueReportGranularity,
} from '../../types/reports-module.type';
import {
  DateRange,
  DateRangeBoundaries,
  isMissingOptionalPaymentColumnsError,
  parseNumeric,
  roundMoney,
  sanitizeText,
} from './reports-common.data-access.utils';
import {
  buildRevenueSeriesKeys,
  toRevenueBucketKey,
} from './reports-date-range.data-access.utils';
import {
  computeBranchOutstandingDebt,
  computeSalesProfitByRange,
} from './reports-revenue-sales-and-debt.data-access';

interface RevenuePaymentRow {
  order_id: string | null;
  type: string;
  amount: number | string | null;
  reason: string | null;
  source: string | null;
  is_initial_capital?: boolean | null;
  created_at: string;
}

interface RevenuePaymentLegacyRow {
  order_id: string | null;
  type: string;
  amount: number | string | null;
  created_at: string;
}

interface RevenueOrderRow {
  id: string;
  order_type: string | null;
  total_amount: number | string | null;
}

interface RevenueOrderItemCogsRow {
  order_id: string;
  cogs_snapshot_amount: number | string | null;
}

interface RevenueSummaryResult {
  kpi: RevenueKpiDto;
  dailyRows: RevenueDailyRowDto[];
}

interface RevenueMetricsResult {
  summary: RevenueSummaryResult;
  outstandingDebt: number;
  salesProfit: number;
}

async function fetchRevenuePayments(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    boundaries: DateRangeBoundaries;
  },
): Promise<RevenuePaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(
      'order_id, type, amount, reason, source, is_initial_capital, created_at',
    )
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .eq('status', 'POSTED')
    .gte('created_at', options.boundaries.startIso)
    .lt('created_at', options.boundaries.endExclusiveIso)
    .order('created_at', { ascending: true })
    .returns<RevenuePaymentRow[]>();

  if (!error) return data ?? [];
  if (!isMissingOptionalPaymentColumnsError(error)) {
    throw error;
  }

  const { data: legacyRows, error: legacyError } = await supabase
    .from('payments')
    .select('order_id, type, amount, created_at')
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .eq('status', 'POSTED')
    .gte('created_at', options.boundaries.startIso)
    .lt('created_at', options.boundaries.endExclusiveIso)
    .order('created_at', { ascending: true })
    .returns<RevenuePaymentLegacyRow[]>();

  if (legacyError) throw legacyError;
  return (legacyRows ?? []).map((row) => ({
    ...row,
    reason: null,
    source: null,
    is_initial_capital: false,
  }));
}

async function fetchRevenueOrdersByIds(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    orderIds: string[];
  },
): Promise<RevenueOrderRow[]> {
  if (options.orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('rental_orders')
    .select('id, order_type, total_amount')
    .in('id', options.orderIds)
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .returns<RevenueOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchRevenueOrderItemCogsByOrderIds(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<RevenueOrderItemCogsRow[]> {
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('rental_order_items')
    .select('order_id, cogs_snapshot_amount')
    .in('order_id', orderIds)
    .eq('is_delete', false)
    .returns<RevenueOrderItemCogsRow[]>();

  if (error) throw error;
  return data ?? [];
}

function buildRevenueOrderFinancialContextMap(options: {
  orders: RevenueOrderRow[];
  orderItemCogsRows: RevenueOrderItemCogsRow[];
}): Map<
  string,
  {
    receivableAmount: number;
    cogsAmount: number;
  }
> {
  const saleItemCogsByOrderId = new Map<string, number[]>();
  for (const row of options.orderItemCogsRows) {
    const bucket = saleItemCogsByOrderId.get(row.order_id);
    const nextAmount = roundMoney(
      Math.max(0, parseNumeric(row.cogs_snapshot_amount)),
    );

    if (bucket) {
      bucket.push(nextAmount);
    } else {
      saleItemCogsByOrderId.set(row.order_id, [nextAmount]);
    }
  }

  const contextByOrderId = new Map<
    string,
    {
      receivableAmount: number;
      cogsAmount: number;
    }
  >();

  for (const order of options.orders) {
    const cogsAmount = computeOrderCogsAmount({
      orderType: order.order_type,
      saleItemCostSnapshots: saleItemCogsByOrderId.get(order.id) ?? [],
    });

    contextByOrderId.set(order.id, {
      receivableAmount: roundMoney(
        Math.max(0, parseNumeric(order.total_amount)),
      ),
      cogsAmount,
    });
  }

  return contextByOrderId;
}

function createEmptyRevenueDailyRow(date: string): RevenueDailyRowDto {
  return {
    date,
    revenueGross: 0,
    refundEffective: 0,
    revenueNet: 0,
    cogs: 0,
    grossProfit: 0,
    profitMargin: 0,
    realProfit: 0,
    cashInflow: 0,
    cashOutflow: 0,
    depositCollectedTotal: 0,
    depositRefundedTotal: 0,
    totalRevenue: 0,
    depositCollected: 0,
    depositRefunded: 0,
    refunds: 0,
    net: 0,
  };
}

function summarizeRevenue(options: {
  rows: RevenuePaymentRow[];
  cashflowRows: RevenuePaymentRow[];
  dateRange: DateRange;
  granularity: RevenueReportGranularity;
  timeZone: string;
  orderFinancialContextById: Map<
    string,
    {
      receivableAmount: number;
      cogsAmount: number;
    }
  >;
  salesProfit: number;
}): RevenueSummaryResult {
  const byDate = new Map<string, RevenueDailyRowDto>();
  const seriesKeys = buildRevenueSeriesKeys({
    dateRange: options.dateRange,
    granularity: options.granularity,
  });

  for (const date of seriesKeys) {
    byDate.set(date, createEmptyRevenueDailyRow(date));
  }

  let totalRevenueGross = 0;
  let totalRefundEffective = 0;
  let totalRevenueNet = 0;
  let totalDepositCollected = 0;
  let totalDepositRefunded = 0;
  let totalCogs = 0;

  const realProfitSummary = summarizeRealProfitCashflow(
    options.rows.map((row) => ({
      type: row.type,
      amount: row.amount,
      reason: row.reason,
      source: row.source,
    })),
  );
  const realCashflowSummary = summarizeRealProfitCashflow(
    options.cashflowRows.map((row) => ({
      type: row.type,
      amount: row.amount,
      reason: row.reason,
      source: row.source,
    })),
  );

  for (const row of options.cashflowRows) {
    const date = toRevenueBucketKey({
      isoDateTime: row.created_at,
      timeZone: options.timeZone,
      granularity: options.granularity,
    });
    const cashflowSummary = summarizeRealProfitCashflow([
      {
        type: row.type,
        amount: row.amount,
        reason: row.reason,
        source: row.source,
      },
    ]);
    const bucket = byDate.get(date) ?? createEmptyRevenueDailyRow(date);
    bucket.cashInflow = roundMoney(
      bucket.cashInflow + cashflowSummary.inflowTotal,
    );
    bucket.cashOutflow = roundMoney(
      bucket.cashOutflow + cashflowSummary.outflowTotal,
    );
    byDate.set(date, bucket);
  }

  for (const row of options.rows) {
    const paymentSummary = summarizeFinancialPayments([
      {
        type: row.type,
        amount: row.amount,
        reason: row.reason,
        source: row.source,
      },
    ]);
    const date = toRevenueBucketKey({
      isoDateTime: row.created_at,
      timeZone: options.timeZone,
      granularity: options.granularity,
    });
    const orderId = sanitizeText(row.order_id ?? null);

    const orderFinancialContext = orderId
      ? options.orderFinancialContextById.get(orderId)
      : undefined;
    const cogsContribution =
      orderFinancialContext && paymentSummary.revenueNet !== 0
        ? computeRecognizedCogs({
            orderCogsAmount: orderFinancialContext.cogsAmount,
            receivableAmount: orderFinancialContext.receivableAmount,
            revenueNet: paymentSummary.revenueNet,
          })
        : 0;
    const cashflowSummary = summarizeRealProfitCashflow([
      {
        type: row.type,
        amount: row.amount,
        reason: row.reason,
        source: row.source,
      },
    ]);

    const bucket = byDate.get(date) ?? createEmptyRevenueDailyRow(date);

    totalRevenueGross = roundMoney(
      totalRevenueGross + paymentSummary.revenueGross,
    );
    totalRefundEffective = roundMoney(
      totalRefundEffective + paymentSummary.refundEffective,
    );
    totalRevenueNet = roundMoney(totalRevenueNet + paymentSummary.revenueNet);
    totalDepositCollected = roundMoney(
      totalDepositCollected + paymentSummary.depositCollectedTotal,
    );
    totalDepositRefunded = roundMoney(
      totalDepositRefunded + paymentSummary.depositRefundedTotal,
    );
    totalCogs = roundMoney(totalCogs + cogsContribution);

    bucket.revenueGross = roundMoney(
      bucket.revenueGross + paymentSummary.revenueGross,
    );
    bucket.refundEffective = roundMoney(
      bucket.refundEffective + paymentSummary.refundEffective,
    );
    bucket.revenueNet = roundMoney(
      bucket.revenueNet + paymentSummary.revenueNet,
    );
    bucket.cogs = roundMoney(bucket.cogs + cogsContribution);
    bucket.grossProfit = roundMoney(bucket.revenueNet - bucket.cogs);
    bucket.profitMargin =
      Math.abs(bucket.revenueNet) < 0.000001
        ? 0
        : roundMoney(bucket.grossProfit / bucket.revenueNet);
    bucket.depositCollectedTotal = roundMoney(
      bucket.depositCollectedTotal + paymentSummary.depositCollectedTotal,
    );
    bucket.depositRefundedTotal = roundMoney(
      bucket.depositRefundedTotal + paymentSummary.depositRefundedTotal,
    );
    bucket.realProfit = roundMoney(
      bucket.realProfit + cashflowSummary.realProfit,
    );

    bucket.totalRevenue = bucket.revenueGross;
    bucket.depositCollected = bucket.depositCollectedTotal;
    bucket.depositRefunded = bucket.depositRefundedTotal;
    bucket.refunds = bucket.refundEffective;
    bucket.net = bucket.revenueNet;
    byDate.set(date, bucket);
  }

  const dailyRows = Array.from(byDate.values()).sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
  const totalProfitMetrics = computeProfitMetrics({
    revenueNet: totalRevenueNet,
    cogs: totalCogs,
  });

  return {
    kpi: {
      revenueGross: totalRevenueGross,
      refundEffective: totalRefundEffective,
      revenueNet: totalRevenueNet,
      cogs: totalProfitMetrics.cogs,
      grossProfit: totalProfitMetrics.grossProfit,
      profitMargin: totalProfitMetrics.profitMargin,
      salesProfit: roundMoney(options.salesProfit),
      realProfit: realProfitSummary.realProfit,
      cashInflow: realCashflowSummary.inflowTotal,
      cashOutflow: realCashflowSummary.outflowTotal,
      depositCollectedTotal: totalDepositCollected,
      depositRefundedTotal: totalDepositRefunded,
      totalRevenue: totalRevenueGross,
      totalDepositCollected,
      totalDepositRefunded,
      totalRefunds: totalRefundEffective,
      netRevenue: totalRevenueNet,
      outstandingDebt: 0,
    },
    dailyRows,
  };
}

export async function buildRevenueMetrics(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    dateRange: DateRange;
    boundaries: DateRangeBoundaries;
    granularity: RevenueReportGranularity;
    timeZone: string;
  },
): Promise<RevenueMetricsResult> {
  const [paymentRows, outstandingDebt, salesProfit] = await Promise.all([
    fetchRevenuePayments(supabase, {
      branchId: options.branchId,
      boundaries: options.boundaries,
    }),
    computeBranchOutstandingDebt(supabase, options.branchId),
    computeSalesProfitByRange(supabase, {
      branchId: options.branchId,
      boundaries: options.boundaries,
    }),
  ]);
  const statisticPaymentRows = paymentRows.filter(
    (payment) => payment.is_initial_capital !== true,
  );

  const orderIds = Array.from(
    new Set(
      statisticPaymentRows
        .map((row) => sanitizeText(row.order_id ?? null))
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

  return {
    summary: summarizeRevenue({
      rows: statisticPaymentRows,
      cashflowRows: paymentRows,
      dateRange: options.dateRange,
      granularity: options.granularity,
      timeZone: options.timeZone,
      orderFinancialContextById,
      salesProfit,
    }),
    outstandingDebt,
    salesProfit,
  };
}
