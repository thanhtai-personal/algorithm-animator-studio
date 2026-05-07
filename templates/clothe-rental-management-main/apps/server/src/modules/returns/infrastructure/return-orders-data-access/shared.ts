import type { SupabaseClient } from '@supabase/supabase-js';
import { getOrderDetailForAdmin } from '../../../orders/infrastructure/orders.data-access';
import type { OrderDetailDto } from '../../../orders/types/orders-domain.type';
import type {
  ReturnDepositRefundStatus,
  ReturnOrderDetailDto,
  ReturnOrderStatus,
} from '../../types/return-orders.type';

const RETURN_ORDER_STATUS_SET = new Set<string>([
  'DRAFT',
  'CREATED',
  'RETURN_SETTLED',
  'COMPLETED',
  'CANCELLED',
]);

const RETURN_DEPOSIT_REFUND_STATUS_SET = new Set<string>([
  'PENDING',
  'REFUNDED',
  'NOT_REQUIRED',
]);

export const ACTIVE_RETURN_ORDER_STATUSES: ReturnOrderStatus[] = [
  'DRAFT',
  'CREATED',
  'RETURN_SETTLED',
];

export const RETURN_ORDER_SELECT = [
  'id',
  'branch_id',
  'return_code',
  'source_rental_order_id',
  'source_rental_order_status',
  'status',
  'deposit_refund_status',
  'actual_return_date',
  'expected_return_date',
  'total_amount',
  'deposit_collected_amount',
  'deposit_refunded_amount',
  'outstanding_amount',
  'note',
  'internal_note',
  'settled_at',
  'completed_at',
  'cancelled_at',
  'cancel_reason',
  'created_at',
  'updated_at',
].join(', ');

type ReturnOrdersDomainErrorCode =
  | 'RETURN_ORDER_NOT_FOUND'
  | 'RETURN_ORDER_SOURCE_REQUIRED'
  | 'RETURN_ORDER_SOURCE_NOT_ALLOWED'
  | 'RETURN_ORDER_ALREADY_ACTIVE'
  | 'RETURN_ORDER_STATUS_INVALID'
  | 'RETURN_ORDER_STATUS_TRANSITION_INVALID'
  | 'RETURN_ORDER_ACTUAL_DATE_REQUIRED'
  | 'RETURN_ORDER_DEPOSIT_REFUND_PENDING'
  | 'RETURN_ORDER_SETTLE_INVALID';

interface ReturnOrdersDomainErrorContext {
  [key: string]: unknown;
}

export class ReturnOrdersDomainError extends Error {
  readonly code: ReturnOrdersDomainErrorCode;
  readonly context: ReturnOrdersDomainErrorContext;

  constructor(
    code: ReturnOrdersDomainErrorCode,
    context: ReturnOrdersDomainErrorContext = {},
  ) {
    super(code);
    this.name = 'ReturnOrdersDomainError';
    this.code = code;
    this.context = context;
  }
}

export interface ReturnOrderRow {
  id: string;
  branch_id: string;
  return_code: string;
  source_rental_order_id: string;
  source_rental_order_status: string;
  status: string;
  deposit_refund_status: string;
  actual_return_date: string;
  expected_return_date: string | null;
  total_amount: number | string | null;
  deposit_collected_amount: number | string | null;
  deposit_refunded_amount: number | string | null;
  outstanding_amount: number | string | null;
  note: string | null;
  internal_note: string | null;
  settled_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function parseNumeric(
  value: number | string | null | undefined,
): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function parseIsoDateString(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function uniqueStringValues(
  values: Array<string | null | undefined>,
): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

export function normalizeReturnOrderStatus(
  value: string | null | undefined,
): ReturnOrderStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!RETURN_ORDER_STATUS_SET.has(normalized)) return null;
  return normalized as ReturnOrderStatus;
}

export function normalizeReturnDepositRefundStatus(
  value: string | null | undefined,
): ReturnDepositRefundStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!RETURN_DEPOSIT_REFUND_STATUS_SET.has(normalized)) return null;
  return normalized as ReturnDepositRefundStatus;
}

