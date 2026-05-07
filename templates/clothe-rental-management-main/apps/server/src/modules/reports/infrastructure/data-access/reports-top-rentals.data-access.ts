import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  TopRentalItemRowDto,
  TopRentalProductRowDto,
} from '../../types/reports-module.type';
import type { DateRange } from './reports-common.data-access.utils';
import {
  TOP_RENTALS_LIMIT,
  parseNumeric,
  roundMoney,
  sanitizeText,
} from './reports-common.data-access.utils';
import { diffDaysBetweenIsoDates } from './reports-date-range.data-access.utils';
import {
  fetchCategoriesByIds,
  fetchItemsByIds,
  fetchProductsByIds,
} from './reports-reference.data-access';

const TOP_RENTAL_ORDER_STATUSES = [
  'RESERVED',
  'CONFIRMED',
  'PICKED_UP',
  'RETURNED',
  'DEBT',
  'COMPLETED',
];

interface TopRentalOrderRow {
  id: string;
  start_date: string;
  end_date: string;
}

interface TopRentalOrderItemRow {
  order_id: string;
  item_id: string;
  product_id: string;
  item_code_snapshot: string | null;
  product_name_snapshot: string | null;
  rent_price: number | string | null;
}

interface ProductTopAggregate {
  productId: string;
  productName: string;
  categoryName: string | null;
  bookingCount: number;
  rentalDays: number;
  rentAmount: number;
}

interface ItemTopAggregate {
  itemId: string;
  itemCode: string;
  productId: string;
  productName: string;
  variantName: string | null;
  bookingCount: number;
  rentalDays: number;
  rentAmount: number;
}

interface TopRentalAggregate {
  topProducts: TopRentalProductRowDto[];
  topItems: TopRentalItemRowDto[];
}

async function fetchTopRentalOrders(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    dateRange: DateRange;
  },
): Promise<TopRentalOrderRow[]> {
  const { data, error } = await supabase
    .from('rental_orders')
    .select('id, start_date, end_date')
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .gte('start_date', options.dateRange.startDate)
    .lte('start_date', options.dateRange.endDate)
    .in('status', TOP_RENTAL_ORDER_STATUSES)
    .returns<TopRentalOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchTopRentalOrderItems(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<TopRentalOrderItemRow[]> {
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('rental_order_items')
    .select(
      'order_id, item_id, product_id, item_code_snapshot, product_name_snapshot, rent_price',
    )
    .in('order_id', orderIds)
    .eq('is_delete', false)
    .returns<TopRentalOrderItemRow[]>();

  if (error) throw error;
  return data ?? [];
}

function compareTopRows(
  a: { bookingCount: number; rentalDays: number; rentAmount: number },
  b: { bookingCount: number; rentalDays: number; rentAmount: number },
): number {
  if (a.bookingCount !== b.bookingCount) {
    return b.bookingCount - a.bookingCount;
  }

  if (a.rentalDays !== b.rentalDays) {
    return b.rentalDays - a.rentalDays;
  }

  if (a.rentAmount !== b.rentAmount) {
    return b.rentAmount - a.rentAmount;
  }

  return 0;
}

export async function computeTopRentals(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    dateRange: DateRange;
  },
): Promise<TopRentalAggregate> {
  const orders = await fetchTopRentalOrders(supabase, {
    branchId: options.branchId,
    dateRange: options.dateRange,
  });

  if (orders.length === 0) {
    return {
      topProducts: [],
      topItems: [],
    };
  }

  const orderById = new Map(orders.map((row) => [row.id, row]));
  const orderIds = orders.map((row) => row.id);

  const orderItems = await fetchTopRentalOrderItems(supabase, orderIds);
  if (orderItems.length === 0) {
    return {
      topProducts: [],
      topItems: [],
    };
  }

  const productIds = Array.from(
    new Set(orderItems.map((row) => row.product_id)),
  );
  const itemIds = Array.from(new Set(orderItems.map((row) => row.item_id)));

  const [productById, itemById] = await Promise.all([
    fetchProductsByIds(supabase, productIds, {
      branchId: options.branchId,
    }),
    fetchItemsByIds(supabase, itemIds, {
      branchId: options.branchId,
    }),
  ]);

  const productCategoryIds = Array.from(
    new Set(
      Array.from(productById.values())
        .map((row) => row.category_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const categoryById = await fetchCategoriesByIds(
    supabase,
    productCategoryIds,
    {
      branchId: options.branchId,
    },
  );

  const productAggregate = new Map<string, ProductTopAggregate>();
  const itemAggregate = new Map<string, ItemTopAggregate>();

  for (const row of orderItems) {
    const order = orderById.get(row.order_id);
    if (!order) continue;

    const orderDurationDays = Math.max(
      1,
      diffDaysBetweenIsoDates(order.start_date, order.end_date),
    );
    const rentAmount = roundMoney(Math.max(0, parseNumeric(row.rent_price)));

    const productRef = productById.get(row.product_id);
    const productName =
      sanitizeText(row.product_name_snapshot) ??
      sanitizeText(productRef?.name) ??
      'Unknown product';

    const categoryName = productRef?.category_id
      ? sanitizeText(categoryById.get(productRef.category_id)?.name)
      : null;

    const nextProduct = productAggregate.get(row.product_id) ?? {
      productId: row.product_id,
      productName,
      categoryName,
      bookingCount: 0,
      rentalDays: 0,
      rentAmount: 0,
    };

    nextProduct.bookingCount += 1;
    nextProduct.rentalDays += orderDurationDays;
    nextProduct.rentAmount = roundMoney(nextProduct.rentAmount + rentAmount);
    productAggregate.set(row.product_id, nextProduct);

    const itemRef = itemById.get(row.item_id);
    const itemCode =
      sanitizeText(row.item_code_snapshot) ?? itemRef?.item_code ?? row.item_id;

    const nextItem = itemAggregate.get(row.item_id) ?? {
      itemId: row.item_id,
      itemCode,
      productId: row.product_id,
      productName,
      variantName: null,
      bookingCount: 0,
      rentalDays: 0,
      rentAmount: 0,
    };

    nextItem.bookingCount += 1;
    nextItem.rentalDays += orderDurationDays;
    nextItem.rentAmount = roundMoney(nextItem.rentAmount + rentAmount);
    itemAggregate.set(row.item_id, nextItem);
  }

  const topProducts = Array.from(productAggregate.values())
    .sort((a, b) => {
      const diff = compareTopRows(a, b);
      if (diff !== 0) return diff;
      return a.productName.localeCompare(b.productName);
    })
    .slice(0, TOP_RENTALS_LIMIT);

  const topItems = Array.from(itemAggregate.values())
    .sort((a, b) => {
      const diff = compareTopRows(a, b);
      if (diff !== 0) return diff;
      return a.itemCode.localeCompare(b.itemCode);
    })
    .slice(0, TOP_RENTALS_LIMIT);

  return {
    topProducts,
    topItems,
  };
}
