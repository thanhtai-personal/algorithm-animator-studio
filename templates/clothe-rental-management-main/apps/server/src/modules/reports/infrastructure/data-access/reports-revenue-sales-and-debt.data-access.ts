import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isMissingOptionalPaymentColumnsError,
  parseNumeric,
  roundMoney,
  type DateRangeBoundaries,
} from './reports-common.data-access.utils';
import { summarizeOutstandingDebtByOrder } from '../../../orders/infrastructure/order-finance.data-access';

interface SalesProfitOrderRow {
  id: string;
  status: string | null;
}

interface SalesProfitOrderItemRow {
  rent_price: number | string | null;
  cogs_snapshot_amount: number | string | null;
}

interface DebtOrderRow {
  id: string;
  total_amount: number | string | null;
  status: string;
}

interface DebtPaymentRow {
  order_id: string;
  type: string;
  status: string;
  amount: number | string | null;
  reason: string | null;
  source: string | null;
}

interface DebtPaymentLegacyRow {
  order_id: string;
  type: string;
  status: string;
  amount: number | string | null;
}

async function fetchSalesProfitOrders(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    boundaries: DateRangeBoundaries;
  },
): Promise<SalesProfitOrderRow[]> {
  const { data, error } = await supabase
    .from('rental_orders')
    .select('id, status')
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .eq('order_type', 'SALE')
    .in('status', ['CONFIRMED', 'DEBT', 'COMPLETED'])
    .gte('created_at', options.boundaries.startIso)
    .lt('created_at', options.boundaries.endExclusiveIso)
    .returns<SalesProfitOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchSalesProfitOrderItems(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<SalesProfitOrderItemRow[]> {
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('rental_order_items')
    .select('rent_price, cogs_snapshot_amount')
    .in('order_id', orderIds)
    .eq('is_delete', false)
    .returns<SalesProfitOrderItemRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function computeSalesProfitByRange(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    boundaries: DateRangeBoundaries;
  },
): Promise<number> {
  const orders = await fetchSalesProfitOrders(supabase, {
    branchId: options.branchId,
    boundaries: options.boundaries,
  });

  if (orders.length === 0) return 0;

  const orderIds = orders.map((order) => order.id);
  const orderItems = await fetchSalesProfitOrderItems(supabase, orderIds);
  if (orderItems.length === 0) return 0;

  let salesAmount = 0;
  let soldCogsAmount = 0;
  for (const item of orderItems) {
    salesAmount = roundMoney(
      salesAmount + Math.max(0, parseNumeric(item.rent_price)),
    );
    soldCogsAmount = roundMoney(
      soldCogsAmount + Math.max(0, parseNumeric(item.cogs_snapshot_amount)),
    );
  }

  return roundMoney(salesAmount - soldCogsAmount);
}

async function fetchDebtOrders(
  supabase: SupabaseClient,
  branchId: string,
): Promise<DebtOrderRow[]> {
  const { data, error } = await supabase
    .from('rental_orders')
    .select('id, total_amount, status')
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .returns<DebtOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchDebtPaymentsByOrderIds(
  supabase: SupabaseClient,
  branchId: string,
  orderIds: string[],
): Promise<DebtPaymentRow[]> {
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('payments')
    .select('order_id, type, status, amount, reason, source')
    .in('order_id', orderIds)
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .eq('status', 'POSTED')
    .returns<DebtPaymentRow[]>();

  if (!error) return data ?? [];
  if (!isMissingOptionalPaymentColumnsError(error)) {
    throw error;
  }

  const { data: legacyRows, error: legacyError } = await supabase
    .from('payments')
    .select('order_id, type, status, amount')
    .in('order_id', orderIds)
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .eq('status', 'POSTED')
    .returns<DebtPaymentLegacyRow[]>();

  if (legacyError) throw legacyError;
  return (legacyRows ?? []).map((row) => ({
    ...row,
    reason: null,
    source: null,
  }));
}

export async function computeBranchOutstandingDebt(
  supabase: SupabaseClient,
  branchId: string,
): Promise<number> {
  const orders = await fetchDebtOrders(supabase, branchId);
  if (orders.length === 0) return 0;

  const payments = await fetchDebtPaymentsByOrderIds(
    supabase,
    branchId,
    orders.map((order) => order.id),
  );

  return summarizeOutstandingDebtByOrder({
    orders: orders.map((order) => ({
      orderId: order.id,
      totalAmount: order.total_amount,
      status: order.status,
    })),
    payments: payments.map((payment) => ({
      orderId: payment.order_id,
      type: payment.type,
      status: payment.status,
      amount: payment.amount,
      reason: payment.reason,
      source: payment.source,
    })),
    excludedOrderStatuses: ['CANCELLED'],
  });
}
