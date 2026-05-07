import type { SupabaseClient } from '@supabase/supabase-js';
import type { ItemStatus } from '../../../shared/domain/types/domain-primitives.type';
import type { ProductCategoryDto } from '../../../products/types/products-catalog.type';
import type {
  InventoryListItemDto,
  InventoryStatusLogDto,
} from '../../types/inventory-items.type';
import {
  mapCategoryRow,
  mapStatusLogRow,
  type CategoryRow,
  type ItemRow,
  type ItemStatusLogRow,
  type ProductRow,
  type ProductRowWithMatchedItems,
  type RentalOrderItemRow,
  type RentalOrderRow,
} from './shared-core';
export async function fetchCategories(
  supabase: SupabaseClient,
  branchId: string | null,
): Promise<ProductCategoryDto[]> {
  let query = supabase
    .from('product_categories')
    .select('id, branch_id, code, name, is_active')
    .eq('is_active', true)
    .eq('is_delete', false)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (branchId) {
    query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`);
  }

  const { data, error } = await query.returns<CategoryRow[]>();
  if (error) throw error;
  return (data ?? []).map(mapCategoryRow);
}

export async function fetchProductIdsByCategory(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', categoryId)
    .eq('is_delete', false)
    .returns<Array<{ id: string }>>();

  if (error) throw error;
  return Array.from(new Set((data ?? []).map((entry) => entry.id)));
}

export function constrainProductIds(options: {
  requestedProductId: string | null;
  categoryProductIds: string[] | null;
}): string[] | null {
  if (options.requestedProductId && options.categoryProductIds) {
    return options.categoryProductIds.includes(options.requestedProductId)
      ? [options.requestedProductId]
      : [];
  }

  if (options.requestedProductId) {
    return [options.requestedProductId];
  }

  return options.categoryProductIds;
}

export async function fetchItemsPage(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    status: ItemStatus | null;
    excludeSold: boolean;
    size: string | null;
    search: string | null;
    productIds?: string[] | null;
    page: number;
    pageSize: number;
  },
): Promise<{ items: ItemRow[]; total: number }> {
  if (options.productIds && options.productIds.length === 0) {
    return {
      items: [],
      total: 0,
    };
  }

  const page = Math.max(1, Math.floor(options.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize));
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('items')
    .select(
      'id, branch_id, product_id, item_code, size, qr_code, status, retired_at, retired_reason',
      { count: 'exact' },
    )
    .eq('is_delete', false)
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (options.branchId) {
    query = query.eq('branch_id', options.branchId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.excludeSold) {
    query = query.neq('status', 'SOLD');
  }

  if (options.size) {
    query = query.ilike('size', options.size);
  }

  if (options.search) {
    query = query.or(
      `item_code.ilike.%${options.search}%,qr_code.ilike.%${options.search}%`,
    );
  }

  if (options.productIds && options.productIds.length > 0) {
    query = query.in('product_id', options.productIds);
  }

  const { data, error, count } = await query.returns<ItemRow[]>();
  if (error) throw error;

  return {
    items: data ?? [],
    total: count ?? 0,
  };
}

export async function fetchProductsByIds(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<ProductRow[]> {
  if (productIds.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, branch_id, product_code, name, category_id, cover_image_path, material, description, rent_price_per_day, quick_rent_price, rent_deposit_amount',
    )
    .in('id', productIds)
    .eq('is_delete', false)
    .returns<ProductRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchProductsPageByItemFilters(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    status: ItemStatus | null;
    excludeSold: boolean;
    size: string | null;
    search: string | null;
    productIds?: string[] | null;
    page: number;
    pageSize: number;
  },
): Promise<{ items: ProductRow[]; total: number }> {
  if (options.productIds && options.productIds.length === 0) {
    return {
      items: [],
      total: 0,
    };
  }

  const page = Math.max(1, Math.floor(options.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize));
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('products')
    .select(
      'id, branch_id, product_code, name, category_id, cover_image_path, material, description, rent_price_per_day, quick_rent_price, rent_deposit_amount, items!inner(id)',
      { count: 'exact' },
    )
    .eq('is_delete', false)
    .eq('items.is_delete', false)
    .order('name', { ascending: true })
    .range(offset, offset + pageSize - 1)
    .limit(1, { foreignTable: 'items' });

  if (options.productIds && options.productIds.length > 0) {
    query = query.in('id', options.productIds);
  }

  if (options.branchId) {
    query = query.eq('items.branch_id', options.branchId);
  }

  if (options.status) {
    query = query.eq('items.status', options.status);
  }

  if (options.excludeSold) {
    query = query.neq('items.status', 'SOLD');
  }

  if (options.size) {
    query = query.ilike('items.size', options.size);
  }

  if (options.search) {
    query = query.or(
      `item_code.ilike.%${options.search}%,qr_code.ilike.%${options.search}%`,
      {
        foreignTable: 'items',
      },
    );
  }

  const { data, error, count } =
    await query.returns<ProductRowWithMatchedItems[]>();

  if (error) throw error;
  const items = (data ?? []).map((entry) => ({
    id: entry.id,
    branch_id: entry.branch_id,
    product_code: entry.product_code,
    name: entry.name,
    category_id: entry.category_id,
    cover_image_path: entry.cover_image_path,
    material: entry.material,
    description: entry.description,
    rent_price_per_day: entry.rent_price_per_day,
    quick_rent_price: entry.quick_rent_price,
    rent_deposit_amount: entry.rent_deposit_amount,
  }));

  return {
    items,
    total: count ?? 0,
  };
}

export async function countItemsForProduct(
  supabase: SupabaseClient,
  options: {
    productId: string;
    branchId: string | null;
    status: ItemStatus | null;
    excludeSold: boolean;
    size: string | null;
    search: string | null;
  },
): Promise<number> {
  let query = supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('is_delete', false)
    .eq('product_id', options.productId);

  if (options.branchId) {
    query = query.eq('branch_id', options.branchId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.excludeSold) {
    query = query.neq('status', 'SOLD');
  }

  if (options.size) {
    query = query.ilike('size', options.size);
  }

  if (options.search) {
    query = query.or(
      `item_code.ilike.%${options.search}%,qr_code.ilike.%${options.search}%`,
    );
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchItemCountsByProductIds(
  supabase: SupabaseClient,
  options: {
    productIds: string[];
    branchId: string | null;
    status: ItemStatus | null;
    excludeSold: boolean;
    size: string | null;
    search: string | null;
  },
): Promise<Map<string, { itemCount: number; readyItemCount: number }>> {
  const map = new Map<string, { itemCount: number; readyItemCount: number }>();
  if (options.productIds.length === 0) {
    return map;
  }

  const entries = await Promise.all(
    options.productIds.map(async (productId) => {
      const itemCount = await countItemsForProduct(supabase, {
        productId,
        branchId: options.branchId,
        status: options.status,
        excludeSold: options.excludeSold,
        size: options.size,
        search: options.search,
      });

      const readyItemCount =
        options.status && options.status !== 'READY'
          ? 0
          : options.status === 'READY'
            ? itemCount
            : await countItemsForProduct(supabase, {
                productId,
                branchId: options.branchId,
                status: 'READY',
                excludeSold: options.excludeSold,
                size: options.size,
                search: options.search,
              });

      return [productId, { itemCount, readyItemCount }] as const;
    }),
  );

  for (const [productId, counts] of entries) {
    map.set(productId, counts);
  }

  return map;
}

export async function fetchCurrentOrdersByItemIds(
  supabase: SupabaseClient,
  itemIds: string[],
): Promise<Map<string, InventoryListItemDto['currentOrder']>> {
  const map = new Map<string, InventoryListItemDto['currentOrder']>();
  if (itemIds.length === 0) return map;

  const { data: rentalRows, error: rentalError } = await supabase
    .from('rental_order_items')
    .select('item_id, order_id, rent_price, created_at')
    .in('item_id', itemIds)
    .eq('is_delete', false)
    .returns<RentalOrderItemRow[]>();

  if (rentalError) throw rentalError;
  if (!rentalRows || rentalRows.length === 0) return map;

  const orderIds = Array.from(new Set(rentalRows.map((row) => row.order_id)));
  const { data: orders, error: orderError } = await supabase
    .from('rental_orders')
    .select('id, order_code, status, start_date, end_date, created_at')
    .in('id', orderIds)
    .eq('is_delete', false)
    .returns<RentalOrderRow[]>();

  if (orderError) throw orderError;

  const orderById = new Map((orders ?? []).map((entry) => [entry.id, entry]));

  const rowsByItem = new Map<string, RentalOrderItemRow[]>();
  for (const row of rentalRows) {
    const bucket = rowsByItem.get(row.item_id);
    if (bucket) {
      bucket.push(row);
    } else {
      rowsByItem.set(row.item_id, [row]);
    }
  }

  for (const [itemId, rows] of rowsByItem.entries()) {
    const candidates = rows
      .map((row) => {
        const order = orderById.get(row.order_id);
        if (!order) return null;

        const priority =
          order.status === 'PICKED_UP'
            ? 3
            : order.status === 'RESERVED' || order.status === 'CONFIRMED'
              ? 2
              : 1;

        return {
          row,
          order,
          priority,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          row: RentalOrderItemRow;
          order: RentalOrderRow;
          priority: number;
        } => Boolean(entry),
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.order.created_at.localeCompare(a.order.created_at);
      });

    const picked = candidates[0];
    if (!picked) continue;

    map.set(itemId, {
      orderId: picked.order.id,
      orderCode: picked.order.order_code,
      orderStatus: picked.order.status,
      startDate: picked.order.start_date,
      endDate: picked.order.end_date,
    });
  }

  return map;
}

export async function fetchLastMovementByItemIds(
  supabase: SupabaseClient,
  itemIds: string[],
): Promise<Map<string, InventoryStatusLogDto>> {
  const map = new Map<string, InventoryStatusLogDto>();
  if (itemIds.length === 0) return map;

  const { data, error } = await supabase
    .from('item_status_logs')
    .select(
      'id, item_id, order_id, from_status, to_status, reason_code, reason_note, actor_profile_id, happened_at',
    )
    .in('item_id', itemIds)
    .eq('is_delete', false)
    .order('happened_at', { ascending: false })
    .returns<ItemStatusLogRow[]>();

  if (error) throw error;

  for (const row of data ?? []) {
    if (!map.has(row.item_id)) {
      map.set(row.item_id, mapStatusLogRow(row));
    }
  }

  return map;
}
