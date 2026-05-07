import type { SupabaseClient } from '@supabase/supabase-js';
import { listOrdersForAdmin } from '../../../orders/infrastructure/orders.data-access';
import type {
  ReturnOrderSourcesQuery,
  ReturnOrderSourcesResponse,
} from '../../types/return-orders.type';
import {
  ACTIVE_RETURN_ORDER_STATUSES,
  parseNumeric,
  roundMoney,
  uniqueStringValues,
} from './shared';

export async function listReturnOrderSourcesForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: ReturnOrderSourcesQuery;
  },
): Promise<ReturnOrderSourcesResponse> {
  const page = Math.max(1, Math.floor(options.query.page ?? 1));
  const pageSize = Math.max(
    1,
    Math.min(80, Math.floor(options.query.pageSize ?? 20)),
  );

  const { data: activeRows, error: activeRowsError } = await supabase
    .from('return_orders')
    .select('source_rental_order_id')
    .eq('is_delete', false)
    .in('status', ACTIVE_RETURN_ORDER_STATUSES)
    .returns<Array<{ source_rental_order_id: string }>>();

  if (activeRowsError) throw activeRowsError;

  const activeSourceOrderIds = uniqueStringValues(
    (activeRows ?? []).map((entry) => entry.source_rental_order_id),
  );
  const sourceList = await listOrdersForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: options.query.branchId ?? null,
    orderTypes: ['RENTAL'],
    statuses: ['PICKED_UP'],
    excludeOrderIds: activeSourceOrderIds,
    search: options.query.search ?? null,
    page,
    pageSize,
  });

  return {
    items: sourceList.items.map((entry) => ({
      orderId: entry.id,
      orderCode: entry.orderCode,
      orderStatus: entry.status,
      customerName: entry.customer.fullName,
      customerPhone: entry.customer.phone,
      itemCount: entry.itemCount,
      startDate: entry.startDate,
      expectedReturnDate: entry.endDate,
      totalAmount: roundMoney(parseNumeric(entry.money.totalAmount)),
      depositPaid: roundMoney(parseNumeric(entry.money.depositPaid)),
      refundableDeposit: roundMoney(
        parseNumeric(entry.money.refundableDeposit),
      ),
      outstandingAmount: roundMoney(
        parseNumeric(entry.money.outstandingAmount),
      ),
    })),
    total: sourceList.total,
    page,
    pageSize,
  };
}
