import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertRollbackItemCountMatches,
  assertRollbackItemStatuses,
  fetchRollbackItemCandidates,
  fetchRollbackItemHistoryByStatuses,
  fetchRollbackItemReferences,
} from './procurement.rollback-helpers';
import type {
  ItemRollbackCandidateRow,
  ProcurementReceiptItemRow,
} from './procurement.internal-types';
import { ProcurementDomainError } from './procurement.domain-error';
import { sanitizeItemCodeToken } from './procurement.common';
import {
  buildQuantityByProductIdFromNextLines,
  buildQuantityByProductIdFromReceiptItems,
  type ResolvedUpdateLine,
} from './procurement.update-receipt.types';

function parseItemSequence(itemCode: string): number {
  const match = itemCode.match(/-(\d+)$/);
  if (!match) return 0;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function takeRetireCandidates(
  rows: ItemRollbackCandidateRow[],
  quantityToRetire: number,
): ItemRollbackCandidateRow[] {
  if (quantityToRetire <= 0) return [];

  const nonRetired = rows
    .filter((entry) => entry.status.trim().toUpperCase() !== 'RETIRED')
    .sort((left, right) => left.item_code.localeCompare(right.item_code));

  if (nonRetired.length < quantityToRetire) {
    throw new ProcurementDomainError(
      'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_COUNT_MISMATCH',
      {
        reason: 'insufficient-active-items-for-reduction',
        requestedRetireCount: quantityToRetire,
        activeItemCount: nonRetired.length,
      },
    );
  }

  return nonRetired.slice(nonRetired.length - quantityToRetire);
}

async function fetchExistingReceiptItemCodes(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    receiptCode: string;
    productIds: string[];
  },
): Promise<Map<string, number>> {
  if (options.productIds.length === 0) return new Map();

  const receiptToken = sanitizeItemCodeToken(options.receiptCode, 'PROC');
  const likeToken = `%${receiptToken}%`;

  const { data, error } = await supabase
    .from('items')
    .select('product_id, item_code')
    .eq('branch_id', options.branchId)
    .in('product_id', options.productIds)
    .ilike('item_code', likeToken)
    .returns<Array<{ product_id: string; item_code: string }>>();

  if (error) throw error;

  const maxSequenceByProductId = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.item_code.includes(`-${receiptToken}-`)) continue;
    const currentMax = maxSequenceByProductId.get(row.product_id) ?? 0;
    const next = parseItemSequence(row.item_code);
    if (next > currentMax) {
      maxSequenceByProductId.set(row.product_id, next);
    }
  }

  return maxSequenceByProductId;
}

async function assertReceiptItemsCanBeEdited(
  supabase: SupabaseClient,
  options: {
    receiptId: string;
    receiptCode: string;
    receiptItems: ProcurementReceiptItemRow[];
    itemCandidates: ItemRollbackCandidateRow[];
  },
): Promise<void> {
  assertRollbackItemCountMatches({
    receiptId: options.receiptId,
    receiptCode: options.receiptCode,
    receiptItems: options.receiptItems,
    itemCandidates: options.itemCandidates,
  });
  assertRollbackItemStatuses(options.itemCandidates);

  const itemIds = options.itemCandidates.map((row) => row.id);
  const historyRows = await fetchRollbackItemHistoryByStatuses(
    supabase,
    itemIds,
    ['SOLD', 'ON_RENT'],
  );
  if (historyRows.length > 0) {
    throw new ProcurementDomainError(
      'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_IN_USE',
      {
        receiptId: options.receiptId,
        receiptCode: options.receiptCode,
        blockedReason: 'ITEM_WAS_RENTED_OR_SOLD',
        referencedItemCount: historyRows.length,
      },
    );
  }

  const references = await fetchRollbackItemReferences(supabase, itemIds);
  if (references.length > 0) {
    throw new ProcurementDomainError(
      'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_IN_USE',
      {
        receiptId: options.receiptId,
        receiptCode: options.receiptCode,
        blockedReason: 'ITEM_REFERENCED_BY_OPERATION_TABLES',
        referencedItemCount: references.length,
      },
    );
  }
}

