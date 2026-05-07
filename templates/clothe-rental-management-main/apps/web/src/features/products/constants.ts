import type { ProductGender, ProductInitialItemStatus } from "@/types/productsCatalog";

export const PRODUCTS_FEATURE_KEY = "products";
export const PRODUCTS_DEFAULT_PAGE_SIZE = 12;
export const PRODUCTS_MAX_PAGE_SIZE = 60;
export const PRODUCT_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BUCKET ?? "product-images";

export const PRODUCT_DETAIL_TABS = [
  "overview",
  "items",
  "activity",
] as const;

export type ProductDetailTabKey = (typeof PRODUCT_DETAIL_TABS)[number];

export const PRODUCT_GENDER_OPTIONS: ProductGender[] = [
  "female",
  "male",
  "unisex",
  "other",
];

export const PRODUCT_INITIAL_ITEM_STATUS_VALUES: ProductInitialItemStatus[] = [
  "READY",
  "LAUNDRY",
  "MAINTENANCE",
  "DAMAGED",
  "SOLD",
];
