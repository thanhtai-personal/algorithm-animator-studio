import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PaymentListItemDto,
  UpdateManualPaymentPayload,
} from '../../types/payments-domain.type';
import {
  fetchActorBranchAccessIds,
  fetchActorProfile,
  isManagerPlusRole,
  normalizePaymentMethod,
  normalizePaymentType,
  parseNumeric,
  PAYMENT_ROW_SELECT,
  PaymentsDomainError,
  roundMoney,
  sanitizeText,
  type PaymentRow,
} from './shared-core';
import { attachPaymentReceiptUploadSessions } from './payment-receipt-attachments';
import { enrichPayments } from './shared-enrichment';

export async function updateManualPaymentForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    paymentId: string;
    payload: UpdateManualPaymentPayload;
  },
): Promise<PaymentListItemDto> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new PaymentsDomainError('FORBIDDEN_PAYMENT_UPDATE', {
      reason: 'missing-actor-profile',
    });
  }

  if (!isManagerPlusRole(actor.role)) {
    throw new PaymentsDomainError('FORBIDDEN_PAYMENT_UPDATE', {
      role: actor.role,
    });
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select(PAYMENT_ROW_SELECT)
    .eq('id', options.paymentId)
    .eq('is_delete', false)
    .maybeSingle<PaymentRow>();

  if (paymentError) throw paymentError;
  if (!payment) {
    throw new PaymentsDomainError('PAYMENT_NOT_FOUND', {
      paymentId: options.paymentId,
    });
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );

  if (!allowedBranchIds.includes(payment.branch_id)) {
    throw new PaymentsDomainError('FORBIDDEN_BRANCH_SCOPE', {
      paymentId: payment.id,
      branchId: payment.branch_id,
    });
  }

  if (payment.order_id) {
    throw new PaymentsDomainError('PAYMENT_EDIT_NOT_ALLOWED', {
      paymentId: payment.id,
      reason: 'order-linked-payment',
    });
  }

  const currentType = normalizePaymentType(payment.type);
  const currentMethod = normalizePaymentMethod(payment.method);
  if (!currentType || !currentMethod) {
    throw new PaymentsDomainError('INVALID_PAYMENT_UPDATE_PAYLOAD', {
      paymentId: payment.id,
      reason: 'invalid-current-type-or-method',
    });
  }

  const nextType = (() => {
    if (options.payload.type === undefined) return currentType;
    return normalizePaymentType(options.payload.type);
  })();
  if (!nextType || (nextType !== 'FEE' && nextType !== 'EXPENSE')) {
    throw new PaymentsDomainError('INVALID_PAYMENT_TYPE', {
      type: options.payload.type,
      expected: ['FEE', 'EXPENSE'],
    });
  }

  const nextMethod = (() => {
    if (options.payload.method === undefined) return currentMethod;
    return normalizePaymentMethod(options.payload.method);
  })();
  if (!nextMethod) {
    throw new PaymentsDomainError('INVALID_PAYMENT_METHOD', {
      method: options.payload.method,
    });
  }

  const nextAmount = (() => {
    if (options.payload.amount === undefined) {
      return parseNumeric(payment.amount);
    }
    return roundMoney(Math.max(0, parseNumeric(options.payload.amount)));
  })();
  if (nextAmount <= 0) {
    throw new PaymentsDomainError('INVALID_PAYMENT_AMOUNT', {
      amount: options.payload.amount,
    });
  }

  const nextReason = (() => {
    if (options.payload.reason === undefined) {
      return sanitizeText(payment.reason);
    }
    return sanitizeText(options.payload.reason);
  })();
  if (!nextReason) {
    throw new PaymentsDomainError('INVALID_PAYMENT_REASON');
  }

  const nextNote =
    options.payload.note === undefined
      ? sanitizeText(payment.note)
      : sanitizeText(options.payload.note);
  const nextReferenceCode =
    options.payload.referenceCode === undefined
      ? sanitizeText(payment.reference_code)
      : sanitizeText(options.payload.referenceCode);
  const nextIsInitialCapital =
    options.payload.isInitialCapital === undefined
      ? Boolean(payment.is_initial_capital)
      : options.payload.isInitialCapital === true;
  const nextIsImportOrder =
    nextType === 'EXPENSE' ? Boolean(payment.is_import_order) : false;
  const nextSource = nextIsImportOrder
    ? 'PROCUREMENT_INTAKE'
    : nextType === 'EXPENSE'
      ? 'POS_EXPENSE'
      : 'POS_SURCHARGE';

  const updatePayload: Record<string, unknown> = {
    type: nextType,
    method: nextMethod,
    amount: nextAmount,
    reason: nextReason,
    note: nextNote,
    reference_code: nextReferenceCode,
    source: nextSource,
    is_initial_capital: nextIsInitialCapital,
    is_import_order: nextIsImportOrder,
    updated_by: options.actorProfileId,
  };

  const { data: updatedPayment, error: updateError } = await supabase
    .from('payments')
    .update(updatePayload)
    .eq('id', payment.id)
    .eq('is_delete', false)
    .select(PAYMENT_ROW_SELECT)
    .maybeSingle<PaymentRow>();

  if (updateError) throw updateError;
  if (!updatedPayment) {
    throw new PaymentsDomainError('PAYMENT_NOT_FOUND', {
      paymentId: payment.id,
    });
  }

  const { error: auditError } = await supabase.from('audit_events').insert({
    branch_id: payment.branch_id,
    actor_profile_id: options.actorProfileId,
    entity_type: 'payment',
    entity_id: payment.id,
    action: 'PAYMENT_DETAILS_UPDATED',
    before_data: {
      type: currentType,
      method: currentMethod,
      amount: parseNumeric(payment.amount),
      reason: payment.reason,
      note: payment.note,
      reference_code: payment.reference_code,
      source: payment.source,
      is_initial_capital: Boolean(payment.is_initial_capital),
    },
    after_data: {
      type: nextType,
      method: nextMethod,
      amount: nextAmount,
      reason: nextReason,
      note: nextNote,
      reference_code: nextReferenceCode,
      source: nextSource,
      is_initial_capital: nextIsInitialCapital,
    },
    meta: {
      event: 'payment-details-updated-manual',
      source: 'payments-module',
    },
  });

  if (auditError) throw auditError;

  await attachPaymentReceiptUploadSessions(supabase, {
    actorProfileId: options.actorProfileId,
    paymentId: updatedPayment.id,
    branchId: updatedPayment.branch_id,
    uploadSessionIds: options.payload.receiptUploadSessionIds ?? [],
  });

  const [mapped] = await enrichPayments(
    supabase,
    [updatedPayment],
    allowedBranchIds,
  );
  if (!mapped) {
    throw new PaymentsDomainError('PAYMENT_NOT_FOUND', {
      paymentId: updatedPayment.id,
    });
  }

  return mapped;
}
