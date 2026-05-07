import type { SupabaseClient } from '@supabase/supabase-js';
import {
  roundMoney,
  parseNumeric,
  sanitizeItemCodeToken,
  sanitizeText,
} from './procurement.common';
import type {
  InsertedItemRow,
  ProcurementProductRow,
} from './procurement.internal-types';

export function buildProcurementIntakeItemInsertRows(options: {
  actorProfileId: string;
  branchId: string;
  receiptCode: string;
  lines: Array<{
    productId: string;
    productCode: string;
    quantity: number;
    itemSize: string | null;
  }>;
}): Array<{
  branch_id: string;
  product_id: string;
  item_code: string;
  size: string | null;
  status: string;
  created_by: string;
  updated_by: string;
  is_delete: boolean;
}> {
  const receiptToken = sanitizeItemCodeToken(options.receiptCode, 'PROC');
  const runningIndexByProductToken = new Map<string, number>();

  const itemInsertRows: Array<{
    branch_id: string;
    product_id: string;
    item_code: string;
    size: string | null;
    status: string;
    created_by: string;
    updated_by: string;
    is_delete: boolean;
  }> = [];

  for (const line of options.lines) {
    const productToken = sanitizeItemCodeToken(line.productCode, 'ITEM');

    for (let index = 0; index < line.quantity; index += 1) {
      const sequenceKey = productToken;
      const current = (runningIndexByProductToken.get(sequenceKey) ?? 0) + 1;
      runningIndexByProductToken.set(sequenceKey, current);
      const itemCode = `${productToken}-${receiptToken}-${String(current).padStart(3, '0')}`;

      itemInsertRows.push({
        branch_id: options.branchId,
        product_id: line.productId,
        item_code: itemCode,
        size: line.itemSize,
        status: 'READY',
        created_by: options.actorProfileId,
        updated_by: options.actorProfileId,
        is_delete: false,
      });
    }
  }

  return itemInsertRows;
}

export async function assertProcurementItemCodesAvailable(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    itemInsertRows: Array<{
      item_code: string;
    }>;
  },
): Promise<void> {
  const itemCodes = Array.from(
    new Set(options.itemInsertRows.map((row) => row.item_code)),
  );
  if (itemCodes.length === 0) return;

  const { data, error } = await supabase
    .from('items')
    .select('item_code')
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .in('item_code', itemCodes)
    .returns<Array<{ item_code: string }>>();

  if (error) throw error;

  const conflicts = (data ?? [])
    .map((row) => sanitizeText(row.item_code))
    .filter((value): value is string => Boolean(value));

  if (conflicts.length > 0) {
    throw new Error(`Duplicate generated item code: ${conflicts[0]}`);
  }
}

export async function deleteCreatedProductsBestEffort(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<void> {
  const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueProductIds.length === 0) return;

  await supabase
    .from('products')
    .delete()
    .in('id', uniqueProductIds)
    .eq('is_delete', false);
}

export async function cleanupFailedProcurementReceiptDraft(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    receiptId: string;
    receiptCode: string;
    createdProductIds: string[];
  },
): Promise<void> {
  const receiptToken = sanitizeItemCodeToken(options.receiptCode, 'PROC');
  const likeToken = `%${receiptToken}%`;

  const { data: intakeItems } = await supabase
    .from('items')
    .select('id, item_code')
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .ilike('item_code', likeToken)
    .returns<Array<{ id: string; item_code: string }>>();

  const itemIds = (intakeItems ?? [])
    .filter((row) => row.item_code.includes(`-${receiptToken}-`))
    .map((row) => row.id);

  if (itemIds.length > 0) {
    await supabase
      .from('item_status_logs')
      .delete()
      .eq('reason_code', 'PROCUREMENT_INTAKE_CREATE')
      .in('item_id', itemIds)
      .eq('is_delete', false);
    await supabase
      .from('items')
      .delete()
      .in('id', itemIds)
      .eq('is_delete', false);
  }

  await supabase
    .from('payments')
    .delete()
    .eq('procurement_receipt_id', options.receiptId)
    .eq('is_delete', false);
  await supabase
    .from('procurement_receipt_items')
    .delete()
    .eq('receipt_id', options.receiptId)
    .eq('is_delete', false);
  await supabase
    .from('procurement_receipts')
    .delete()
    .eq('id', options.receiptId)
    .eq('is_delete', false);

  await deleteCreatedProductsBestEffort(supabase, options.createdProductIds);
}

export async function insertProcurementItemsAndLogs(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId: string;
    receiptCode: string;
    lines: Array<{
      productId: string;
      productCode: string;
      quantity: number;
      itemSize: string | null;
    }>;
  },
): Promise<void> {
  const itemInsertRows = buildProcurementIntakeItemInsertRows({
    actorProfileId: options.actorProfileId,
    branchId: options.branchId,
    receiptCode: options.receiptCode,
    lines: options.lines,
  });

  if (itemInsertRows.length === 0) return;

  const { data: insertedItems, error: itemInsertError } = await supabase
    .from('items')
    .insert(itemInsertRows)
    .select('id, item_code, status')
    .returns<InsertedItemRow[]>();

  if (itemInsertError) throw itemInsertError;

  const statusLogRows = (insertedItems ?? []).map((row) => ({
    branch_id: options.branchId,
    item_id: row.id,
    from_status: null,
    to_status: row.status,
    reason_code: 'PROCUREMENT_INTAKE_CREATE',
    reason_note: `Initial intake for ${row.item_code}`,
    actor_profile_id: options.actorProfileId,
  }));

  if (statusLogRows.length > 0) {
    const { error: statusLogError } = await supabase
      .from('item_status_logs')
      .insert(statusLogRows);
    if (statusLogError) throw statusLogError;
  }
}

export async function updateProductPurchasePriceByWeightedAverage(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    productsById: Map<string, ProcurementProductRow>;
    currentStockByProductId: Map<string, number>;
    intakeRows: Array<{
      productId: string;
      quantity: number;
      lineTotalAmount: number;
    }>;
  },
): Promise<void> {
  const intakeByProduct = new Map<
    string,
    { quantity: number; totalCost: number }
  >();

  for (const row of options.intakeRows) {
    const current = intakeByProduct.get(row.productId) ?? {
      quantity: 0,
      totalCost: 0,
    };
    current.quantity += row.quantity;
    current.totalCost = roundMoney(current.totalCost + row.lineTotalAmount);
    intakeByProduct.set(row.productId, current);
  }

  for (const [productId, intake] of intakeByProduct.entries()) {
    const product = options.productsById.get(productId);
    if (!product) continue;

    const currentStock = options.currentStockByProductId.get(productId) ?? 0;
    const oldPurchasePrice = roundMoney(
      Math.max(0, parseNumeric(product.purchase_price)),
    );

    const nextQuantity = currentStock + intake.quantity;
    const nextPurchasePrice =
      nextQuantity <= 0
        ? oldPurchasePrice
        : roundMoney(
            (oldPurchasePrice * currentStock + intake.totalCost) / nextQuantity,
          );

    const { error: updateError } = await supabase
      .from('products')
      .update({
        purchase_price: nextPurchasePrice,
        updated_by: options.actorProfileId,
      })
      .eq('id', productId)
      .eq('is_delete', false);

    if (updateError) throw updateError;
  }
}
