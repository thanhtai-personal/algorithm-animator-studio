import type { ItemStatus } from "@/types/domainPrimitives";
import type {
  ProductCategoryDto,
  ProductInitialItemInput,
  ProductPricePlanDto,
} from "@/types/productsCatalog";

export type InventoryListViewMode = "items" | "products";

export interface InventoryOrderRefDto {
  orderId: string;
  orderCode: string;
  orderStatus: string;
  startDate: string;
  endDate: string;
}

export interface InventoryStatusLogDto {
  id: string;
  itemId: string;
  orderId: string | null;
  fromStatus: ItemStatus | null;
  toStatus: ItemStatus;
  reasonCode: string | null;
  reasonNote: string | null;
  actorProfileId: string | null;
  happenedAt: string;
}

export interface InventoryRentalHistoryRowDto {
  orderId: string;
  orderCode: string;
  orderStatus: string;
  startDate: string;
  endDate: string;
  rentPrice: number | null;
  createdAt: string;
}

export interface InventoryListItemDto {
  id: string;
  branchId: string;
  itemCode: string;
  qrCode: string | null;
  status: ItemStatus;
  variantId: string;
  variantCode: string;
  variantName: string;
  size: string | null;
  color: string | null;
  productId: string;
  productCode: string;
  productName: string;
  productCategoryId: string | null;
  categoryName: string | null;
  coverImagePath: string | null;
  quickRentPrice: number | null;
  pricePlan: ProductPricePlanDto;
  currentOrder: InventoryOrderRefDto | null;
  lastMovementAt: string | null;
  lastMovementToStatus: ItemStatus | null;
  retiredAt: string | null;
  retiredReason: string | null;
}

export interface InventoryListQuery {
  viewMode?: InventoryListViewMode;
  branchId?: string | null;
  status?: ItemStatus | null;
  excludeSold?: boolean;
  productCategoryId?: string | null;
  size?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryListResponse {
  items: InventoryListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  categories: ProductCategoryDto[];
  sizes: string[];
  branchOptions: string[];
}

export interface InventoryProductListItemDto {
  productId: string;
  branchId: string;
  productCode: string;
  productName: string;
  productCategoryId: string | null;
  categoryName: string | null;
  coverImagePath: string | null;
  itemCount: number;
  readyItemCount: number;
}

export interface InventoryProductListResponse {
  items: InventoryProductListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  categories: ProductCategoryDto[];
  sizes: string[];
  branchOptions: string[];
}

export interface InventoryProductOptionDto {
  id: string;
  branchId: string | null;
  productCode: string;
  name: string;
}

export interface InventoryProductOptionsQuery {
  branchId?: string | null;
  search?: string;
  pageSize?: number;
}

export interface InventoryProductOptionsResponse {
  items: InventoryProductOptionDto[];
}

export interface InventoryItemDetailDto {
  item: InventoryListItemDto;
  statusLogs: InventoryStatusLogDto[];
  rentalHistory: InventoryRentalHistoryRowDto[];
  productDescription: string | null;
  material: string | null;
}

export interface UpdateInventoryItemStatusPayload {
  toStatus: ItemStatus;
  reasonCode?: string | null;
  reasonNote?: string | null;
  orderId?: string | null;
}

export interface BulkUpdateInventoryItemStatusPayload
  extends UpdateInventoryItemStatusPayload {
  itemIds: string[];
}

export interface InventoryBulkStatusUpdateSummaryDto {
  total: number;
  success: number;
  failed: number;
}

export interface InventoryBulkStatusFailedItemDto {
  itemId: string;
  itemCode: string | null;
  reasonCode: string;
  reasonMessage: string;
}

export interface InventoryBulkStatusUpdateResultDto {
  summary: InventoryBulkStatusUpdateSummaryDto;
  failedItems: InventoryBulkStatusFailedItemDto[];
  succeededItemIds: string[];
}

export interface InventoryScanResultDto {
  itemId: string;
  itemCode: string;
  qrCode: string | null;
  status: ItemStatus;
}

export interface InventoryAddProductItemsPayload {
  productId: string;
  items: ProductInitialItemInput[];
}
