import {
  parseNumeric,
  parseOptionalNumeric,
  roundMoney,
  sanitizeText,
} from './procurement.common';
import { ProcurementDomainError } from './procurement.domain-error';
import type { ProcurementLineInput } from '../../types/procurement-module.type';
import type { ProcurementReceiptItemRow } from './procurement.internal-types';

export interface NormalizedUpdateLine {
  rowNumber: number;
  productId: string | null;
  productCode: string | null;
  name: string | null;
  categoryCode: string | null;
  quantity: number;
  unitCostAmount: number;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
  isRentable: boolean | null;
  isSaleable: boolean | null;
  material: string | null;
  gender: string | null;
  description: string | null;
  coverImageUrl: string | null;
  itemSize: string | null;
  note: string | null;
}

export interface ResolvedUpdateLine {
  rowNumber: number;
  productId: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  quantity: number;
  unitCostAmount: number;
  lineTotalAmount: number;
  itemSize: string | null;
  note: string | null;
}

export function normalizeUpdateLineInput(
  line: ProcurementLineInput,
  index: number,
): NormalizedUpdateLine {
  const quantity = Math.floor(Number(line.quantity));
  const unitCostAmount = roundMoney(Number(line.unitCostAmount));
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(unitCostAmount) ||
    unitCostAmount < 0
  ) {
    throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
      rowNumber: index + 1,
      reason: 'invalid-quantity-or-unit-cost',
    });
  }

  const gender = sanitizeText(
    typeof line.gender === 'string' ? line.gender : null,
  );

  return {
    rowNumber: index + 1,
    productId: sanitizeText(line.productId),
    productCode: sanitizeText(line.productCode),
    name: sanitizeText(line.name),
    categoryCode: sanitizeText(line.categoryCode),
    quantity,
    unitCostAmount,
    rentPricePerDay: parseOptionalNumeric(line.rentPricePerDay),
    quickRentPrice: parseOptionalNumeric(line.quickRentPrice),
    purchasePrice: parseOptionalNumeric(line.purchasePrice),
    salePrice: parseOptionalNumeric(line.salePrice),
    isRentable: typeof line.isRentable === 'boolean' ? line.isRentable : null,
    isSaleable: typeof line.isSaleable === 'boolean' ? line.isSaleable : null,
    material: sanitizeText(line.material),
    gender,
    description: sanitizeText(line.description),
    coverImageUrl: sanitizeText(line.coverImageUrl),
    itemSize: sanitizeText(line.itemSize),
    note: sanitizeText(line.note),
  };
}

export function buildQuantityByProductIdFromReceiptItems(
  items: ProcurementReceiptItemRow[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of items) {
    if (!row.product_id) continue;
    const quantity = Math.max(0, Math.floor(parseNumeric(row.quantity)));
    if (quantity <= 0) continue;
    map.set(row.product_id, (map.get(row.product_id) ?? 0) + quantity);
  }
  return map;
}

export function buildQuantityByProductIdFromNextLines(
  lines: ResolvedUpdateLine[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    map.set(line.productId, (map.get(line.productId) ?? 0) + line.quantity);
  }
  return map;
}
