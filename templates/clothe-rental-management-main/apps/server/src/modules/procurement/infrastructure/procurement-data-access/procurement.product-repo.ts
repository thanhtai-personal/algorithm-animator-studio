import type { SupabaseClient } from '@supabase/supabase-js';
import { ProcurementDomainError } from './procurement.domain-error';
import { isStockCountedStatus, sanitizeText } from './procurement.common';
import type {
  ItemCountRow,
  ProcurementProductRow,
  ProductCategoryRow,
} from './procurement.internal-types';

export async function fetchProductsByIds(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, ProcurementProductRow>> {
  if (productIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, branch_id, product_code, name, category_id, gender, material, description, rent_price_per_day, sale_price, purchase_price, is_rentable, is_saleable, is_active, is_archived',
    )
    .in('id', productIds)
    .eq('is_delete', false)
    .returns<ProcurementProductRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function fetchProductsByCodes(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    productCodes: string[];
  },
): Promise<Map<string, ProcurementProductRow>> {
  const normalizedCodes = Array.from(
    new Set(
      options.productCodes
        .map((code) => sanitizeText(code))
        .filter((code): code is string => Boolean(code)),
    ),
  );

  if (normalizedCodes.length === 0) return new Map();

  const expandedCodes = Array.from(
    new Set(
      normalizedCodes.flatMap((code) => [
        code,
        code.toLowerCase(),
        code.toUpperCase(),
      ]),
    ),
  );

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, branch_id, product_code, name, category_id, gender, material, description, rent_price_per_day, sale_price, purchase_price, is_rentable, is_saleable, is_active, is_archived',
    )
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .in('product_code', expandedCodes)
    .returns<ProcurementProductRow[]>();

  if (error) throw error;

  const byCodeLower = new Map<string, ProcurementProductRow>();
  for (const row of data ?? []) {
    byCodeLower.set(row.product_code.toLowerCase(), row);
  }

  return byCodeLower;
}

export async function fetchCategoryByCodeMap(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    categoryCodes: string[];
  },
): Promise<Map<string, ProductCategoryRow>> {
  const normalizedCodes = Array.from(
    new Set(
      options.categoryCodes
        .map((code) => sanitizeText(code))
        .filter((code): code is string => Boolean(code)),
    ),
  );

  if (normalizedCodes.length === 0) return new Map();

  const expandedCodes = Array.from(
    new Set(
      normalizedCodes.flatMap((code) => [
        code,
        code.toLowerCase(),
        code.toUpperCase(),
      ]),
    ),
  );

  const { data, error } = await supabase
    .from('product_categories')
    .select('id, branch_id, code, name, is_active')
    .eq('is_active', true)
    .eq('is_delete', false)
    .in('code', expandedCodes)
    .or(`branch_id.is.null,branch_id.eq.${options.branchId}`)
    .returns<ProductCategoryRow[]>();

  if (error) throw error;

  const map = new Map<string, ProductCategoryRow>();
  for (const row of data ?? []) {
    const key = row.code.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      continue;
    }

    if (existing.branch_id === null && row.branch_id === options.branchId) {
      map.set(key, row);
    }
  }

  return map;
}

export async function generateUniqueProductCode(
  supabase: SupabaseClient,
  branchId: string,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const nowToken = Date.now().toString(36).toUpperCase();
    const randomToken = Math.random().toString(36).slice(2, 6).toUpperCase();
    const generated = `AUTO-${nowToken}-${randomToken}`;

    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('branch_id', branchId)
      .eq('is_delete', false)
      .eq('product_code', generated)
      .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) {
      return generated;
    }
  }

  throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
    reason: 'cannot-generate-unique-product-code',
  });
}

export async function fetchProductStockCounts(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('items')
    .select('product_id, status')
    .in('product_id', productIds)
    .eq('is_delete', false)
    .returns<ItemCountRow[]>();

  if (error) throw error;

  const byProductId = new Map<string, number>();
  for (const row of data ?? []) {
    if (!isStockCountedStatus(row.status)) continue;
    byProductId.set(row.product_id, (byProductId.get(row.product_id) ?? 0) + 1);
  }

  return byProductId;
}
