import type { ItemStatus } from '../../shared/domain/types/domain-primitives.type';

export type ProductGender =
  | 'female'
  | 'male'
  | 'unisex'
  | 'other'
  | 'nam'
  | 'nu'
  | string;
export type ProductInitialItemStatus = Extract<
  ItemStatus,
  'READY' | 'LAUNDRY' | 'MAINTENANCE' | 'DAMAGED' | 'SOLD'
>;

export interface ProductInitialItemInput {
  itemCode: string;
  initialStatus: ProductInitialItemStatus;
  size?: string | null;
}

export interface ProductCategoryDto {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ProductTagDto {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
  color: string | null;
  isActive: boolean;
}

export interface ProductPricePlanDto {
  defaultDepositAmount: number | null;
  price1d: number | null;
  price3d: number | null;
  price7d: number | null;
  pricePerDay: number | null;
}

export interface ProductSummaryDto {
  id: string;
  branchId: string | null;
  productCode: string;
  sizes?: string[];
  readyItemsDetail?: Array<{
    id: string;
    itemCode: string;
    variantId: string;
    variantName: string;
    size: string | null;
    price1d: number | null;
    pricePerDay: number | null;
    defaultDepositAmount: number | null;
  }>;
  name: string;
  productCategoryId: string | null;
  categoryName: string | null;
  gender: ProductGender | null;
  material: string | null;
  coverImagePath: string | null;
  isActive: boolean;
  isArchived: boolean;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  rentDepositAmount: number | null;
  salePrice: number | null;
  purchasePrice: number | null;
  isRentable: boolean;
  isSaleable: boolean;
  successfulRentCount: number;
  tags: ProductTagDto[];
  totalItems: number;
  readyItems: number;
  variantCount: number;
  pricePolicy: ProductPricePlanDto;
  updatedAt: string;
}

export interface ProductsListQuery {
  branchId?: string | null;
  search?: string;
  productCategoryId?: string | null;
  tagId?: string | null;
  hasReadyItems?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProductsListResponse {
  items: ProductSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
  categories: ProductCategoryDto[];
  tags: ProductTagDto[];
}

export interface ProductVariantDto extends ProductPricePlanDto {
  id: string;
  productId: string;
  variantCode: string;
  skuCode: string | null;
  name: string;
  size: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  itemCount: number;
  readyItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductItemDto {
  id: string;
  variantId: string;
  variantName: string;
  itemCode: string;
  size: string | null;
  status: ItemStatus;
  branchId: string;
  lastRentDate: string | null;
}

export interface ProductOverviewDto {
  id: string;
  branchId: string | null;
  productCode: string;
  name: string;
  productCategoryId: string | null;
  categoryName: string | null;
  gender: ProductGender | null;
  material: string | null;
  description: string | null;
  coverImagePath: string | null;
  galleryImagePaths: string[];
  videoUrls: string[];
  isActive: boolean;
  isArchived: boolean;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  rentDepositAmount: number | null;
  salePrice: number | null;
  purchasePrice: number | null;
  isRentable: boolean;
  isSaleable: boolean;
  successfulRentCount: number;
  tags: ProductTagDto[];
  updatedAt: string;
}

export type ProductActivitySource = 'AUDIT_EVENT' | 'ITEM_STATUS_LOG';

export interface ProductActivityEntryDto {
  id: string;
  source: ProductActivitySource;
  actorProfileId: string | null;
  actorName: string | null;
  itemId: string | null;
  itemCode: string | null;
  action: string;
  reason: string | null;
  fromStatus: ItemStatus | null;
  toStatus: ItemStatus | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface ProductDetailDto {
  overview: ProductOverviewDto;
  variants: ProductVariantDto[];
  items: ProductItemDto[];
  categories: ProductCategoryDto[];
  tags: ProductTagDto[];
  activity: ProductActivityEntryDto[];
}

export interface CreateProductPayload {
  branchId?: string | null;
  productCode: string;
  name: string;
  productCategoryId?: string | null;
  gender?: ProductGender | null;
  material?: string | null;
  description?: string | null;
  coverImagePath?: string | null;
  galleryImagePaths?: string[];
  videoUrls?: string[];
  rentPricePerDay?: number | null;
  quickRentPrice?: number | null;
  rentDepositAmount?: number | null;
  salePrice?: number | null;
  purchasePrice?: number | null;
  isRentable?: boolean;
  isSaleable?: boolean;
  tagIds?: string[];
  isActive?: boolean;
  items?: ProductInitialItemInput[];
}

export interface AddProductItemsPayload {
  items: ProductInitialItemInput[];
}

export type AddProductItemsRequestPayload =
  | AddProductItemsPayload
  | {
      itemCode: string;
      quantity?: number;
      initialStatus: ProductInitialItemStatus;
      size?: string | null;
    };

export interface UpdateProductItemPayload {
  itemCode: string;
  size?: string | null;
}

export interface UpdateProductOverviewPayload {
  productCode?: string;
  name?: string;
  productCategoryId?: string | null;
  gender?: ProductGender | null;
  material?: string | null;
  description?: string | null;
  coverImagePath?: string | null;
  galleryImagePaths?: string[];
  videoUrls?: string[];
  rentPricePerDay?: number | null;
  quickRentPrice?: number | null;
  rentDepositAmount?: number | null;
  salePrice?: number | null;
  purchasePrice?: number | null;
  isRentable?: boolean;
  isSaleable?: boolean;
  tagIds?: string[];
  isActive?: boolean;
}

export interface CreateProductVariantPayload extends ProductPricePlanDto {
  variantCode: string;
  skuCode?: string | null;
  name: string;
  size?: string | null;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateProductVariantPayload = Partial<CreateProductVariantPayload>;

export interface ProductVariantPricingPatch extends ProductPricePlanDto {
  variantId: string;
}

export interface UpdateProductPricingPayload {
  variants: ProductVariantPricingPatch[];
}

export interface ShowroomProductsQuery {
  showroomSlug?: string | null;
  branchId?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
  search?: string;
  productCategoryId?: string | null;
  productCategoryIds?: string[];
  tagId?: string | null;
  gender?: ProductGender | null;
  genders?: ProductGender[];
  size?: string | null;
  sizes?: string[];
  color?: string | null;
  productIds?: string[];
  preferRecentIntake?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ShowroomProductCardDto {
  id: string;
  title: string;
  coverImagePath: string | null;
  categoryName: string | null;
  tags: string[];
  gender: ProductGender | null;
  material: string | null;
  sizes: string[];
  colors: string[];
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  salePrice: number | null;
  isRentable: boolean;
  isSaleable: boolean;
  successfulRentCount: number;
  pricePlan: ProductPricePlanDto;
  priceLabel: string | null;
  depositLabel: string | null;
}

export interface ShowroomProductsResponse {
  items: ShowroomProductCardDto[];
  total: number;
  page: number;
  pageSize: number;
  categories: ProductCategoryDto[];
  tags: ProductTagDto[];
}

export interface ShowroomProductDetailQuery {
  showroomSlug?: string | null;
  branchId?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
}

export interface ShowroomProductVariantDto extends ProductPricePlanDto {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
  isActive: boolean;
}

export interface ShowroomReadyItemSizeDto {
  size: string | null;
  count: number;
}

export interface ShowroomProductDetailDto {
  id: string;
  title: string;
  description: string | null;
  coverImagePath: string | null;
  galleryImagePaths: string[];
  videoUrls: string[];
  categoryName: string | null;
  tags: string[];
  gender: ProductGender | null;
  material: string | null;
  sizes: string[];
  colors: string[];
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  salePrice: number | null;
  isRentable: boolean;
  isSaleable: boolean;
  successfulRentCount: number;
  remainingItems: number;
  readyItemSizeBreakdown: ShowroomReadyItemSizeDto[];
  variants: ShowroomProductVariantDto[];
  pricePlan: ProductPricePlanDto;
  priceLabel: string | null;
  depositLabel: string | null;
}