export function resolveDepositRefundStatusFromOrder(
  sourceOrder: OrderDetailDto,
): ReturnDepositRefundStatus {
  const refundableDeposit = roundMoney(
    Math.max(0, parseNumeric(sourceOrder.summary.money.refundableDeposit)),
  );
  const depositPaid = roundMoney(
    Math.max(0, parseNumeric(sourceOrder.summary.money.depositPaid)),
  );
  const depositRefunded = roundMoney(
    Math.max(0, parseNumeric(sourceOrder.summary.money.depositRefundedAmount)),
  );

  if (refundableDeposit > 0.001) return 'PENDING';
  if (depositPaid <= 0.001) return 'NOT_REQUIRED';
  if (depositRefunded > 0.001) return 'REFUNDED';
  return 'NOT_REQUIRED';
}

export function buildReturnCode(sourceOrderCode: string): string {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const sourcePart = sourceOrderCode
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(-6)
    .toUpperCase();
  return `RET-${datePart}-${sourcePart}-${randomPart}`;
}

export function mapReturnOrderDetail(
  row: ReturnOrderRow,
  sourceOrder: OrderDetailDto,
): ReturnOrderDetailDto {
  const status = normalizeReturnOrderStatus(row.status);
  const depositRefundStatus = normalizeReturnDepositRefundStatus(
    row.deposit_refund_status,
  );
  if (!status || !depositRefundStatus) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_STATUS_INVALID', {
      returnOrderId: row.id,
      status: row.status,
      depositRefundStatus: row.deposit_refund_status,
    });
  }

  return {
    summary: {
      id: row.id,
      branchId: row.branch_id,
      returnCode: row.return_code,
      sourceRentalOrderId: row.source_rental_order_id,
      sourceRentalOrderCode: sourceOrder.summary.orderCode,
      sourceRentalOrderStatus: sourceOrder.summary.status,
      status,
      depositRefundStatus,
      actualReturnDate: row.actual_return_date,
      expectedReturnDate: row.expected_return_date,
      totalAmount: roundMoney(parseNumeric(row.total_amount)),
      depositCollectedAmount: roundMoney(
        parseNumeric(row.deposit_collected_amount),
      ),
      depositRefundedAmount: roundMoney(
        parseNumeric(row.deposit_refunded_amount),
      ),
      outstandingAmount: roundMoney(parseNumeric(row.outstanding_amount)),
      note: row.note,
      internalNote: row.internal_note,
      settledAt: row.settled_at,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      cancelReason: row.cancel_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    sourceOrder,
  };
}

export async function fetchReturnOrderRowById(
  supabase: SupabaseClient,
  returnOrderId: string,
): Promise<ReturnOrderRow | null> {
  const { data, error } = await supabase
    .from('return_orders')
    .select(RETURN_ORDER_SELECT)
    .eq('id', returnOrderId)
    .eq('is_delete', false)
    .maybeSingle<ReturnOrderRow>();

  if (error) throw error;
  return data ?? null;
}

export function assertSourceOrderEligible(sourceOrder: OrderDetailDto): void {
  if (sourceOrder.summary.orderType !== 'RENTAL') {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SOURCE_NOT_ALLOWED', {
      sourceOrderId: sourceOrder.summary.id,
      orderType: sourceOrder.summary.orderType,
    });
  }

  if (sourceOrder.summary.status !== 'PICKED_UP') {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SOURCE_NOT_ALLOWED', {
      sourceOrderId: sourceOrder.summary.id,
      status: sourceOrder.summary.status,
      reason: 'source-order-must-be-picked-up',
    });
  }
}

export async function assertNoActiveReturnOrderForSource(
  supabase: SupabaseClient,
  sourceRentalOrderId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('return_orders')
    .select('id, status')
    .eq('source_rental_order_id', sourceRentalOrderId)
    .eq('is_delete', false)
    .in('status', ACTIVE_RETURN_ORDER_STATUSES)
    .limit(1)
    .maybeSingle<{ id: string; status: string }>();

  if (error) throw error;
  if (data) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_ALREADY_ACTIVE', {
      sourceRentalOrderId,
      activeReturnOrderId: data.id,
      status: data.status,
    });
  }
}

export async function loadReturnOrderDetail(
  supabase: SupabaseClient,
  row: ReturnOrderRow,
): Promise<ReturnOrderDetailDto> {
  const sourceOrder = await getOrderDetailForAdmin(
    supabase,
    row.source_rental_order_id,
  );
  if (!sourceOrder) {
    throw new ReturnOrdersDomainError('RETURN_ORDER_SOURCE_NOT_ALLOWED', {
      sourceOrderId: row.source_rental_order_id,
      reason: 'source-order-not-found',
    });
  }

  return mapReturnOrderDetail(row, sourceOrder);
}
