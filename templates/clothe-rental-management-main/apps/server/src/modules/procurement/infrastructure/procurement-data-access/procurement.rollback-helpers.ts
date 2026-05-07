import type { SupabaseClient } from '@supabase/supabase-js';
import { PROCUREMENT_ROLLBACK_BLOCKED_ITEM_STATUS_SET } from './procurement.constants';
import { ProcurementDomainError } from './procurement.domain-error';
import { parseNumeric, sanitizeItemCodeToken } from './procurement.common';
import type {
  ItemReferenceRow,
  ItemRollbackCandidateRow,
  ItemStatusLogHistoryRow,
  ProcurementPaymentRow,
  ProcurementReceiptItemRow,
} from './procurement.internal-types';

function buildExpectedRollbackCountByProduct(
  receiptItems: ProcurementReceiptItemRow[],
): Map<string, number> {
  const expectedByProduct = new Map<string, number>();

  for (const line of receiptItems) {
    if (!line.product_id) continue;
    const quantity = Math.max(0, Math.floor(parseNumeric(line.quantity)));
    if (quantity <= 0) continue;
    expectedByProduct.set(
      line.product_id,
      (expectedByProduct.get(line.product_id) ?? 0) + quantity,
    );
  }

  return expectedByProduct;
}

export async function fetchRollbackItemCandidates(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    receiptCode: string;
    receiptItems: ProcurementReceiptItemRow[];
  },
): Promise<ItemRollbackCandidateRow[]> {
  const productIds = Array.from(
    new Set(options.receiptItems.map((row) => row.product_id).filter(Boolean)),
  );
  if (productIds.length === 0) return [];

  const receiptToken = sanitizeItemCodeToken(options.receiptCode, 'PROC');
  const likeToken = `%${receiptToken}%`;

  const { data, error } = await supabase
    .from('items')
    .select('id, product_id, item_code, status, branch_id')
    .eq('branch_id', options.branchId)
    .in('product_id', productIds)
    .eq('is_delete', false)
    .ilike('item_code', likeToken)
    .returns<ItemRollbackCandidateRow[]>();

  if (error) throw error;

  return (data ?? []).filter((row) =>
    row.item_code.includes(`-${receiptToken}-`),
  );
}

export function assertRollbackItemCountMatches(options: {
  receiptId: string;
  receiptCode: string;
  receiptItems: ProcurementReceiptItemRow[];
  itemCandidates: ItemRollbackCandidateRow[];
}): void {
  const expectedByProduct = buildExpectedRollbackCountByProduct(
    options.receiptItems,
  );
  const actualByProduct = new Map<string, number>();

  for (const row of options.itemCandidates) {
    actualByProduct.set(
      row.product_id,
      (actualByProduct.get(row.product_id) ?? 0) + 1,
    );
  }

  const mismatchedProducts: Array<{
    productId: string;
    expected: number;
    actual: number;
  }> = [];

  for (const [productId, expected] of expectedByProduct.entries()) {
    const actual = actualByProduct.get(productId) ?? 0;
    if (expected !== actual) {
      mismatchedProducts.push({ productId, expected, actual });
    }
  }

  const totalExpected = Array.from(expectedByProduct.values()).reduce(
    (sum, value) => sum + value,
    0,
  );
  const allowMissingAllItems =
    totalExpected > 0 && options.itemCandidates.length === 0;

  if (
    !allowMissingAllItems &&
    (mismatchedProducts.length > 0 ||
      totalExpected !== options.itemCandidates.length)
  ) {
    throw new ProcurementDomainError(
      'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_COUNT_MISMATCH',
      {
        receiptId: options.receiptId,
        receiptCode: options.receiptCode,
        totalExpected,
        totalActual: options.itemCandidates.length,
        mismatchedProducts,
      },
    );
  }
}

export function assertRollbackItemStatuses(
  itemCandidates: ItemRollbackCandidateRow[],
): void {
  const blockedItems = itemCandidates
    .filter((row) =>
      PROCUREMENT_ROLLBACK_BLOCKED_ITEM_STATUS_SET.has(
        row.status.trim().toUpperCase(),
      ),
    )
    .slice(0, 12)
    .map((row) => ({
      itemId: row.id,
      itemCode: row.item_code,
      status: row.status,
    }));

  if (blockedItems.length > 0) {
    throw new ProcurementDomainError(
      'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_STATUS_BLOCKED',
      {
        blockedItems,
      },
    );
  }
}

