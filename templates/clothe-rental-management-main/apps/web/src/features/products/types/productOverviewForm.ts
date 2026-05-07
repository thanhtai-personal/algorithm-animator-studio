import type { ProductGender } from "@/types/productsCatalog";

export interface ProductOverviewFormDraft {
  productCode: string;
  name: string;
  productCategoryId: string;
  gender: "" | ProductGender;
  material: string;
  description: string;
  rentPricePerDay: string;
  quickRentPrice: string;
  rentDepositAmount: string;
  salePrice: string;
  purchasePrice: string;
  isRentable: boolean;
  isSaleable: boolean;
  tagIds: string[];
  isActive: boolean;
  coverImageUrl: string;
  galleryImageUrlsText: string;
  videoUrlsText: string;
}
