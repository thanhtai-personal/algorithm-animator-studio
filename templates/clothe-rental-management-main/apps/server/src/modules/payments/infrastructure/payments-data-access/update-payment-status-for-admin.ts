import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PaymentListItemDto,
  UpdatePaymentStatusPayload,
} from '../../types/payments-domain.type';
import {
  fetchActorBranchAccessIds,
  fetchActorProfile,
  isOwnerAdminRole,
  normalizePaymentStatus,
  PAYMENT_ROW_SELECT,
  type PaymentRow,
  PaymentsDomainError,
  sanitizeText,
} from './shared-core';
import { enrichPayments } from './shared-enrichment';

export async function updatePaymentStatusForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    paymentId: string;
    payload: UpdatePaymentStatusPayload;
  },
): Promise<PaymentListItemDto> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new PaymentsDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  if (!isOwnerAdminRole(actor.role)) {
    throw new PaymentsDomainError('FORBIDDEN_PAYMENT_STATUS_UPDATE', {
      role: actor.role,
    });
  }

  const normalizedStatus = normalizePaymentStatus(options.payload.status);
  if (!normalizedStatus) {
    throw new PaymentsDomainError('INVALID_PAYMENT_STATUS', {
      status: options.payload.status,
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

  const currentStatus = normalizePaymentStatus(payment.status);
  if (!currentStatus) {
    throw new PaymentsDomainError('INVALID_PAYMENT_STATUS', {
      status: payment.status,
      paymentId: payment.id,
    });
  }

  if (currentStatus === normalizedStatus) {
    const [mapped] = await enrichPayments(
      supabase,
      [payment],
      allowedBranchIds,
    );
    if (!mapped) {
      throw new PaymentsDomainError('PAYMENT_NOT_FOUND', {
        paymentId: payment.id,
      });
    }
    return mapped;
  }

  const isValidTransition =
    (currentStatus === 'POSTED' && normalizedStatus === 'VOIDED') ||
    (currentStatus === 'VOIDED' && normalizedStatus === 'POSTED');

  if (!isValidTransition) {
    throw new PaymentsDomainError('PAYMENT_STATUS_TRANSITION_INVALID', {
      paymentId: payment.id,
      fromStatus: currentStatus,
      toStatus: normalizedStatus,
    });
  }

  const nowIso = new Date().toISOString();
  const nextVoidReason =
    normalizedStatus === 'VOIDED'
      ? sanitizeText(options.payload.voidReason)
      : null;

  const { data: updatedPayment, error: updateError } = await supabase
    .from('payments')
    .update({
      status: normalizedStatus,
      void_reason: nextVoidReason,
      voided_at: normalizedStatus === 'VOIDED' ? nowIso : null,
      updated_by: options.actorProfileId,
    })
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
    action: 'PAYMENT_STATUS_UPDATED',
    reason: nextVoidReason,
    before_data: {
      status: currentStatus,
      void_reason: payment.void_reason,
    },
    after_data: {
      status: normalizedStatus,
      void_reason: updatedPayment.void_reason,
    },
    meta: {
      event: 'payment-status-updated-manual',
      source: 'payments-module',
    },
  });

  if (auditError) throw auditError;

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