export async function fetchRollbackItemReferences(
  supabase: SupabaseClient,
  itemIds: string[],
): Promise<ItemReferenceRow[]> {
  if (itemIds.length === 0) return [];

  const [
    rentalRowsResult,
    reservationRowsResult,
    maintenanceRowsResult,
    incidentRowsResult,
  ] = await Promise.all([
    supabase
      .from('rental_order_items')
      .select('item_id')
      .in('item_id', itemIds)
      .eq('is_delete', false)
      .returns<ItemReferenceRow[]>(),
    supabase
      .from('reservation_windows')
      .select('item_id')
      .in('item_id', itemIds)
      .eq('is_delete', false)
      .returns<ItemReferenceRow[]>(),
    supabase
      .from('maintenance_tasks')
      .select('item_id')
      .in('item_id', itemIds)
      .eq('is_delete', false)
      .returns<ItemReferenceRow[]>(),
    supabase
      .from('incidents')
      .select('item_id')
      .in('item_id', itemIds)
      .eq('is_delete', false)
      .returns<ItemReferenceRow[]>(),
  ]);

  if (rentalRowsResult.error) throw rentalRowsResult.error;
  if (reservationRowsResult.error) throw reservationRowsResult.error;
  if (maintenanceRowsResult.error) throw maintenanceRowsResult.error;
  if (incidentRowsResult.error) throw incidentRowsResult.error;

  const uniqueItemIds = new Set<string>();
  for (const row of rentalRowsResult.data ?? []) {
    uniqueItemIds.add(row.item_id);
  }
  for (const row of reservationRowsResult.data ?? []) {
    uniqueItemIds.add(row.item_id);
  }
  for (const row of maintenanceRowsResult.data ?? []) {
    uniqueItemIds.add(row.item_id);
  }
  for (const row of incidentRowsResult.data ?? []) {
    uniqueItemIds.add(row.item_id);
  }

  return Array.from(uniqueItemIds).map((itemId) => ({ item_id: itemId }));
}

export async function fetchRollbackItemHistoryByStatuses(
  supabase: SupabaseClient,
  itemIds: string[],
  statuses: string[],
): Promise<ItemStatusLogHistoryRow[]> {
  if (itemIds.length === 0 || statuses.length === 0) return [];

  const { data, error } = await supabase
    .from('item_status_logs')
    .select('item_id, to_status')
    .in('item_id', itemIds)
    .eq('is_delete', false)
    .in('to_status', statuses)
    .returns<ItemStatusLogHistoryRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchProcurementPaymentsByReceiptId(
  supabase: SupabaseClient,
  receiptId: string,
): Promise<ProcurementPaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, method, reason, status, note, amount, is_import_order')
    .eq('procurement_receipt_id', receiptId)
    .eq('is_delete', false)
    .returns<ProcurementPaymentRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function resolveArchivableProductIdsAfterRollback(
  supabase: SupabaseClient,
  options: {
    receiptProductIds: string[];
    rollbackItemIds: string[];
  },
): Promise<string[]> {
  const receiptProductIds = Array.from(
    new Set(options.receiptProductIds.filter(Boolean)),
  );
  const rollbackItemIds = new Set(options.rollbackItemIds.filter(Boolean));

  if (receiptProductIds.length === 0 || rollbackItemIds.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('items')
    .select('id, product_id')
    .in('product_id', receiptProductIds)
    .eq('is_delete', false)
    .returns<Array<{ id: string; product_id: string }>>();

  if (error) throw error;

  const itemIdsByProductId = new Map<string, string[]>();
  for (const row of data ?? []) {
    const current = itemIdsByProductId.get(row.product_id) ?? [];
    current.push(row.id);
    itemIdsByProductId.set(row.product_id, current);
  }

  const archivableProductIds: string[] = [];
  for (const productId of receiptProductIds) {
    const itemIds = itemIdsByProductId.get(productId) ?? [];
    if (itemIds.length === 0) {
      archivableProductIds.push(productId);
      continue;
    }

    const hasForeignItem = itemIds.some(
      (itemId) => !rollbackItemIds.has(itemId),
    );
    if (!hasForeignItem) {
      archivableProductIds.push(productId);
    }
  }

  return archivableProductIds;
}