export async function applyReceiptItemDeltaForEdit(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId: string;
    receiptId: string;
    receiptCode: string;
    receiptItems: ProcurementReceiptItemRow[];
    resolvedLines: ResolvedUpdateLine[];
  },
): Promise<{ retiredItemCount: number; increasedItemCount: number }> {
  const itemCandidates = await fetchRollbackItemCandidates(supabase, {
    branchId: options.branchId,
    receiptCode: options.receiptCode,
    receiptItems: options.receiptItems,
  });

  await assertReceiptItemsCanBeEdited(supabase, {
    receiptId: options.receiptId,
    receiptCode: options.receiptCode,
    receiptItems: options.receiptItems,
    itemCandidates,
  });

  const quantityByProductIdCurrent = buildQuantityByProductIdFromReceiptItems(
    options.receiptItems,
  );
  const quantityByProductIdNext = buildQuantityByProductIdFromNextLines(
    options.resolvedLines,
  );

  const lineByProductId = new Map<string, ResolvedUpdateLine>();
  for (const line of options.resolvedLines) {
    if (!lineByProductId.has(line.productId)) {
      lineByProductId.set(line.productId, line);
    }
  }

  const candidatesByProductId = new Map<string, ItemRollbackCandidateRow[]>();
  for (const row of itemCandidates) {
    const current = candidatesByProductId.get(row.product_id) ?? [];
    current.push(row);
    candidatesByProductId.set(row.product_id, current);
  }

  const retireRows: ItemRollbackCandidateRow[] = [];
  for (const [
    productId,
    currentQuantity,
  ] of quantityByProductIdCurrent.entries()) {
    const nextQuantity = quantityByProductIdNext.get(productId) ?? 0;
    if (nextQuantity >= currentQuantity) continue;

    const quantityToRetire = currentQuantity - nextQuantity;
    const candidates = candidatesByProductId.get(productId) ?? [];
    retireRows.push(...takeRetireCandidates(candidates, quantityToRetire));
  }

  if (retireRows.length > 0) {
    const retireIds = retireRows.map((row) => row.id);
    const { error: retireItemsError } = await supabase
      .from('items')
      .update({ status: 'RETIRED', updated_by: options.actorProfileId })
      .in('id', retireIds)
      .eq('is_delete', false);
    if (retireItemsError) throw retireItemsError;

    const { error: retireLogError } = await supabase
      .from('item_status_logs')
      .insert(
        retireRows.map((row) => ({
          branch_id: row.branch_id,
          item_id: row.id,
          from_status: row.status,
          to_status: 'RETIRED',
          reason_code: 'PROCUREMENT_RECEIPT_EDIT_REDUCE',
          reason_note: `Edit receipt ${options.receiptCode}`,
          actor_profile_id: options.actorProfileId,
        })),
      );
    if (retireLogError) throw retireLogError;
  }

  const productsNeedIncrease = Array.from(quantityByProductIdNext.entries())
    .map(([productId, nextQuantity]) => ({
      productId,
      nextQuantity,
      currentQuantity: quantityByProductIdCurrent.get(productId) ?? 0,
    }))
    .filter((entry) => entry.nextQuantity > entry.currentQuantity);

  let increasedItemCount = 0;
  if (productsNeedIncrease.length > 0) {
    const maxSequenceByProductId = await fetchExistingReceiptItemCodes(
      supabase,
      {
        branchId: options.branchId,
        receiptCode: options.receiptCode,
        productIds: productsNeedIncrease.map((entry) => entry.productId),
      },
    );

    const receiptToken = sanitizeItemCodeToken(options.receiptCode, 'PROC');
    const increaseRows: Array<{
      branch_id: string;
      product_id: string;
      item_code: string;
      size: string | null;
      status: string;
      created_by: string;
      updated_by: string;
      is_delete: boolean;
    }> = [];

    for (const entry of productsNeedIncrease) {
      const line = lineByProductId.get(entry.productId);
      if (!line) continue;

      const productToken = sanitizeItemCodeToken(
        line.productCodeSnapshot,
        'ITEM',
      );
      let runningSequence = maxSequenceByProductId.get(entry.productId) ?? 0;
      const quantityToCreate = entry.nextQuantity - entry.currentQuantity;
      increasedItemCount += quantityToCreate;

      for (let index = 0; index < quantityToCreate; index += 1) {
        runningSequence += 1;
        increaseRows.push({
          branch_id: options.branchId,
          product_id: entry.productId,
          item_code: `${productToken}-${receiptToken}-${String(runningSequence).padStart(3, '0')}`,
          size: line.itemSize,
          status: 'READY',
          created_by: options.actorProfileId,
          updated_by: options.actorProfileId,
          is_delete: false,
        });
      }
    }

    if (increaseRows.length > 0) {
      const { data: insertedItems, error: insertItemsError } = await supabase
        .from('items')
        .insert(increaseRows)
        .select('id, branch_id, status')
        .returns<Array<{ id: string; branch_id: string; status: string }>>();
      if (insertItemsError) throw insertItemsError;

      const { error: insertStatusLogsError } = await supabase
        .from('item_status_logs')
        .insert(
          (insertedItems ?? []).map((row) => ({
            branch_id: row.branch_id,
            item_id: row.id,
            from_status: null,
            to_status: row.status,
            reason_code: 'PROCUREMENT_RECEIPT_EDIT_INCREASE',
            reason_note: `Edit receipt ${options.receiptCode}`,
            actor_profile_id: options.actorProfileId,
          })),
        );
      if (insertStatusLogsError) throw insertStatusLogsError;
    }
  }

  return {
    retiredItemCount: retireRows.length,
    increasedItemCount,
  };
}
