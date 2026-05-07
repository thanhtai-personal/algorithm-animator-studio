import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateProcurementReceiptPayload,
  ProcurementReceiptDetailDto,
} from '../../types/procurement-module.type';
import { INTAKE_CHANNEL_SET } from './procurement.constants';
import { getErrorMessage } from './procurement.domain-error';
import {
  normalizeIntakeChannel,
  normalizePaymentMethod,
  roundMoney,
  sanitizeText,
} from './procurement.common';
import { cleanupFailedProcurementReceiptDraft } from './procurement.intake-helpers';
import { normalizeProcurementLineInput } from './procurement.create-lines';
import { getProcurementReceiptDetailForActor } from './procurement.receipts';
import {
  generateReceiptCode,
  resolveProcurementActorContext,
} from './procurement.actor-context';
import { ProcurementDomainError } from './procurement.domain-error';
import type { InsertedProcurementReceiptRow } from './procurement.internal-types';

export async function createProcurementReceiptForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateProcurementReceiptPayload;
  },
): Promise<ProcurementReceiptDetailDto> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
  });

  const intakeChannel =
    normalizeIntakeChannel(options.payload.intakeChannel ?? null) ?? 'MANUAL';

  if (!INTAKE_CHANNEL_SET.has(intakeChannel)) {
    throw new ProcurementDomainError('INVALID_INTAKE_CHANNEL', {
      intakeChannel: options.payload.intakeChannel,
    });
  }

  const lines = Array.isArray(options.payload.lines)
    ? options.payload.lines
    : [];
  if (lines.length === 0) {
    throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
      reason: 'empty-lines',
    });
  }

  const normalizedLineInputs = lines.map((line, index) =>
    normalizeProcurementLineInput(line, index),
  );

  const totalQuantity = normalizedLineInputs.reduce(
    (sum, line) => sum + line.quantity,
    0,
  );
  const totalCostAmount = roundMoney(
    normalizedLineInputs.reduce(
      (sum, line) => sum + line.quantity * line.unitCostAmount,
      0,
    ),
  );

  const expensePayment = options.payload.expensePayment;
  const expenseAmount = options.payload.expensePayment
    ? roundMoney(Number(options.payload.expensePayment.amount))
    : totalCostAmount;
  let expenseMethod: 'CASH' | 'BANK' | 'MOMO' | null = 'CASH';
  let expenseReason: string | null = null;
  let expenseNote: string | null = null;

  if (expensePayment) {
    const requestedAmount = roundMoney(Number(expensePayment.amount));
    const normalizedMethod = normalizePaymentMethod(expensePayment.method);
    expenseReason =
      sanitizeText(expensePayment.reason) ?? 'PROCUREMENT_INTAKE_EXPENSE';
    expenseNote = sanitizeText(expensePayment.note);

    if (!Number.isFinite(requestedAmount) || requestedAmount < 0) {
      throw new ProcurementDomainError('INVALID_PAYMENT_AMOUNT', {
        amount: expensePayment.amount,
      });
    }

    if (!normalizedMethod) {
      throw new ProcurementDomainError('INVALID_PAYMENT_METHOD', {
        method: expensePayment.method,
      });
    }

    expenseMethod = normalizedMethod;
  } else {
    expenseReason = 'PROCUREMENT_INTAKE_EXPENSE';
  }

  const receiptCode = await generateReceiptCode(supabase, context.branchId);

  let insertedReceipt: InsertedProcurementReceiptRow | null = null;

  try {
    const { data: nextReceipt, error: receiptInsertError } = await supabase
      .from('procurement_receipts')
      .insert({
        branch_id: context.branchId,
        receipt_code: receiptCode,
        intake_channel: intakeChannel,
        intake_source_file_name: sanitizeText(
          options.payload.intakeSourceFileName,
        ),
        supplier_name: sanitizeText(options.payload.supplierName),
        supplier_phone: sanitizeText(options.payload.supplierPhone),
        note: sanitizeText(options.payload.note),
        total_quantity: totalQuantity,
        total_cost_amount: totalCostAmount,
        payment_expense_amount: expenseAmount > 0 ? expenseAmount : 0,
        payment_method: expenseAmount > 0 ? expenseMethod : null,
        payment_note: expenseAmount > 0 ? expenseNote : null,
        paid_at: expenseAmount > 0 ? new Date().toISOString() : null,
        is_delete: false,
        created_by: context.actor.id,
        updated_by: context.actor.id,
      })
      .select('id, receipt_code, branch_id, created_at')
      .maybeSingle<InsertedProcurementReceiptRow>();

    if (receiptInsertError) throw receiptInsertError;
    if (!nextReceipt) {
      throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
        reason: 'insert-receipt-failed',
      });
    }
    insertedReceipt = nextReceipt;
    const insertedReceiptRow = insertedReceipt;
    if (!insertedReceiptRow) {
      throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
        reason: 'insert-receipt-failed',
      });
    }

    if (expenseAmount > 0 && expenseMethod) {
      const { error: paymentInsertError } = await supabase
        .from('payments')
        .insert({
          branch_id: context.branchId,
          order_id: null,
          procurement_receipt_id: insertedReceiptRow.id,
          customer_id: null,
          type: 'EXPENSE',
          method: expenseMethod,
          amount: expenseAmount,
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
      if (paymentInsertError) throw paymentInsertError;
    }

    const { error: receiptItemsInsertError } = await supabase
      .from('procurement_receipt_items')
      .insert(
        normalizedLineInputs.map((line) => ({
          receipt_id: insertedReceiptRow.id,
          branch_id: context.branchId,
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

    if (receiptItemsInsertError) throw receiptItemsInsertError;

    await supabase.from('audit_events').insert({
      branch_id: context.branchId,
      actor_profile_id: context.actor.id,
      entity_type: 'PROCUREMENT_RECEIPT',
      entity_id: insertedReceiptRow.id,
      action: 'PROCUREMENT_RECEIPT_CREATED',
      after_data: {
        receiptCode: insertedReceiptRow.receipt_code,
        intakeChannel,
        totalQuantity,
        totalCostAmount,
        paymentExpenseAmount: expenseAmount,
        lineCount: normalizedLineInputs.length,
        productCreationMode: 'DEFERRED',
      },
      meta: {
        source: intakeChannel,
        intakeSourceFileName: sanitizeText(
          options.payload.intakeSourceFileName,
        ),
      },
    });

    const detail = await getProcurementReceiptDetailForActor(supabase, {
      actorProfileId: context.actor.id,
      receiptId: insertedReceiptRow.id,
    });

    if (!detail) {
      throw new ProcurementDomainError('RECEIPT_NOT_FOUND', {
        receiptId: insertedReceiptRow.id,
      });
    }

    return detail;
  } catch (error) {
    try {
      if (insertedReceipt) {
        await cleanupFailedProcurementReceiptDraft(supabase, {
          branchId: context.branchId,
          receiptId: insertedReceipt.id,
          receiptCode: insertedReceipt.receipt_code,
          createdProductIds: [],
        });
      }
    } catch (cleanupError) {
      console.error('Procurement cleanup failed (server)', {
        errorMessage: getErrorMessage(cleanupError),
        receiptId: insertedReceipt?.id ?? null,
      });
    }
    throw error;
  }
}
