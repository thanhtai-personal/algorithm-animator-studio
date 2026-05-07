import type { ProductCategoryDto, ProductSummaryDto, ProductTagDto } from "@/types/productsCatalog";
import type { SalesProductEntryDraft } from "./types";

export const INITIAL_DRAFT: SalesProductEntryDraft = {
  productCode: "",
  productName: "",
  productCategoryId: "",
  gender: "",
  coverImageUrl: "",
  galleryImageUrlsText: "",
  videoUrlsText: "",
  material: "",
  description: "",
  tagIds: [],
  isActive: true,
  isRentable: true,
  isSaleable: true,
  price1dInput: "",
  salePriceInput: "",
  purchasePriceInput: "",
  defaultDepositInput: "",
  price3dInput: "",
  price7dInput: "",
  pricePerDayInput: "",
  itemQuantityInput: "0",
  initialItemStatus: "READY",
  itemSize: "",
};

export const SENSITIVE_PRICING_ROLE_SET = new Set(["owner_admin", "admin", "manager"]);
export const EMPTY_CATEGORIES: ProductCategoryDto[] = [];
export const EMPTY_TAGS: ProductTagDto[] = [];
export const EMPTY_PRODUCTS: ProductSummaryDto[] = [];
