import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProcurementReceiptDetailDto,
  UpdateProcurementReceiptPayload,
} from '../../types/procurement-module.type';
import {
  normalizePaymentMethod,
  parseNumeric,
  parseProcurementRollbackNote,
  roundMoney,
  sanitizeText,
} from './procurement.common';
import { ProcurementDomainError } from './procurement.domain-error';
import {
  assertProcurementRollbackRole,
  resolveProcurementActorContext,
} from './procurement.actor-context';
import { getReceiptById } from './procurement.receipt-repo';
import { getProcurementReceiptDetailForActor } from './procurement.receipts';
import { fetchProcurementPaymentsByReceiptId } from './procurement.rollback-helpers';
import { normalizeProcurementLineInput } from './procurement.create-lines';

export async function updateProcurementReceiptForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    receiptId: string;
    payload: UpdateProcurementReceiptPayload;
  },
): Promise<ProcurementReceiptDetailDto> {
  const receipt = await getReceiptById(supabase, options.receiptId);
  if (!receipt) {
    throw new ProcurementDomainError('RECEIPT_NOT_FOUND', {
      receiptId: options.receiptId,
    });
  }

  const parsedRollbackNote = parseProcurementRollbackNote(receipt.note);
  if (parsedRollbackNote.rollbackMeta) {
    throw new ProcurementDomainError(
      'PROCUREMENT_RECEIPT_ALREADY_ROLLED_BACK',
      {
        receiptId: receipt.id,
        receiptCode: receipt.receipt_code,
        rolledBackAt: parsedRollbackNote.rollbackMeta.at,
      },
    );
  }

  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: receipt.branch_id,
  });
  assertProcurementRollbackRole(context.role);

  const rawLines = Array.isArray(options.payload.lines)
    ? options.payload.lines
    : [];
  if (rawLines.length === 0) {
    throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
      reason: 'empty-lines',
    });
  }

  const normalizedLines = rawLines.map((line, index) =>
    normalizeProcurementLineInput(line, index),
  );

  const { error: deleteOldRowsError } = await supabase
    .from('procurement_receipt_items')
    .update({ is_delete: true })
    .eq('receipt_id', receipt.id)
    .eq('is_delete', false);
  if (deleteOldRowsError) throw deleteOldRowsError;

  const { error: insertNextRowsError } = await supabase
    .from('procurement_receipt_items')
    .insert(
      normalizedLines.map((line) => ({
        receipt_id: receipt.id,
        branch_id: receipt.branch_id,
        product_id: null,
        product_code_snapshot: line.productCode,
        product_name_snapshot: line.name,
        quantity: line.quantity,
        unit_cost_amount: line.unitCostAmount,
        line_total_amount: roundMoney(line.quantity * line.unitCostAmount),
        rent_price_per_day: line.rentPricePerDay,
        quick_rent_price: line.quickRentPrice,
        purchase_price: line.purchasePrice,
        sale_price: line.salePrice,
        category_code_snapshot: line.categoryCode,
        is_rentable: line.isRentable,
        is_saleable: line.isSaleable,
        material: line.material,
        gender: line.gender,
        description: line.description,
        cover_image_url: line.coverImageUrl,
        item_size: line.itemSize,
        note: line.note,
        is_delete: false,
      })),
    );
  if (insertNextRowsError) throw insertNextRowsError;

  const totalQuantity = normalizedLines.reduce(
    (sum, line) => sum + line.quantity,
    0,
  );
  const totalCostAmount = roundMoney(
    normalizedLines.reduce(
      (sum, line) => sum + line.quantity * line.unitCostAmount,
      0,
    ),
  );

  const linkedPayments = await fetchProcurementPaymentsByReceiptId(
    supabase,
    receipt.id,
  );
  const firstPayment = linkedPayments[0] ?? null;

  const requestedMethod = options.payload.expensePayment
    ? normalizePaymentMethod(options.payload.expensePayment.method)
    : null;
  const requestedExpenseAmount =
    options.payload.expensePayment?.amount === undefined
      ? null
      : roundMoney(Number(options.payload.expensePayment.amount));
  const expenseMethod =
    requestedMethod ?? normalizePaymentMethod(firstPayment?.method) ?? 'CASH';
  const expenseReason =
    sanitizeText(options.payload.expensePayment?.reason) ??
    sanitizeText(firstPayment?.reason) ??
    'PROCUREMENT_INTAKE_EXPENSE';
  const expenseNote =
    sanitizeText(options.payload.expensePayment?.note) ??
    sanitizeText(firstPayment?.note) ??
    null;

  const paymentExpenseAmount =
    requestedExpenseAmount !== null ? requestedExpenseAmount : totalCostAmount;

  if (paymentExpenseAmount > 0) {
    if (firstPayment) {
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          amount: paymentExpenseAmount,
          method: expenseMethod,
          reason: expenseReason,
          note: expenseNote,
          status: 'POSTED',
          void_reason: null,
          voided_at: null,
          is_import_order: true,
          updated_by: context.actor.id,
        })
        .eq('id', firstPayment.id)
        .eq('is_delete', false);
      if (updatePaymentError) throw updatePaymentError;

      const otherPaymentIds = linkedPayments.slice(1).map((row) => row.id);
      if (otherPaymentIds.length > 0) {
        const { error: voidOtherPaymentsError } = await supabase
          .from('payments')
          .update({
            status: 'VOIDED',
            void_reason: 'PROCUREMENT_RECEIPT_EDIT_MERGED',
            voided_at: new Date().toISOString(),
            updated_by: context.actor.id,
          })
          .in('id', otherPaymentIds)
          .eq('is_delete', false);
        if (voidOtherPaymentsError) throw voidOtherPaymentsError;
      }
    } else {
      const { error: insertPaymentError } = await supabase
        .from('payments')
        .insert({
          branch_id: receipt.branch_id,
          order_id: null,
          procurement_receipt_id: receipt.id,
          customer_id: null,
          type: 'EXPENSE',
          method: expenseMethod,
          amount: paymentExpenseAmount,
          currency_code: 'VND',
          reason: expenseReason,
          source: 'PROCUREMENT_INTAKE',
          status: 'POSTED',
          note: expenseNote,
          is_import_order: true,
          created_by: context.actor.id,
          updated_by: context.actor.id,
          is_delete: false,
        });
      if (insertPaymentError) throw insertPaymentError;
    }
  } else if (linkedPayments.length > 0) {
    const { error: voidPaymentsError } = await supabase
      .from('payments')
      .update({
        status: 'VOIDED',
        void_reason: 'PROCUREMENT_RECEIPT_EDIT_ZERO_AMOUNT',
        voided_at: new Date().toISOString(),
        updated_by: context.actor.id,
      })
      .in(
        'id',
        linkedPayments.map((row) => row.id),
      )
      .eq('is_delete', false);
    if (voidPaymentsError) throw voidPaymentsError;
  }

  const { error: updateReceiptError } = await supabase
    .from('procurement_receipts')
    .update({
      supplier_name: sanitizeText(options.payload.supplierName),
      supplier_phone: sanitizeText(options.payload.supplierPhone),
      note: sanitizeText(options.payload.note),
      total_quantity: totalQuantity,
      total_cost_amount: totalCostAmount,
      payment_expense_amount:
        paymentExpenseAmount > 0 ? paymentExpenseAmount : 0,
      payment_method: paymentExpenseAmount > 0 ? expenseMethod : null,
      payment_note: paymentExpenseAmount > 0 ? expenseNote : null,
      paid_at: paymentExpenseAmount > 0 ? new Date().toISOString() : null,
      updated_by: context.actor.id,
    })
    .eq('id', receipt.id)
    .eq('is_delete', false);
  if (updateReceiptError) throw updateReceiptError;

  await supabase.from('audit_events').insert({
    branch_id: receipt.branch_id,
    actor_profile_id: context.actor.id,
    entity_type: 'PROCUREMENT_RECEIPT',
    entity_id: receipt.id,
    action: 'PROCUREMENT_RECEIPT_UPDATED',
    before_data: {
      receiptCode: receipt.receipt_code,
      totalQuantity: parseNumeric(receipt.total_quantity),
      totalCostAmount: parseNumeric(receipt.total_cost_amount),
    },
    after_data: {
      receiptCode: receipt.receipt_code,
      totalQuantity,
      totalCostAmount,
      lineCount: normalizedLines.length,
      paymentExpenseAmount,
    },
    meta: {
      correctionFlow: 'EDIT_IN_PLACE',
      productCreationMode: 'DEFERRED',
    },
  });

  const detail = await getProcurementReceiptDetailForActor(supabase, {
    actorProfileId: context.actor.id,
    receiptId: receipt.id,
  });

  if (!detail) {
    throw new ProcurementDomainError('RECEIPT_NOT_FOUND', {
      receiptId: receipt.id,
    });
  }

  return detail;
}
