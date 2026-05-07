import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProcurementLineInput,
  ProcurementReceiptCreateProductsResultDto,
} from '../../types/procurement-module.type';
import { roundMoney, sanitizeText } from './procurement.common';
import { ProcurementDomainError } from './procurement.domain-error';
import {
  assertProcurementRollbackRole,
  resolveProcurementActorContext,
} from './procurement.actor-context';
import {
  normalizeProcurementLineInput,
  resolveProcurementLinesWithProductUpsert,
} from './procurement.create-lines';
import {
  assertProcurementItemCodesAvailable,
  buildProcurementIntakeItemInsertRows,
  insertProcurementItemsAndLogs,
  updateProductPurchasePriceByWeightedAverage,
} from './procurement.intake-helpers';
import {
  fetchProductsByIds,
  fetchProductStockCounts,
} from './procurement.product-repo';
import { fetchReceiptItems, getReceiptById } from './procurement.receipt-repo';
import { getProcurementReceiptDetailForActor } from './procurement.receipts';

function mapReceiptItemToLineInput(
  row: Awaited<ReturnType<typeof fetchReceiptItems>>[number],
): ProcurementLineInput {
  return {
    productId: null,
    productCode: sanitizeText(row.product_code_snapshot),
    name: sanitizeText(row.product_name_snapshot),
    categoryCode: sanitizeText(row.category_code_snapshot),
    rentPricePerDay:
      row.rent_price_per_day === null ? 0 : Number(row.rent_price_per_day),
    quickRentPrice:
      row.quick_rent_price === null ? null : Number(row.quick_rent_price),
    purchasePrice:
      row.purchase_price === null
        ? Number(row.unit_cost_amount)
        : Number(row.purchase_price),
    salePrice: row.sale_price === null ? 0 : Number(row.sale_price),
    isRentable: row.is_rentable,
    isSaleable: row.is_saleable,
    material: sanitizeText(row.material),
    gender: row.gender,
    description: sanitizeText(row.description),
    coverImageUrl: sanitizeText(row.cover_image_url),
    quantity: Math.max(1, Math.floor(Number(row.quantity))),
    unitCostAmount: roundMoney(Number(row.unit_cost_amount)),
    itemSize: sanitizeText(row.item_size),
    note: sanitizeText(row.note),
  };
}

export async function createProductsFromProcurementReceiptForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    receiptId: string;
  },
): Promise<ProcurementReceiptCreateProductsResultDto> {
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

  const receiptItems = await fetchReceiptItems(supabase, receipt.id);
  const pendingItems = receiptItems.filter((row) => !row.product_id);
  if (pendingItems.length === 0) {
    const detail = await getProcurementReceiptDetailForActor(supabase, {
      actorProfileId: context.actor.id,
      receiptId: receipt.id,
    });
    if (!detail) {
      throw new ProcurementDomainError('RECEIPT_NOT_FOUND', {
        receiptId: receipt.id,
      });
    }
    return {
      receipt: detail,
      createdProductCount: 0,
      linkedExistingProductCount: 0,
      createdItemCount: 0,
      skippedLineCount: receiptItems.length,
    };
  }

  const normalizedInputs = pendingItems.map((row, index) =>
    normalizeProcurementLineInput(mapReceiptItemToLineInput(row), index),
  );
  const resolvedLines = await resolveProcurementLinesWithProductUpsert(
    supabase,
    {
      context,
      lines: normalizedInputs,
    },
  );

  const itemInsertRows = buildProcurementIntakeItemInsertRows({
    actorProfileId: context.actor.id,
    branchId: context.branchId,
    receiptCode: receipt.receipt_code,
    lines: resolvedLines.map((line) => ({
      productId: line.productId,
      productCode: line.productCodeSnapshot,
      quantity: line.quantity,
      itemSize: line.itemSize,
    })),
  });

  await assertProcurementItemCodesAvailable(supabase, {
    branchId: context.branchId,
    itemInsertRows,
  });

  const productIds = Array.from(
    new Set(resolvedLines.map((line) => line.productId)),
  );
  const [productsById, currentStockByProductId] = await Promise.all([
    fetchProductsByIds(supabase, productIds),
    fetchProductStockCounts(supabase, productIds),
  ]);

  await insertProcurementItemsAndLogs(supabase, {
    actorProfileId: context.actor.id,
    branchId: context.branchId,
    receiptCode: receipt.receipt_code,
    lines: resolvedLines.map((line) => ({
      productId: line.productId,
      productCode: line.productCodeSnapshot,
      quantity: line.quantity,
      itemSize: line.itemSize,
    })),
  });

  await updateProductPurchasePriceByWeightedAverage(supabase, {
    actorProfileId: context.actor.id,
    productsById,
    currentStockByProductId,
    intakeRows: resolvedLines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      lineTotalAmount: line.lineTotalAmount,
    })),
  });

  for (const [index, row] of pendingItems.entries()) {
    const line = resolvedLines[index];
    if (!line) continue;
    const { error } = await supabase
      .from('procurement_receipt_items')
      .update({
        product_id: line.productId,
        product_code_snapshot: line.productCodeSnapshot,
        product_name_snapshot: line.productNameSnapshot,
      })
      .eq('id', row.id)
      .eq('is_delete', false);
    if (error) throw error;
  }

  await supabase.from('audit_events').insert({
    branch_id: receipt.branch_id,
    actor_profile_id: context.actor.id,
    entity_type: 'PROCUREMENT_RECEIPT',
    entity_id: receipt.id,
    action: 'PROCUREMENT_RECEIPT_PRODUCTS_CREATED',
    after_data: {
      receiptCode: receipt.receipt_code,
      createdProductCount: resolvedLines.filter(
        (line) => line.resolvedAction === 'CREATE_NEW',
      ).length,
      linkedExistingProductCount: resolvedLines.filter(
        (line) => line.resolvedAction === 'UPDATE_EXISTING',
      ).length,
      createdItemCount: resolvedLines.reduce(
        (sum, line) => sum + line.quantity,
        0,
      ),
    },
    meta: {
      productLifecycle: 'EXPLICIT_CREATE_FROM_IMPORT_ORDER',
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

  return {
    receipt: detail,
    createdProductCount: resolvedLines.filter(
      (line) => line.resolvedAction === 'CREATE_NEW',
    ).length,
    linkedExistingProductCount: resolvedLines.filter(
      (line) => line.resolvedAction === 'UPDATE_EXISTING',
    ).length,
    createdItemCount: resolvedLines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    ),
    skippedLineCount: receiptItems.length - pendingItems.length,
  };
}
