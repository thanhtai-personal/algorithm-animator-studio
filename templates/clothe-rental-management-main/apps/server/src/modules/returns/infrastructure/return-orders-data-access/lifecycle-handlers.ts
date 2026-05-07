import type { SupabaseClient } from '@supabase/supabase-js';
import {
  completeOrderForAdmin,
  getOrderDetailForAdmin,
  OrdersDomainError,
  processOrderReturnForAdmin,
} from '../../../orders/infrastructure/orders.data-access';
import type { OrderDetailDto } from '../../../orders/types/orders-domain.type';
import type {
  CreateReturnOrderPayload,
  ReturnOrderDetailDto,
  SettleReturnOrderPayload,
  TransitionReturnOrderStatusPayload,
} from '../../types/return-orders.type';
import {
  assertNoActiveReturnOrderForSource,
  assertSourceOrderEligible,
  buildReturnCode,
  fetchReturnOrderRowById,
  loadReturnOrderDetail,
  mapReturnOrderDetail,
  normalizeReturnDepositRefundStatus,
  normalizeReturnOrderStatus,
  parseIsoDateString,
  parseNumeric,
  RETURN_ORDER_SELECT,
  ReturnOrdersDomainError,
  resolveDepositRefundStatusFromOrder,
  roundMoney,
  sanitizeText,
  type ReturnOrderRow,
} from './shared';

export async function getReturnOrderDetailForAdmin(
  supabase: SupabaseClient,
  options: {
    returnOrderId: string;
  },
): Promise<ReturnOrderDetailDto | null> {
  const row = await fetchReturnOrderRowById(supabase, options.returnOrderId);
  if (!row) return null;

  return loadReturnOrderDetail(supabase, row);
}

export async function createReturnOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateReturnOrderPayload;
  },
): Promise<ReturnOrderDetailDto> {
  const sourceRentalOrderId = sanitizeText(options.payload.sourceRentalOrderId);
  if (!sourceRentalOrderId) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SOURCE_REQUIRED');
  }

  const actualReturnDate = parseIsoDateString(options.payload.actualReturnDate);
  if (!actualReturnDate) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_ACTUAL_DATE_REQUIRED');
  }

  const initialStatus = normalizeReturnOrderStatus(
    options.payload.status ?? 'CREATED',
  );
  if (
    !initialStatus ||
    (initialStatus !== 'DRAFT' && initialStatus !== 'CREATED')
  ) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_STATUS_INVALID', {
      status: options.payload.status,
    });
  }

  const sourceOrder = await getOrderDetailForAdmin(
    supabase,
    sourceRentalOrderId,
  );
  if (!sourceOrder) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SOURCE_NOT_ALLOWED', {
      sourceRentalOrderId,
      reason: 'source-order-not-found',
    });
  }

  assertSourceOrderEligible(sourceOrder);
  await assertNoActiveReturnOrderForSource(supabase, sourceRentalOrderId);

  const nowIso = new Date().toISOString();
  const insertPayload = {
    branch_id: sourceOrder.summary.branchId,
    return_code: buildReturnCode(sourceOrder.summary.orderCode),
    source_rental_order_id: sourceRentalOrderId,
    source_rental_order_status: sourceOrder.summary.status,
    status: initialStatus,
    deposit_refund_status:
      sourceOrder.summary.money.depositPaid > 0 ? 'PENDING' : 'NOT_REQUIRED',
    actual_return_date: actualReturnDate,
    expected_return_date: sourceOrder.summary.endDate,
    total_amount: roundMoney(
      parseNumeric(sourceOrder.summary.money.totalAmount),
    ),
    deposit_collected_amount: roundMoney(
      parseNumeric(sourceOrder.summary.money.depositPaid),
    ),
    deposit_refunded_amount: roundMoney(
      parseNumeric(sourceOrder.summary.money.depositRefundedAmount),
    ),
    outstanding_amount: roundMoney(
      parseNumeric(sourceOrder.summary.money.outstandingAmount),
    ),
    note: sanitizeText(options.payload.note),
    internal_note: sanitizeText(options.payload.internalNote),
    created_by: options.actorProfileId,
    updated_by: options.actorProfileId,
    settled_at: null,
    completed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    is_delete: false,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from('return_orders')
    .insert(insertPayload)
    .select(RETURN_ORDER_SELECT)
    .single<ReturnOrderRow>();

  if (error) throw error;
  return mapReturnOrderDetail(data, sourceOrder);
}

export async function transitionReturnOrderStatusForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    returnOrderId: string;
    payload: TransitionReturnOrderStatusPayload;
  },
): Promise<ReturnOrderDetailDto> {
  const row = await fetchReturnOrderRowById(supabase, options.returnOrderId);
  if (!row) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_NOT_FOUND', {
      returnOrderId: options.returnOrderId,
    });
  }

  const currentStatus = normalizeReturnOrderStatus(row.status);
  const nextStatus = normalizeReturnOrderStatus(options.payload.toStatus);
  if (!currentStatus || !nextStatus) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_STATUS_INVALID', {
      currentStatus: row.status,
      nextStatus: options.payload.toStatus,
    });
  }

  const allowed =
    (currentStatus === 'DRAFT' &&
      (nextStatus === 'CREATED' || nextStatus === 'CANCELLED')) ||
    (currentStatus === 'CREATED' && nextStatus === 'CANCELLED');
  if (!allowed) {
    throw new ReturnOrdersDomainError(
      'RETURN_ORDER_STATUS_TRANSITION_INVALID',
      {
        fromStatus: currentStatus,
        toStatus: nextStatus,
      },
    );
  }

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_by: options.actorProfileId,
  };
  if (nextStatus === 'CANCELLED') {
    patch.cancelled_at = new Date().toISOString();
    patch.cancel_reason = sanitizeText(options.payload.reason);
  }

  const { data, error } = await supabase
    .from('return_orders')
    .update(patch)
    .eq('id', row.id)
    .eq('is_delete', false)
    .select(RETURN_ORDER_SELECT)
    .single<ReturnOrderRow>();
  if (error) throw error;

  return loadReturnOrderDetail(supabase, data);
}

export async function settleReturnOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    returnOrderId: string;
    payload: SettleReturnOrderPayload;
  },
): Promise<ReturnOrderDetailDto> {
  const row = await fetchReturnOrderRowById(supabase, options.returnOrderId);
  if (!row) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_NOT_FOUND', {
      returnOrderId: options.returnOrderId,
    });
  }

  const status = normalizeReturnOrderStatus(row.status);
  if (status !== 'CREATED') {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SETTLE_INVALID', {
      returnOrderId: row.id,
      status: row.status,
      reason: 'return-order-must-be-created',
    });
  }

  const actualReturnDate = parseIsoDateString(
    options.payload.actualReturnDate ?? row.actual_return_date,
  );
  if (!actualReturnDate) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_ACTUAL_DATE_REQUIRED', {
      returnOrderId: row.id,
    });
  }

  if (
    !Array.isArray(options.payload.items) ||
    options.payload.items.length === 0
  ) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SETTLE_INVALID', {
      returnOrderId: row.id,
      reason: 'return-items-required',
    });
  }

  let sourceAfterReturn: OrderDetailDto | null = null;
  try {
    sourceAfterReturn = await processOrderReturnForAdmin(supabase, {
      actorProfileId: options.actorProfileId,
      orderId: row.source_rental_order_id,
      payload: {
        returnedDate: actualReturnDate,
        items: options.payload.items,
        customFeesAmount: options.payload.customFeesAmount,
        additionalCollectedAmount: options.payload.additionalCollectedAmount,
        additionalCollectionMethod: options.payload.additionalCollectionMethod,
        additionalCollectionNote: options.payload.additionalCollectionNote,
        refundAmount: options.payload.refundAmount,
        refundMethod: options.payload.refundMethod,
        refundReason: options.payload.refundReason,
        refundNote: options.payload.refundNote,
        completeAfterReturn: false,
      },
    });
  } catch (error) {
    if (error instanceof OrdersDomainError) {
      throw error;
    }
    throw error;
  }

  if (!sourceAfterReturn) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SOURCE_NOT_ALLOWED', {
      sourceOrderId: row.source_rental_order_id,
      reason: 'source-order-not-found',
    });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('return_orders')
    .update({
      source_rental_order_status: sourceAfterReturn.summary.status,
      status: 'RETURN_SETTLED',
      deposit_refund_status:
        resolveDepositRefundStatusFromOrder(sourceAfterReturn),
      actual_return_date: actualReturnDate,
      total_amount: roundMoney(
        parseNumeric(sourceAfterReturn.summary.money.totalAmount),
      ),
      deposit_collected_amount: roundMoney(
        parseNumeric(sourceAfterReturn.summary.money.depositPaid),
      ),
      deposit_refunded_amount: roundMoney(
        parseNumeric(sourceAfterReturn.summary.money.depositRefundedAmount),
      ),
      outstanding_amount: roundMoney(
        parseNumeric(sourceAfterReturn.summary.money.outstandingAmount),
      ),
      settled_at: nowIso,
      updated_by: options.actorProfileId,
    })
    .eq('id', row.id)
    .eq('is_delete', false)
    .select(RETURN_ORDER_SELECT)
    .single<ReturnOrderRow>();
  if (error) throw error;

  return mapReturnOrderDetail(data, sourceAfterReturn);
}

