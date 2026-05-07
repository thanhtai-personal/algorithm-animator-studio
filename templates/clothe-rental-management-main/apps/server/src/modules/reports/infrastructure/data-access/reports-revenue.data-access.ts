import type { SupabaseClient } from '@supabase/supabase-js';
import {
  FINANCIAL_FORMULA_VERSION,
  RENTAL_COGS_FORMULA_CODE,
  SALE_COGS_FORMULA_CODE,
} from '../../../orders/infrastructure/order-finance.data-access';
import type {
  RevenueReportQuery,
  RevenueReportResponse,
} from '../../types/reports-module.type';
import { buildCsv } from './reports-csv.data-access.utils';
import {
  ReportsContext,
  sanitizeText,
} from './reports-common.data-access.utils';
import {
  buildUtcBoundaries,
  formatDateInTimeZone,
  normalizeRevenueGranularity,
  resolveDateRange,
} from './reports-date-range.data-access.utils';
import {
  ensureExportPermission,
  resolveReportsContext,
} from './reports-context.data-access';
import { buildRevenueMetrics } from './reports-revenue-metrics.data-access';
import { computeTopRentals } from './reports-top-rentals.data-access';

const FINANCIAL_FORMULA_NOTE = `Revenue/profit are payment-posted based. SALE cogs use item snapshots (${SALE_COGS_FORMULA_CODE}); RENTAL cogs uses fallback (${RENTAL_COGS_FORMULA_CODE}).`;

async function buildRevenueReport(
  supabase: SupabaseClient,
  options: {
    context: ReportsContext;
    query: RevenueReportQuery;
  },
): Promise<RevenueReportResponse> {
  const today = formatDateInTimeZone(new Date(), options.context.timezone);
  const granularity = normalizeRevenueGranularity(
    options.query.granularity ?? null,
  );

  const dateRange = resolveDateRange({
    startDate: sanitizeText(options.query.startDate ?? null),
    endDate: sanitizeText(options.query.endDate ?? null),
    today,
  });

  const boundaries = buildUtcBoundaries({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    timeZone: options.context.timezone,
  });

  const [metrics, topRentalAggregate] = await Promise.all([
    buildRevenueMetrics(supabase, {
      branchId: options.context.branchId,
      dateRange,
      boundaries,
      granularity,
      timeZone: options.context.timezone,
    }),
    computeTopRentals(supabase, {
      branchId: options.context.branchId,
      dateRange,
    }),
  ]);

  return {
    branchId: options.context.branchId,
    timezone: options.context.timezone,
    currencyCode: options.context.currencyCode,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    granularity,
    formulaVersion: FINANCIAL_FORMULA_VERSION,
    formulaNote: FINANCIAL_FORMULA_NOTE,
    kpi: {
      ...metrics.summary.kpi,
      outstandingDebt: metrics.outstandingDebt,
    },
    dailyRows: metrics.summary.dailyRows,
    topRentalsMetric: 'booking_count_rental_days_rent_amount',
    topProducts: topRentalAggregate.topProducts,
    topItems: topRentalAggregate.topItems,
  };
}

function revenueReportToCsvRows(
  report: RevenueReportResponse,
): Array<Array<string | number | null>> {
  const rows: Array<Array<string | number | null>> = [];

  rows.push([
    'KPI',
    '',
    report.granularity,
    report.kpi.revenueGross,
    report.kpi.refundEffective,
    report.kpi.revenueNet,
    report.kpi.cogs,
    report.kpi.grossProfit,
    report.kpi.profitMargin,
    report.kpi.salesProfit,
    report.kpi.realProfit,
    report.kpi.cashInflow,
    report.kpi.cashOutflow,
    report.kpi.depositCollectedTotal,
    report.kpi.depositRefundedTotal,
    report.kpi.outstandingDebt,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    report.formulaVersion,
    report.formulaNote,
  ]);

  for (const row of report.dailyRows) {
    rows.push([
      'SERIES',
      row.date,
      report.granularity,
      row.revenueGross,
      row.refundEffective,
      row.revenueNet,
      row.cogs,
      row.grossProfit,
      row.profitMargin,
      null,
      row.realProfit,
      row.cashInflow,
      row.cashOutflow,
      row.depositCollectedTotal,
      row.depositRefundedTotal,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  }

  for (const row of report.topProducts) {
    rows.push([
      'TOP_PRODUCT',
      null,
      report.granularity,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      row.productName,
      null,
      null,
      row.bookingCount,
      row.rentalDays,
      row.rentAmount,
      report.topRentalsMetric,
      null,
      null,
    ]);
  }

  for (const row of report.topItems) {
    rows.push([
      'TOP_ITEM',
      null,
      report.granularity,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      row.productName,
      row.itemCode,
      row.variantName,
      row.bookingCount,
      row.rentalDays,
      row.rentAmount,
      report.topRentalsMetric,
      null,
      null,
    ]);
  }

  return rows;
}

export async function getRevenueReportForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: RevenueReportQuery;
  },
): Promise<RevenueReportResponse> {
  const context = await resolveReportsContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  return buildRevenueReport(supabase, {
    context,
    query: options.query,
  });
}

export async function exportRevenueCsvForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: RevenueReportQuery;
  },
): Promise<string> {
  const context = await resolveReportsContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  ensureExportPermission(context);

  const report = await buildRevenueReport(supabase, {
    context,
    query: options.query,
  });

  return buildCsv(
    [
      'row_type',
      'date',
      'granularity',
      'revenue_gross',
      'refund_effective',
      'revenue_net',
      'cogs',
      'gross_profit',
      'profit_margin',
      'sales_profit',
      'real_profit',
      'cash_inflow',
      'cash_outflow',
      'deposit_collected_total',
      'deposit_refunded_total',
      'outstanding_debt',
      'product_name',
      'item_code',
      'variant_name',
      'booking_count',
      'rental_days',
      'rent_amount',
      'top_rentals_metric',
      'formula_version',
      'formula_note',
    ],
    revenueReportToCsvRows(report),
  );
}
