import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MakeupAdminOverviewChartPointDto,
  MakeupAdminOverviewQuery,
  MakeupAdminOverviewResponse,
  MakeupPurchaseInvoiceStatus,
} from '../types/makeup-module.type';
import {
  assertIsoDate,
  fetchMakeupModuleEnabled,
  isMissingColumnOrTableError,
  MAKEUP_ADMIN_ROLE_SET,
  MakeupDomainError,
  type MakeupEventRow,
  normalizeEventStatus,
  parseNumeric,
  resolveActorContext,
  roundMoney,
  sanitizeText,
} from './makeupShared';

interface MakeupPurchaseInvoiceMetricRow {
  invoice_date: string;
  status: MakeupPurchaseInvoiceStatus;
  total_amount: number | string | null;
  is_active: boolean;
}

function toIsoDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

function firstDayOfMonth(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

function nextMonth(value: string): string {
  const [yearText, monthText] = value.split('-');
  const year = Number.parseInt(yearText ?? '1970', 10);
  const month = Number.parseInt(monthText ?? '1', 10);
  const next = new Date(Date.UTC(year, month, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
}

function buildBuckets(
  startDate: string,
  endDate: string,
  granularity: 'day' | 'month',
): string[] {
  if (granularity === 'month') {
    const buckets: string[] = [];
    let cursor = startDate.slice(0, 7);
    const endBucket = endDate.slice(0, 7);
    while (cursor <= endBucket) {
      buckets.push(cursor);
      cursor = nextMonth(cursor);
    }
    return buckets;
  }

  const buckets: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    buckets.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return buckets;
}

function resolveBucket(value: string, granularity: 'day' | 'month'): string {
  if (granularity === 'month') return value.slice(0, 7);
  return value;
}

function isRecognizedPurchaseInvoiceCost(
  status: MakeupPurchaseInvoiceStatus,
): boolean {
  return status === 'CONFIRMED' || status === 'PAID';
}

export async function getMakeupAdminOverview(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: MakeupAdminOverviewQuery;
  },
): Promise<MakeupAdminOverviewResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  if (!MAKEUP_ADMIN_ROLE_SET.has(context.role ?? '')) {
    throw new MakeupDomainError('FORBIDDEN_ROLE', { role: context.role });
  }
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }

  const endDate = options.query.endDate
    ? assertIsoDate(options.query.endDate)
    : toIsoDate(new Date());
  const startDate = options.query.startDate
    ? assertIsoDate(options.query.startDate)
    : addDays(endDate, -29);
  if (startDate > endDate) {
    throw new MakeupDomainError('INVALID_DATE_RANGE', { startDate, endDate });
  }

  const granularity = options.query.granularity === 'month' ? 'month' : 'day';
  const chartBuckets = buildBuckets(startDate, endDate, granularity);
  const chartMap = new Map<string, MakeupAdminOverviewChartPointDto>(
    chartBuckets.map((bucket) => [
      bucket,
      {
        bucket,
        label: bucket,
        revenue: 0,
        cost: 0,
        profit: 0,
        makeupOrderCount: 0,
        makeupPurchaseInvoiceCount: 0,
      },
    ]),
  );

  type EventMetricRow = Pick<
    MakeupEventRow,
    | 'event_date'
    | 'status'
    | 'price_amount'
    | 'surcharge_amount'
    | 'cost_amount'
  >;

  const { data: eventRows, error: eventError } = await supabase
    .from('makeup_events')
    .select('event_date, status, price_amount, surcharge_amount, cost_amount')
    .eq('branch_id', context.branchId)
    .eq('is_delete', false)
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .returns<EventMetricRow[]>();
  if (eventError) throw eventError;

  let makeupOrderCount = 0;
  let revenue = 0;
  let cost = 0;

  for (const event of eventRows ?? []) {
    const status = normalizeEventStatus(event.status);
    if (status === 'CANCELLED') continue;

    const bucket = resolveBucket(event.event_date, granularity);
    const chartPoint = chartMap.get(bucket);
    if (!chartPoint) continue;

    const eventRevenue =
      Math.max(0, parseNumeric(event.price_amount)) +
      Math.max(0, parseNumeric(event.surcharge_amount));
    const eventCost = Math.max(0, parseNumeric(event.cost_amount));

    chartPoint.revenue = roundMoney(chartPoint.revenue + eventRevenue);
    chartPoint.cost = roundMoney(chartPoint.cost + eventCost);
    chartPoint.makeupOrderCount += 1;
    chartPoint.profit = roundMoney(chartPoint.revenue - chartPoint.cost);

    makeupOrderCount += 1;
    revenue = roundMoney(revenue + eventRevenue);
    cost = roundMoney(cost + eventCost);
  }

  const { data: invoiceRows, error: invoiceError } = await supabase
    .from('makeup_purchase_invoices')
    .select('invoice_date, status, total_amount, is_active')
    .eq('branch_id', context.branchId)
    .eq('is_delete', false)
    .gte(
      'invoice_date',
      granularity === 'month' ? firstDayOfMonth(startDate) : startDate,
    )
    .lte('invoice_date', endDate)
    .returns<MakeupPurchaseInvoiceMetricRow[]>();

  let makeupPurchaseInvoiceCount = 0;
  if (invoiceError) {
    if (!isMissingColumnOrTableError(invoiceError)) throw invoiceError;
  } else {
    for (const invoice of invoiceRows ?? []) {
      if (!invoice.is_active || invoice.status === 'CANCELLED') continue;
      if (invoice.invoice_date < startDate || invoice.invoice_date > endDate)
        continue;

      const bucket = resolveBucket(invoice.invoice_date, granularity);
      const chartPoint = chartMap.get(bucket);
      if (!chartPoint) continue;

      chartPoint.makeupPurchaseInvoiceCount += 1;
      makeupPurchaseInvoiceCount += 1;

      if (isRecognizedPurchaseInvoiceCost(invoice.status)) {
        const invoiceCost = Math.max(0, parseNumeric(invoice.total_amount));
        chartPoint.cost = roundMoney(chartPoint.cost + invoiceCost);
        chartPoint.profit = roundMoney(chartPoint.revenue - chartPoint.cost);
        cost = roundMoney(cost + invoiceCost);
      }
    }
  }

  const chart = chartBuckets.map((bucket) => {
    const point = chartMap.get(bucket) ?? {
      bucket,
      label: bucket,
      revenue: 0,
      cost: 0,
      profit: 0,
      makeupOrderCount: 0,
      makeupPurchaseInvoiceCount: 0,
    };
    return {
      ...point,
      revenue: roundMoney(point.revenue),
      cost: roundMoney(point.cost),
      profit: roundMoney(point.revenue - point.cost),
    };
  });

  return {
    branchId: context.branchId,
    timezone: context.timeZone,
    startDate,
    endDate,
    makeupOrderCount,
    makeupPurchaseInvoiceCount,
    revenue,
    cost,
    profit: roundMoney(revenue - cost),
    chart,
  };
}
