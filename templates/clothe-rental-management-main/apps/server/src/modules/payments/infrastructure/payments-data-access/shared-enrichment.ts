import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  OrderPaymentMethod,
  OrderPaymentType,
} from '../../../orders/types/orders-domain.type';
import type {
  PaymentDailyCashbookRowDto,
  PaymentListItemDto,
  PaymentsTotalsDto,
} from '../../types/payments-domain.type';
import {
  buildDateFromBoundary,
  buildDateToBoundary,
  type CustomerRefRow,
  type OrderRefRow,
  parseNumeric,
  PAYMENT_ROW_SELECT,
  type PaymentRow,
  type ProfileNameRefRow,
  normalizePaymentMethod,
  normalizePaymentStatus,
  normalizePaymentType,
  resolveSignedAmount,
  roundMoney,
} from './shared-core';
import { fetchPaymentAttachmentCountByPaymentId } from './payment-receipt-attachments';

export async function fetchOrdersByIds(
  supabase: SupabaseClient,
  orderIds: string[],
  branchIds: string[],
): Promise<Map<string, OrderRefRow>> {
  if (orderIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('rental_orders')
    .select('id, order_code')
    .in('id', orderIds)
    .in('branch_id', branchIds)
    .eq('is_delete', false)
    .returns<OrderRefRow[]>();

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function fetchCustomersByIds(
  supabase: SupabaseClient,
  customerIds: string[],
  branchIds: string[],
): Promise<Map<string, CustomerRefRow>> {
  if (customerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .in('id', customerIds)
    .in('branch_id', branchIds)
    .eq('is_delete', false)
    .returns<CustomerRefRow[]>();

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function fetchProfileNamesByIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, ProfileNameRefRow>> {
  if (profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', profileIds)
    .eq('is_delete', false)
    .returns<ProfileNameRefRow[]>();

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id, row]));
}

function mapPaymentRow(
  row: PaymentRow,
  references: {
    orderById: Map<string, OrderRefRow>;
    customerById: Map<string, CustomerRefRow>;
    creatorById: Map<string, ProfileNameRefRow>;
    attachmentCountByPaymentId: Map<string, number>;
  },
): PaymentListItemDto {
  const type = normalizePaymentType(row.type) ?? 'FEE';
  const method = normalizePaymentMethod(row.method) ?? 'CASH';
  const status = normalizePaymentStatus(row.status) ?? 'POSTED';
  const amount = roundMoney(Math.max(0, parseNumeric(row.amount)));

  const orderRef = row.order_id ? references.orderById.get(row.order_id) : null;
  const customerRef = row.customer_id
    ? references.customerById.get(row.customer_id)
    : null;
  const creatorRef = row.created_by
    ? references.creatorById.get(row.created_by)
    : null;

  return {
    id: row.id,
    branchId: row.branch_id,
    orderId: row.order_id,
    orderCode: orderRef?.order_code ?? null,
    customerId: row.customer_id,
    customerName: customerRef?.full_name ?? null,
    customerPhone: customerRef?.phone ?? null,
    type,
    method,
    status,
    amount,
    signedAmount: resolveSignedAmount(type, amount),
    reason: row.reason,
    source: row.source,
    isImportOrder: Boolean(row.is_import_order),
    isInitialCapital: Boolean(row.is_initial_capital),
    note: row.note,
    referenceCode: row.reference_code,
    voidReason: row.void_reason,
    voidedAt: row.voided_at,
    createdBy: row.created_by,
    createdByName: creatorRef?.full_name ?? null,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachmentCount: references.attachmentCountByPaymentId.get(row.id) ?? 0,
  };
}

function createEmptyTotals(): PaymentsTotalsDto {
  return {
    postedCount: 0,
    byMethod: {
      CASH: 0,
      BANK: 0,
      MOMO: 0,
    },
    byType: {
      RENT: 0,
      DEPOSIT: 0,
      FEE: 0,
      REFUND: 0,
      EXPENSE: 0,
    },
    grossInflow: 0,
    grossRefund: 0,
    netTotal: 0,
  };
}

export function computeTotals(postedRows: PaymentRow[]): PaymentsTotalsDto {
  const totals = createEmptyTotals();

  for (const row of postedRows) {
    const type = normalizePaymentType(row.type);
    const method = normalizePaymentMethod(row.method);
    if (!type || !method) continue;

    const amount = roundMoney(Math.max(0, parseNumeric(row.amount)));
    totals.postedCount += 1;
    totals.byType[type] = roundMoney(totals.byType[type] + amount);

    if (type === 'REFUND' || type === 'EXPENSE') {
      totals.grossRefund = roundMoney(totals.grossRefund + amount);
    } else {
      totals.grossInflow = roundMoney(totals.grossInflow + amount);
    }

    const signedAmount = resolveSignedAmount(type, amount);
    totals.byMethod[method] = roundMoney(
      totals.byMethod[method] + signedAmount,
    );
    totals.netTotal = roundMoney(totals.netTotal + signedAmount);
  }

  return totals;
}

export function computeDailyCashbook(
  postedRows: PaymentRow[],
): PaymentDailyCashbookRowDto[] {
  const byDate = new Map<string, PaymentDailyCashbookRowDto>();

  for (const row of postedRows) {
    const type = normalizePaymentType(row.type);
    const method = normalizePaymentMethod(row.method);
    if (!type || !method) continue;

    const amount = roundMoney(Math.max(0, parseNumeric(row.amount)));
    const date = row.created_at.slice(0, 10);
    const existing = byDate.get(date) ?? {
      date,
      byMethod: {
        CASH: 0,
        BANK: 0,
        MOMO: 0,
      },
      grossInflow: 0,
      grossRefund: 0,
      netTotal: 0,
    };

    const signedAmount = resolveSignedAmount(type, amount);
    existing.byMethod[method] = roundMoney(
      existing.byMethod[method] + signedAmount,
    );
    if (type === 'REFUND' || type === 'EXPENSE') {
      existing.grossRefund = roundMoney(existing.grossRefund + amount);
    } else {
      existing.grossInflow = roundMoney(existing.grossInflow + amount);
    }

    existing.netTotal = roundMoney(existing.netTotal + signedAmount);
    byDate.set(date, existing);
  }

  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function fetchPaymentRowsForList(
  supabase: SupabaseClient,
  options: {
    branchIds: string[];
    startDate: string | null;
    endDate: string | null;
    type: OrderPaymentType | null;
    method: OrderPaymentMethod | null;
    page: number;
    pageSize: number;
  },
): Promise<{ rows: PaymentRow[]; total: number }> {
  let query = supabase
    .from('payments')
    .select(PAYMENT_ROW_SELECT, { count: 'exact' })
    .in('branch_id', options.branchIds)
    .eq('is_delete', false)
    .order('created_at', { ascending: false })
    .range(
      (options.page - 1) * options.pageSize,
      options.page * options.pageSize - 1,
    );

  if (options.startDate) {
    query = query.gte('created_at', buildDateFromBoundary(options.startDate));
  }

  if (options.endDate) {
    query = query.lte('created_at', buildDateToBoundary(options.endDate));
  }

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.method) {
    query = query.eq('method', options.method);
  }

  const { data, error, count } = await query.returns<PaymentRow[]>();
  if (error) throw error;

  return {
    rows: data ?? [],
    total: count ?? 0,
  };
}

export async function fetchPostedRowsForSummary(
  supabase: SupabaseClient,
  options: {
    branchIds: string[];
    startDate: string | null;
    endDate: string | null;
    type: OrderPaymentType | null;
    method: OrderPaymentMethod | null;
  },
): Promise<PaymentRow[]> {
  let query = supabase
    .from('payments')
    .select(PAYMENT_ROW_SELECT)
    .in('branch_id', options.branchIds)
    .eq('is_delete', false)
    .eq('status', 'POSTED')
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', buildDateFromBoundary(options.startDate));
  }

  if (options.endDate) {
    query = query.lte('created_at', buildDateToBoundary(options.endDate));
  }

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.method) {
    query = query.eq('method', options.method);
  }

  const { data, error } = await query.returns<PaymentRow[]>();
  if (error) throw error;

  return data ?? [];
}

export async function enrichPayments(
  supabase: SupabaseClient,
  rows: PaymentRow[],
  branchIds: string[],
): Promise<PaymentListItemDto[]> {
  if (rows.length === 0) return [];

  const orderIds = Array.from(
    new Set(
      rows
        .map((row) => row.order_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const customerIds = Array.from(
    new Set(
      rows
        .map((row) => row.customer_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const creatorIds = Array.from(
    new Set(
      rows
        .map((row) => row.created_by)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const paymentIds = rows.map((row) => row.id);
  const [orderById, customerById, creatorById, attachmentCountByPaymentId] =
    await Promise.all([
      fetchOrdersByIds(supabase, orderIds, branchIds),
      fetchCustomersByIds(supabase, customerIds, branchIds),
      fetchProfileNamesByIds(supabase, creatorIds),
      fetchPaymentAttachmentCountByPaymentId(supabase, paymentIds),
    ]);

  return rows.map((row) =>
    mapPaymentRow(row, {
      orderById,
      customerById,
      creatorById,
      attachmentCountByPaymentId,
    }),
  );
}
