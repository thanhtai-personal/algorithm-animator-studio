import type { SupabaseClient } from '@supabase/supabase-js';
import type { PaymentsListQuery } from '../../types/payments-domain.type';
import {
  assertValidDateRange,
  buildDateFromBoundary,
  buildDateToBoundary,
  fetchActorBranchAccessIds,
  fetchActorProfile,
  isManagerPlusRole,
  normalizePaymentMethod,
  normalizePaymentType,
  PAYMENT_ROW_SELECT,
  type PaymentRow,
  PaymentsDomainError,
  resolveBranchScope,
  sanitizeText,
} from './shared-core';
import { enrichPayments } from './shared-enrichment';

export async function exportPaymentsCsvForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: PaymentsListQuery;
  },
): Promise<string> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new PaymentsDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  if (!isManagerPlusRole(actor.role)) {
    throw new PaymentsDomainError('FORBIDDEN_PAYMENT_EXPORT', {
      role: actor.role,
    });
  }

  const normalizedType =
    options.query.type === null || options.query.type === undefined
      ? null
      : normalizePaymentType(options.query.type);
  if (
    options.query.type !== null &&
    options.query.type !== undefined &&
    !normalizedType
  ) {
    throw new PaymentsDomainError('INVALID_PAYMENT_TYPE', {
      type: options.query.type,
    });
  }

  const normalizedMethod =
    options.query.method === null || options.query.method === undefined
      ? null
      : normalizePaymentMethod(options.query.method);
  if (
    options.query.method !== null &&
    options.query.method !== undefined &&
    !normalizedMethod
  ) {
    throw new PaymentsDomainError('INVALID_PAYMENT_METHOD', {
      method: options.query.method,
    });
  }

  const startDate = sanitizeText(options.query.startDate ?? null);
  const endDate = sanitizeText(options.query.endDate ?? null);
  assertValidDateRange(startDate, endDate);

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );

  const branchIds = resolveBranchScope({
    actor,
    allowedBranchIds,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  let query = supabase
    .from('payments')
    .select(PAYMENT_ROW_SELECT)
    .in('branch_id', branchIds)
    .eq('is_delete', false)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', buildDateFromBoundary(startDate));
  }

  if (endDate) {
    query = query.lte('created_at', buildDateToBoundary(endDate));
  }

  if (normalizedType) {
    query = query.eq('type', normalizedType);
  }

  if (normalizedMethod) {
    query = query.eq('method', normalizedMethod);
  }

  const { data, error } = await query.returns<PaymentRow[]>();
  if (error) throw error;

  const items = await enrichPayments(supabase, data ?? [], branchIds);

  const headers = [
    'created_at',
    'branch_id',
    'order_code',
    'customer_name',
    'customer_phone',
    'type',
    'method',
    'status',
    'amount',
    'signed_amount',
    'reason',
    'source',
    'is_import_order',
    'is_initial_capital',
    'note',
    'reference_code',
    'attachment_count',
    'void_reason',
    'voided_at',
    'created_by_name',
  ];

  const escapeCsv = (
    value: string | number | boolean | null | undefined,
  ): string => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) {
      return text;
    }
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [headers.join(',')];
  for (const item of items) {
    lines.push(
      [
        item.createdAt,
        item.branchId,
        item.orderCode,
        item.customerName,
        item.customerPhone,
        item.type,
        item.method,
        item.status,
        item.amount,
        item.signedAmount,
        item.reason,
        item.source,
        item.isImportOrder,
        item.isInitialCapital,
        item.note,
        item.referenceCode,
        item.attachmentCount,
        item.voidReason,
        item.voidedAt,
        item.createdByName,
      ]
        .map(escapeCsv)
        .join(','),
    );
  }

  return lines.join('\n');
}
