import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProcurementReceiptRollbackResultDto,
  RollbackProcurementReceiptPayload,
} from '../../types/procurement-module.type';
import { sanitizeText } from './procurement.common';
import { ProcurementDomainError } from './procurement.domain-error';
import {
  assertProcurementRollbackRole,
  resolveProcurementActorContext,
} from './procurement.actor-context';
import { getReceiptById } from './procurement.receipt-repo';

export async function rollbackProcurementReceiptForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    receiptId: string;
    payload?: RollbackProcurementReceiptPayload | null;
  },
): Promise<ProcurementReceiptRollbackResultDto> {
  const receipt = await getReceiptById(supabase, options.receiptId);
  if (!receipt) {
    throw new ProcurementDomainError('RECEIPT_NOT_FOUND', {
      receiptId: options.receiptId,
    });
  }

  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: receipt.branch_id,
  });
  assertProcurementRollbackRole(context.role);

  const nowIso = new Date().toISOString();
  const reason = sanitizeText(options.payload?.reason ?? null);

  const { error } = await supabase
    .from('procurement_receipts')
    .update({
      is_delete: true,
      updated_by: context.actor.id,
    })
    .eq('id', receipt.id)
    .eq('is_delete', false);

  if (error) throw error;

  await supabase.from('audit_events').insert({
    branch_id: receipt.branch_id,
    actor_profile_id: context.actor.id,
    entity_type: 'PROCUREMENT_RECEIPT',
    entity_id: receipt.id,
    action: 'PROCUREMENT_RECEIPT_DELETED',
    reason,
    before_data: {
      receiptCode: receipt.receipt_code,
      isDelete: false,
    },
    after_data: {
      receiptCode: receipt.receipt_code,
      isDelete: true,
      deletedAt: nowIso,
    },
    meta: {
      reason,
      productLifecycle: 'DECOUPLED',
      paymentLifecycle: 'DECOUPLED',
    },
  });

  return {
    receiptId: receipt.id,
    receiptCode: receipt.receipt_code,
    rolledBackAt: nowIso,
    retiredItemCount: 0,
    voidedPaymentCount: 0,
  };
}
