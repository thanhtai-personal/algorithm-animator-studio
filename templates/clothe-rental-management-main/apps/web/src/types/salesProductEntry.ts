import type {
  ProductDetailDto,
  ProductGender,
  ProductInitialItemInput,
  ProductInitialItemStatus,
  ProductsListQuery,
  ProductsListResponse,
  UpdateProductOverviewPayload,
} from "@/types/productsCatalog";

export type SalesProductEntryInitialStatus = ProductInitialItemStatus;

export interface SalesProductEntryProductInput {
  productCode: string;
  name: string;
  productCategoryId?: string | null;
  gender?: ProductGender | null;
  material?: string | null;
  description?: string | null;
  coverImagePath?: string | null;
  galleryImagePaths?: string[];
  videoUrls?: string[];
  quickRentPrice?: number | null;
  rentDepositAmount?: number | null;
  salePrice?: number | null;
  purchasePrice?: number | null;
  tagIds?: string[];
  isActive?: boolean;
  isRentable?: boolean;
  isSaleable?: boolean;
}

export interface SalesProductEntryPricingInput {
  price1d: number;
  defaultDepositAmount?: number | null;
  price3d?: number | null;
  price7d?: number | null;
  pricePerDay?: number | null;
}

export type SalesProductEntryItemInput = ProductInitialItemInput;

export interface CreateSalesProductEntryPayload {
  branchId?: string | null;
  product: SalesProductEntryProductInput;
  pricing: SalesProductEntryPricingInput;
  items: SalesProductEntryItemInput[];
}

export type SalesProductsCatalogQuery = ProductsListQuery;
export type SalesProductsCatalogResponse = ProductsListResponse;

export type UpdateSalesProductEntryPayload = UpdateProductOverviewPayload;
export type SalesProductEntryDetailResponse = ProductDetailDto;
