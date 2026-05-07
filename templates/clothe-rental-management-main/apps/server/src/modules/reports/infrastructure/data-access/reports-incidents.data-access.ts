import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IncidentReportRowDto,
  IncidentsReportQuery,
  IncidentsReportResponse,
  IncidentsSummaryDto,
} from '../../types/reports-module.type';
import type { OrderIncidentType } from '../../../orders/types/orders-domain.type';
import { buildCsv } from './reports-csv.data-access.utils';
import {
  DateRangeBoundaries,
  ItemRow,
  ReportsContext,
  ReportsDomainError,
  normalizeIncidentStatus,
  normalizeIncidentType,
  parseNumeric,
  roundMoney,
  sanitizeText,
} from './reports-common.data-access.utils';
import {
  buildUtcBoundaries,
  formatDateInTimeZone,
  resolveDateRange,
} from './reports-date-range.data-access.utils';
import {
  ensureExportPermission,
  resolveReportsContext,
} from './reports-context.data-access';
import { fetchItemsByIds } from './reports-reference.data-access';

interface IncidentRow {
  id: string;
  order_id: string;
  order_item_id: string | null;
  item_id: string | null;
  customer_id: string | null;
  type: string;
  status: string;
  amount: number | string | null;
  apply_to_deposit: boolean;
  description: string | null;
  created_at: string;
}

interface OrderRefRow {
  id: string;
  order_code: string | null;
}

interface CustomerRefRow {
  id: string;
  full_name: string | null;
  phone: string | null;
}

