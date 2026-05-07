import type { ProductGender } from "@/types/productsCatalog";

export const SHOWROOM_FEATURE_KEY = "showroom";
export const SHOWROOM_DEFAULT_PAGE_SIZE = 12;
export const SHOWROOM_MAX_PAGE_SIZE = 60;
export const SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_DEFAULT = "PRODUCT_HOME_V1";
export const SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM = "PRODUCT_HOME_CHARM_V1";
export const SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN = "PRODUCT_HOME_MODERN_V1";
export const SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D = "PRODUCT_HOME_3D_V1";
export const SHOWROOM_DEFAULT_TEMPLATE_CODE = SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_DEFAULT;
export const SHOWROOM_SHORTLIST_STORAGE_KEY = "showroom:shortlist:v1";
export const SHOWROOM_PRODUCT_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BUCKET ?? "product-images";

export const SHOWROOM_GENDER_OPTIONS: ProductGender[] = [
  "female",
  "male",
  "unisex",
  "other",
];
