import type { ProductGender } from "@/types/productsCatalog";
import type { SalesProductEntryInitialStatus } from "@/types/salesProductEntry";

export type FieldErrors = Record<string, string>;

export interface SalesProductEntryDraft {
  productCode: string;
  productName: string;
  productCategoryId: string;
  gender: "" | ProductGender;
  coverImageUrl: string;
  galleryImageUrlsText: string;
  videoUrlsText: string;
  material: string;
  description: string;
  tagIds: string[];
  isActive: boolean;
  isRentable: boolean;
  isSaleable: boolean;
  price1dInput: string;
  salePriceInput: string;
  purchasePriceInput: string;
  defaultDepositInput: string;
  price3dInput: string;
  price7dInput: string;
  pricePerDayInput: string;
  itemQuantityInput: string;
  initialItemStatus: SalesProductEntryInitialStatus;
  itemSize: string;
}

export interface SalesProductEntryCopy {
  title: string;
  subtitle: string;
  branchMissing: string;
  submitAction: string;
  resetAction: string;
  creatingLabel: string;
  createSuccess: string;
  createFailed: string;
  draftSavedHint: string;
  requiredError: string;
  invalidMoneyError: string;
  purchasePricePermissionError: string;
  invalidItemQuantityError: string;
  productCodeRequiredForItemsError: string;
  itemQuantityHint: string;
  itemsPreviewEmpty: string;
  permissionsNoteStaff: string;
  permissionsNoteAdmin: string;
  formSections: {
    product: string;
    pricing: string;
    batchItems: string;
    summary: string;
    recentProducts: string;
  };
  formGroups: {
    basic: string;
    media: string;
    attributes: string;
    business: string;
  };
  fields: {
    productCode: string;
    productName: string;
    category: string;
    gender: string;
    material: string;
    description: string;
    tags: string;
    active: string;
    isRentable: string;
    isSaleable: string;
    coverImage: string;
    galleryImages: string;
    videos: string;
    price1d: string;
    salePrice: string;
    purchasePrice: string;
    defaultDeposit: string;
    price3d: string;
    price7d: string;
    pricePerDay: string;
    itemQuantity: string;
    itemCodes: string;
    itemStatus: string;
    itemSize: string;
  };
  itemStatusOptions: Array<{ value: SalesProductEntryInitialStatus; label: string }>;
  placeholders: {
    mediaUrls: string;
  };
}