async function fetchIncidentRows(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    boundaries: DateRangeBoundaries;
    type: OrderIncidentType | null;
  },
): Promise<IncidentRow[]> {
  let query = supabase
    .from('incidents')
    .select(
      'id, order_id, order_item_id, item_id, customer_id, type, status, amount, apply_to_deposit, description, created_at',
    )
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .gte('created_at', options.boundaries.startIso)
    .lt('created_at', options.boundaries.endExclusiveIso)
    .order('created_at', { ascending: false });

  if (options.type) {
    query = query.eq('type', options.type);
  }

  const { data, error } = await query.returns<IncidentRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchOrdersByIds(
  supabase: SupabaseClient,
  orderIds: string[],
  branchId: string,
): Promise<Map<string, OrderRefRow>> {
  if (orderIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('rental_orders')
    .select('id, order_code')
    .in('id', orderIds)
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .returns<OrderRefRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

async function fetchCustomersByIds(
  supabase: SupabaseClient,
  customerIds: string[],
  branchId: string,
): Promise<Map<string, CustomerRefRow>> {
  if (customerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .in('id', customerIds)
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .returns<CustomerRefRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

function createEmptyIncidentsSummary(): IncidentsSummaryDto {
  return {
    totalIncidents: 0,
    totalAmount: 0,
    byTypeCount: {
      LATE: 0,
      DAMAGE: 0,
      LOST: 0,
      CLEANING: 0,
    },
    byTypeAmount: {
      LATE: 0,
      DAMAGE: 0,
      LOST: 0,
      CLEANING: 0,
    },
    byStatusCount: {
      OPEN: 0,
      SETTLED: 0,
      WAIVED: 0,
    },
  };
}

function mapIncidentRows(options: {
  rows: IncidentRow[];
  orderById: Map<string, OrderRefRow>;
  customerById: Map<string, CustomerRefRow>;
  itemById: Map<string, ItemRow>;
}): { items: IncidentReportRowDto[]; summary: IncidentsSummaryDto } {
  const summary = createEmptyIncidentsSummary();

  const items: IncidentReportRowDto[] = options.rows.map((row) => {
    const type = normalizeIncidentType(row.type) ?? 'LATE';
    const status = normalizeIncidentStatus(row.status) ?? 'OPEN';
    const amount = roundMoney(Math.max(0, parseNumeric(row.amount)));

    summary.totalIncidents += 1;
    summary.totalAmount = roundMoney(summary.totalAmount + amount);
    summary.byTypeCount[type] += 1;
    summary.byTypeAmount[type] = roundMoney(
      summary.byTypeAmount[type] + amount,
    );
    summary.byStatusCount[status] += 1;

    const orderRef = options.orderById.get(row.order_id);
    const customerRef = row.customer_id
      ? options.customerById.get(row.customer_id)
      : null;
    const itemRef = row.item_id ? options.itemById.get(row.item_id) : null;

    return {
      incidentId: row.id,
      createdAt: row.created_at,
      orderId: row.order_id,
      orderCode: sanitizeText(orderRef?.order_code) ?? row.order_id,
      itemId: row.item_id,
      itemCode: itemRef?.item_code ?? null,
      customerId: row.customer_id,
      customerName: sanitizeText(customerRef?.full_name),
      customerPhone: customerRef?.phone ?? null,
      type,
      status,
      amount,
      applyToDeposit: row.apply_to_deposit,
      description: sanitizeText(row.description),
    };
  });

  return {
    items,
    summary,
  };
}

async function buildIncidentsReport(
  supabase: SupabaseClient,
  options: {
    context: ReportsContext;
    query: IncidentsReportQuery;
  },
): Promise<IncidentsReportResponse> {
  const normalizedType =
    options.query.type === null || options.query.type === undefined
      ? null
      : normalizeIncidentType(options.query.type);

  if (
    options.query.type !== null &&
    options.query.type !== undefined &&
    !normalizedType
  ) {
    throw new ReportsDomainError('INVALID_INCIDENT_TYPE', {
      type: options.query.type,
    });
  }

  const today = formatDateInTimeZone(new Date(), options.context.timezone);
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

  const rows = await fetchIncidentRows(supabase, {
    branchId: options.context.branchId,
    boundaries,
    type: normalizedType,
  });

  const orderIds = Array.from(new Set(rows.map((row) => row.order_id)));
  const customerIds = Array.from(
    new Set(
      rows
        .map((row) => row.customer_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const itemIds = Array.from(
    new Set(
      rows
        .map((row) => row.item_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [orderById, customerById, itemById] = await Promise.all([
    fetchOrdersByIds(supabase, orderIds, options.context.branchId),
    fetchCustomersByIds(supabase, customerIds, options.context.branchId),
    fetchItemsByIds(supabase, itemIds, {
      branchId: options.context.branchId,
    }),
  ]);

  const mapped = mapIncidentRows({
    rows,
    orderById,
    customerById,
    itemById,
  });

  return {
    branchId: options.context.branchId,
    timezone: options.context.timezone,
    currencyCode: options.context.currencyCode,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    summary: mapped.summary,
    items: mapped.items,
  };
}

function incidentsReportToCsvRows(
  report: IncidentsReportResponse,
): Array<Array<string | number | boolean | null>> {
  const rows: Array<Array<string | number | boolean | null>> = [];

  for (const row of report.items) {
    rows.push([
      row.createdAt,
      row.orderCode,
      row.itemCode,
      row.customerName,
      row.customerPhone,
      row.type,
      row.status,
      row.amount,
      row.applyToDeposit,
      row.description,
    ]);
  }

  return rows;
}

export async function getIncidentsReportForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: IncidentsReportQuery;
  },
): Promise<IncidentsReportResponse> {
  const context = await resolveReportsContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  return buildIncidentsReport(supabase, {
    context,
    query: options.query,
  });
}

export async function exportIncidentsCsvForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: IncidentsReportQuery;
  },
): Promise<string> {
  const context = await resolveReportsContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  ensureExportPermission(context);

  const report = await buildIncidentsReport(supabase, {
    context,
    query: options.query,
  });

  return buildCsv(
    [
      'created_at',
      'order_code',
      'item_code',
      'customer_name',
      'customer_phone',
      'type',
      'status',
      'amount',
      'apply_to_deposit',
      'description',
    ],
    incidentsReportToCsvRows(report),
  );
}