export async function completeReturnOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    returnOrderId: string;
  },
): Promise<ReturnOrderDetailDto> {
  const row = await fetchReturnOrderRowById(supabase, options.returnOrderId);
  if (!row) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_NOT_FOUND', {
      returnOrderId: options.returnOrderId,
    });
  }

  const status = normalizeReturnOrderStatus(row.status);
  if (status !== 'RETURN_SETTLED') {
    throw new ReturnOrdersDomainError(
      'RETURN_ORDER_STATUS_TRANSITION_INVALID',
      {
        fromStatus: row.status,
        toStatus: 'COMPLETED',
      },
    );
  }

  const depositRefundStatus = normalizeReturnDepositRefundStatus(
    row.deposit_refund_status,
  );
  if (
    !depositRefundStatus ||
    (depositRefundStatus !== 'REFUNDED' &&
      depositRefundStatus !== 'NOT_REQUIRED')
  ) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_DEPOSIT_REFUND_PENDING', {
      returnOrderId: row.id,
      depositRefundStatus: row.deposit_refund_status,
    });
  }

  const sourceAfterComplete = await completeOrderForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    orderId: row.source_rental_order_id,
  });
  if (!sourceAfterComplete) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SOURCE_NOT_ALLOWED', {
      sourceOrderId: row.source_rental_order_id,
      reason: 'source-order-not-found',
    });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('return_orders')
    .update({
      source_rental_order_status: sourceAfterComplete.summary.status,
      status: 'COMPLETED',
      total_amount: roundMoney(
        parseNumeric(sourceAfterComplete.summary.money.totalAmount),
      ),
      deposit_collected_amount: roundMoney(
        parseNumeric(sourceAfterComplete.summary.money.depositPaid),
      ),
      deposit_refunded_amount: roundMoney(
        parseNumeric(sourceAfterComplete.summary.money.depositRefundedAmount),
      ),
      outstanding_amount: roundMoney(
        parseNumeric(sourceAfterComplete.summary.money.outstandingAmount),
      ),
      completed_at: nowIso,
      updated_by: options.actorProfileId,
    })
    .eq('id', row.id)
    .eq('is_delete', false)
    .select(RETURN_ORDER_SELECT)
    .single<ReturnOrderRow>();
  if (error) throw error;

  return mapReturnOrderDetail(data, sourceAfterComplete);
}

export async function cancelReturnOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    returnOrderId: string;
    reason?: string | null;
  },
): Promise<ReturnOrderDetailDto> {
  return transitionReturnOrderStatusForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    returnOrderId: options.returnOrderId,
    payload: {
      toStatus: 'CANCELLED',
      reason: options.reason ?? null,
    },
  });
}
