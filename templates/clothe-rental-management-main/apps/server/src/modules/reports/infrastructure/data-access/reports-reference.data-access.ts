import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CategoryRow,
  ItemRow,
  ProductRow,
} from './reports-common.data-access.utils';

export async function fetchProductsByIds(
  supabase: SupabaseClient,
  productIds: string[],
  options?: {
    branchId?: string | null;
  },
): Promise<Map<string, ProductRow>> {
  if (productIds.length === 0) return new Map();

  let query = supabase
    .from('products')
    .select('id, name, category_id')
    .eq('is_delete', false)
    .in('id', productIds);

  if (options?.branchId) {
    query = query.or(`branch_id.is.null,branch_id.eq.${options.branchId}`);
  }

  const { data, error } = await query.returns<ProductRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function fetchCategoriesByIds(
  supabase: SupabaseClient,
  productCategoryIds: string[],
  options?: {
    branchId?: string | null;
  },
): Promise<Map<string, CategoryRow>> {
  if (productCategoryIds.length === 0) return new Map();

  let query = supabase
    .from('product_categories')
    .select('id, name')
    .eq('is_delete', false)
    .in('id', productCategoryIds);

  if (options?.branchId) {
    query = query.or(`branch_id.is.null,branch_id.eq.${options.branchId}`);
  }

  const { data, error } = await query.returns<CategoryRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function fetchItemsByIds(
  supabase: SupabaseClient,
  itemIds: string[],
  options?: {
    branchId?: string | null;
  },
): Promise<Map<string, ItemRow>> {
  if (itemIds.length === 0) return new Map();

  let query = supabase
    .from('items')
    .select('id, item_code')
    .in('id', itemIds)
    .eq('is_delete', false);

  if (options?.branchId) {
    query = query.eq('branch_id', options.branchId);
  }

  const { data, error } = await query.returns<ItemRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}
