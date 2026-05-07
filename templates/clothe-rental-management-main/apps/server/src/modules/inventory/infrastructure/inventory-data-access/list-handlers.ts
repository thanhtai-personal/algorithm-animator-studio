import type { SupabaseClient } from '@supabase/supabase-js';
import type { ItemStatus } from '../../../shared/domain/types/domain-primitives.type';
import type {
  InventoryItemDetailDto,
  InventoryListItemDto,
  InventoryListResponse,
  InventoryProductListResponse,
  InventoryRentalHistoryRowDto,
} from '../../types/inventory-items.type';
import {
  mapStatusLogRow,
  parseNumeric,
  sanitizeSearchTerm,
  sanitizeText,
  type ItemRow,
  type ItemStatusLogRow,
  type RentalOrderItemRow,
  type RentalOrderRow,
} from './shared-core';
import {
  constrainProductIds,
  fetchCategories,
  fetchCurrentOrdersByItemIds,
  fetchItemCountsByProductIds,
  fetchItemsPage,
  fetchLastMovementByItemIds,
  fetchProductIdsByCategory,
  fetchProductsByIds,
  fetchProductsPageByItemFilters,
} from './shared-fetches';
import {
  buildInventoryListItem,
  buildInventoryProductListItem,
} from './shared-builders';
export async function listInventoryItemsForAdmin(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    status: ItemStatus | null;
    excludeSold?: boolean;
    productId?: string | null;
    productCategoryId: string | null;
    size: string | null;
    search: string | null;
    page: number;
    pageSize: number;
  },
): Promise<InventoryListResponse> {
  const normalizedSize = sanitizeText(options.size);
  const normalizedSearch = sanitizeSearchTerm(options.search);
  const categoryProductIds = options.productCategoryId
    ? await fetchProductIdsByCategory(supabase, options.productCategoryId)
    : null;
  const constrainedProductIds = constrainProductIds({
    requestedProductId: sanitizeText(options.productId ?? null),
    categoryProductIds,
  });

  const [categories, pagePayload] = await Promise.all([
    fetchCategories(supabase, options.branchId),
    fetchItemsPage(supabase, {
      branchId: options.branchId,
      status: options.status,
      excludeSold: options.excludeSold === true,
      size: normalizedSize,
      search: normalizedSearch,
      productIds: constrainedProductIds,
      page: options.page,
      pageSize: options.pageSize,
    }),
  ]);

  const pagedItems = pagePayload.items;
  const pagedItemIds = pagedItems.map((entry) => entry.id);
  const pagedProductIds = Array.from(
    new Set(pagedItems.map((entry) => entry.product_id)),
  );
  const products = await fetchProductsByIds(supabase, pagedProductIds);
  const productById = new Map(products.map((entry) => [entry.id, entry]));

  const [currentOrdersByItemId, lastMovementByItemId] = await Promise.all([
    fetchCurrentOrdersByItemIds(supabase, pagedItemIds),
    fetchLastMovementByItemIds(supabase, pagedItemIds),
  ]);

  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));

  const items: InventoryListItemDto[] = pagedItems
    .map((entry) =>
      buildInventoryListItem({
        item: entry,
        productById,
        categoryById,
        currentOrderByItemId: currentOrdersByItemId,
        lastMovementByItemId,
      }),
    )
    .filter((entry): entry is InventoryListItemDto => Boolean(entry));

  const sizes = Array.from(
    new Set(
      pagedItems
        .map((entry) => sanitizeText(entry.size))
        .filter((entry): entry is string => Boolean(entry)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const branchOptions = Array.from(
    new Set(pagedItems.map((entry) => entry.branch_id)),
  ).sort((a, b) => a.localeCompare(b));

  return {
    items,
    total: pagePayload.total,
    page: options.page,
    pageSize: options.pageSize,
    categories,
    sizes,
    branchOptions,
  };
}

export async function listInventoryProductsForAdmin(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    status: ItemStatus | null;
    excludeSold?: boolean;
    productId?: string | null;
    productCategoryId: string | null;
    size: string | null;
    search: string | null;
    page: number;
    pageSize: number;
  },
): Promise<InventoryProductListResponse> {
  const page = Math.max(1, Math.floor(options.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize));
  const normalizedSize = sanitizeText(options.size);
  const normalizedSearch = sanitizeSearchTerm(options.search);
  const categoryProductIds = options.productCategoryId
    ? await fetchProductIdsByCategory(supabase, options.productCategoryId)
    : null;
  const constrainedProductIds = constrainProductIds({
    requestedProductId: sanitizeText(options.productId ?? null),
    categoryProductIds,
  });

  const [categories, productsPage] = await Promise.all([
    fetchCategories(supabase, options.branchId),
    fetchProductsPageByItemFilters(supabase, {
      branchId: options.branchId,
      status: options.status,
      excludeSold: options.excludeSold === true,
      size: normalizedSize,
      search: normalizedSearch,
      productIds: constrainedProductIds,
      page,
      pageSize,
    }),
  ]);

  const pagedProducts = productsPage.items;
  const countsByProductId = await fetchItemCountsByProductIds(supabase, {
    productIds: pagedProducts.map((entry) => entry.id),
    branchId: options.branchId,
    status: options.status,
    excludeSold: options.excludeSold === true,
    size: normalizedSize,
    search: normalizedSearch,
  });

  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));
  const items = pagedProducts
    .map((entry) =>
      buildInventoryProductListItem({
        product: entry,
        categoryById,
        branchId: entry.branch_id ?? options.branchId ?? '',
        itemCount: countsByProductId.get(entry.id)?.itemCount ?? 0,
        readyItemCount: countsByProductId.get(entry.id)?.readyItemCount ?? 0,
      }),
    )
    .filter((entry) => Boolean(entry.branchId));
  const sizes = Array.from(
    new Set(normalizedSize ? [normalizedSize] : []),
  ).sort((left, right) => left.localeCompare(right));
  const branchOptions = Array.from(
    new Set(
      options.branchId
        ? [options.branchId]
        : pagedProducts
            .map((entry) => sanitizeText(entry.branch_id))
            .filter((entry): entry is string => Boolean(entry)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return {
    items,
    total: productsPage.total,
    page,
    pageSize,
    categories,
    sizes,
    branchOptions,
  };
}

export async function getInventoryItemDetailForAdmin(
  supabase: SupabaseClient,
  itemId: string,
): Promise<InventoryItemDetailDto | null> {
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select(
      'id, branch_id, product_id, item_code, size, qr_code, status, retired_at, retired_reason',
    )
    .eq('id', itemId)
    .eq('is_delete', false)
    .maybeSingle<ItemRow>();

  if (itemError) throw itemError;
  if (!item) return null;

  const products = await fetchProductsByIds(supabase, [item.product_id]);
  const product = products[0] ?? null;
  if (!product) return null;

  const [categories, currentOrdersByItemId, lastMovementByItemId] =
    await Promise.all([
      fetchCategories(supabase, item.branch_id),
      fetchCurrentOrdersByItemIds(supabase, [item.id]),
      fetchLastMovementByItemIds(supabase, [item.id]),
    ]);

  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));

  const listItem = buildInventoryListItem({
    item,
    productById: new Map([[product.id, product]]),
    categoryById,
    currentOrderByItemId: currentOrdersByItemId,
    lastMovementByItemId,
  });

  if (!listItem) return null;

  const { data: statusLogs, error: statusLogsError } = await supabase
    .from('item_status_logs')
    .select(
      'id, item_id, order_id, from_status, to_status, reason_code, reason_note, actor_profile_id, happened_at',
    )
    .eq('item_id', item.id)
    .eq('is_delete', false)
    .order('happened_at', { ascending: false })
    .limit(120)
    .returns<ItemStatusLogRow[]>();

  if (statusLogsError) throw statusLogsError;

  const { data: rentalRows, error: rentalRowsError } = await supabase
    .from('rental_order_items')
    .select('item_id, order_id, rent_price, created_at')
    .eq('item_id', item.id)
    .eq('is_delete', false)
    .order('created_at', { ascending: false })
    .returns<RentalOrderItemRow[]>();

  if (rentalRowsError) throw rentalRowsError;

  const orderIds = Array.from(
    new Set((rentalRows ?? []).map((entry) => entry.order_id)),
  );

  let orderById = new Map<string, RentalOrderRow>();
  if (orderIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from('rental_orders')
      .select('id, order_code, status, start_date, end_date, created_at')
      .in('id', orderIds)
      .eq('is_delete', false)
      .returns<RentalOrderRow[]>();

    if (ordersError) throw ordersError;
    orderById = new Map((orders ?? []).map((entry) => [entry.id, entry]));
  }

  const rentalHistory: InventoryRentalHistoryRowDto[] = (rentalRows ?? [])
    .map((entry) => {
      const order = orderById.get(entry.order_id);
      if (!order) return null;

      return {
        orderId: order.id,
        orderCode: order.order_code,
        orderStatus: order.status,
        startDate: order.start_date,
        endDate: order.end_date,
        rentPrice: parseNumeric(entry.rent_price),
        createdAt: entry.created_at,
      };
    })
    .filter((entry): entry is InventoryRentalHistoryRowDto => Boolean(entry));

  return {
    item: listItem,
    statusLogs: (statusLogs ?? []).map(mapStatusLogRow),
    rentalHistory,
    productDescription: product.description,
    material: product.material,
  };
}
