import type {
  InventoryListItemDto,
  InventoryProductListItemDto,
  InventoryStatusLogDto,
} from '../../types/inventory-items.type';
import type { ProductCategoryDto } from '../../../products/types/products-catalog.type';
import {
  normalizeItemStatus,
  parseNumeric,
  type ItemRow,
  type ProductRow,
} from './shared-core';
export function buildInventoryListItem(options: {
  item: ItemRow;
  productById: Map<string, ProductRow>;
  categoryById: Map<string, ProductCategoryDto>;
  currentOrderByItemId: Map<string, InventoryListItemDto['currentOrder']>;
  lastMovementByItemId: Map<string, InventoryStatusLogDto>;
}): InventoryListItemDto | null {
  const product = options.productById.get(options.item.product_id);
  if (!product) return null;

  const category = product.category_id
    ? options.categoryById.get(product.category_id)
    : null;
  const lastMovement =
    options.lastMovementByItemId.get(options.item.id) ?? null;
  const baseRentPrice = parseNumeric(product.rent_price_per_day);
  const quickRentPrice = parseNumeric(product.quick_rent_price);
  const baseDepositAmount = parseNumeric(product.rent_deposit_amount);

  return {
    id: options.item.id,
    branchId: options.item.branch_id,
    itemCode: options.item.item_code,
    qrCode: options.item.qr_code,
    status: normalizeItemStatus(options.item.status),
    variantId: product.id,
    variantCode: 'DEFAULT',
    variantName: product.name,
    size: options.item.size,
    color: null,
    productId: product.id,
    productCode: product.product_code,
    productName: product.name,
    productCategoryId: product.category_id,
    categoryName: category?.name ?? null,
    coverImagePath: product.cover_image_path,
    quickRentPrice,
    pricePlan: {
      defaultDepositAmount: baseDepositAmount,
      price1d: baseRentPrice,
      price3d: null,
      price7d: null,
      pricePerDay: baseRentPrice,
    },
    currentOrder: options.currentOrderByItemId.get(options.item.id) ?? null,
    lastMovementAt: lastMovement?.happenedAt ?? null,
    lastMovementToStatus: lastMovement?.toStatus ?? null,
    retiredAt: options.item.retired_at,
    retiredReason: options.item.retired_reason,
  };
}

export function buildInventoryProductListItem(options: {
  product: ProductRow;
  categoryById: Map<string, ProductCategoryDto>;
  branchId: string;
  itemCount: number;
  readyItemCount: number;
}): InventoryProductListItemDto {
  const category = options.product.category_id
    ? options.categoryById.get(options.product.category_id)
    : null;

  return {
    productId: options.product.id,
    branchId: options.branchId,
    productCode: options.product.product_code,
    productName: options.product.name,
    productCategoryId: options.product.category_id,
    categoryName: category?.name ?? null,
    coverImagePath: options.product.cover_image_path,
    itemCount: options.itemCount,
    readyItemCount: options.readyItemCount,
  };
}
