import type { SupabaseClient } from '@supabase/supabase-js';
import type { PaymentListItemDto } from '../../types/payments-domain.type';
import type {
  CreatePosManualPaymentPayload,
  PosManualPaymentType,
} from '../../types/payments-domain.type';
import { attachPaymentReceiptUploadSessions } from './payment-receipt-attachments';
import {
  fetchActorBranchAccessIds,
  fetchActorProfile,
  normalizePaymentMethod,
  parseNumeric,
  PaymentsDomainError,
  resolveBranchScope,
  roundMoney,
  sanitizeText,
  type PaymentRow,
} from './shared-core';
import { enrichPayments } from './shared-enrichment';

const POS_MANUAL_PAYMENT_SOURCE_MAP: Record<PosManualPaymentType, string> = {
  FEE: 'POS_SURCHARGE',
  EXPENSE: 'POS_EXPENSE',
};

function normalizeManualPaymentType(
  value: string | null | undefined,
): PosManualPaymentType | null {
  const normalized = sanitizeText(value)?.toUpperCase() ?? null;
  if (normalized === 'FEE' || normalized === 'EXPENSE') {
    return normalized;
  }
  return null;
}

function resolveSingleBranchId(options: {
  branchScope: string[];
  requestedBranchId: string | null;
  actorDefaultBranchId: string | null;
}): string {
  if (options.requestedBranchId) {
    return options.requestedBranchId;
  }

  if (
    options.actorDefaultBranchId &&
    options.branchScope.includes(options.actorDefaultBranchId)
  ) {
    return options.actorDefaultBranchId;
  }

  const fallbackBranchId = options.branchScope[0] ?? null;
  if (!fallbackBranchId) {
    throw new PaymentsDomainError('MISSING_BRANCH_CONTEXT', {
      reason: 'create-manual-payment-empty-branch-scope',
    });
  }

  return fallbackBranchId;
}

export async function createManualPaymentForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreatePosManualPaymentPayload;
  },
): Promise<PaymentListItemDto> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new PaymentsDomainError('FORBIDDEN_PAYMENT_CREATE', {
      reason: 'missing-actor-profile',
    });
  }

  const type = normalizeManualPaymentType(options.payload.type);
  if (!type) {
    throw new PaymentsDomainError('INVALID_PAYMENT_TYPE', {
      type: options.payload.type,
      expected: ['FEE', 'EXPENSE'],
    });
  }

  const method = normalizePaymentMethod(options.payload.method);
  if (!method) {
    throw new PaymentsDomainError('INVALID_PAYMENT_METHOD', {
      method: options.payload.method,
    });
  }

  const amount = roundMoney(Math.max(0, parseNumeric(options.payload.amount)));
  if (amount <= 0) {
    throw new PaymentsDomainError('INVALID_PAYMENT_AMOUNT', {
      amount: options.payload.amount,
    });
  }

  const reason = sanitizeText(options.payload.reason);
  if (!reason) {
    throw new PaymentsDomainError('INVALID_PAYMENT_REASON');
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );
  const requestedBranchId = sanitizeText(options.payload.branchId ?? null);
  const branchScope = resolveBranchScope({
    actor,
    allowedBranchIds,
    requestedBranchId,
  });
  const branchId = resolveSingleBranchId({
    branchScope,
    requestedBranchId,
    actorDefaultBranchId: actor.default_branch_id,
  });

  const isImportOrder =
    type === 'EXPENSE' && options.payload.isImportOrder === true;
  const isInitialCapital = options.payload.isInitialCapital === true;
  const source = isImportOrder
    ? 'PROCUREMENT_INTAKE'
    : POS_MANUAL_PAYMENT_SOURCE_MAP[type];

  const { data, error } = await supabase
    .from('payments')
    .insert({
      branch_id: branchId,
      order_id: null,
      procurement_receipt_id: null,
      customer_id: null,
      type,
      method,
      amount,
      currency_code: 'VND',
      reason,
      source,
      is_import_order: isImportOrder,
      is_initial_capital: isInitialCapital,
      status: 'POSTED',
      note: sanitizeText(options.payload.note),
      reference_code: sanitizeText(options.payload.referenceCode),
      is_delete: false,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select(
      'id, branch_id, order_id, customer_id, type, method, amount, reason, source, is_import_order, is_initial_capital, status, note, reference_code, void_reason, voided_at, created_by, updated_by, created_at, updated_at',
    )
    .maybeSingle<PaymentRow>();

  if (error) throw error;
  if (!data) {
    throw new PaymentsDomainError('INVALID_PAYMENT_AMOUNT', {
      reason: 'create-manual-payment-returned-empty',
    });
  }

  let attachmentCount = 0;
  try {
    attachmentCount = await attachPaymentReceiptUploadSessions(supabase, {
      actorProfileId: options.actorProfileId,
      paymentId: data.id,
      branchId,
      uploadSessionIds: options.payload.receiptUploadSessionIds ?? [],
    });
  } catch (error) {
    await supabase
      .from('payments')
      .update({
        is_delete: true,
        status: 'VOIDED',
        void_reason: 'Receipt attachment failed',
        updated_by: options.actorProfileId,
      })
      .eq('id', data.id);
    throw error;
  }

  const [enriched] = await enrichPayments(supabase, [data], [branchId]);
  return {
    ...enriched,
    attachmentCount,
  };
}
