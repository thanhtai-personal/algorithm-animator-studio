import type { AppLocale } from "@/constants/locale";
import type { ProductOverviewFormDraft } from "@/features/products/types/productOverviewForm";
import { validateNonNegativeMoneyInput } from "@/utils/validation/money";
import type { ProductInitialItemStatus } from "@/types/productsCatalog";
import type { ProductsListCopy } from "./types";

const DEFAULT_CREATE_RENT_PRICE = "290000";
const DEFAULT_CREATE_QUICK_RENT_PRICE = "290000";
const DEFAULT_CREATE_RENT_DEPOSIT_AMOUNT = "200000";
const DEFAULT_CREATE_GENDER = "female";

function formatProductCodeDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = String(value.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

function formatProductIndex(value: number): string {
  return String(Math.max(1, value)).padStart(2, "0");
}

export function generateProductCode(productIndex: number, date: Date = new Date()): string {
  return `${formatProductCodeDate(date)}-${formatProductIndex(productIndex)}`;
}

export function buildInitialCreateDraft(productIndex = 1): ProductOverviewFormDraft {
  return {
    productCode: generateProductCode(productIndex),
    name: `váy - ${productIndex}`,
    productCategoryId: "",
    gender: DEFAULT_CREATE_GENDER,
    material: "",
    description: "",
    rentPricePerDay: DEFAULT_CREATE_RENT_PRICE,
    quickRentPrice: DEFAULT_CREATE_QUICK_RENT_PRICE,
    rentDepositAmount: DEFAULT_CREATE_RENT_DEPOSIT_AMOUNT,
    salePrice: "",
    purchasePrice: "",
    isRentable: true,
    isSaleable: true,
    tagIds: [],
    isActive: true,
    coverImageUrl: "",
    galleryImageUrlsText: "",
    videoUrlsText: "",
  };
}

export function parseMultilineValues(value: string): string[] {
  return value
    .split(/\r?\n|,/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function uniqueValues(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value.trim());
  }

  return output;
}

export function parseMoneyField(
  value: string,
  locale: AppLocale,
  options?: { fieldName?: string }
): number | null {
  const parsed = validateNonNegativeMoneyInput(value, { allowEmpty: true });
  if (parsed.isValid) {
    return parsed.value;
  }

  const fallbackFieldName = locale === "vi" ? "Giá trị tiền" : "Money value";
  const fieldName = options?.fieldName ?? fallbackFieldName;
  throw new Error(
    locale === "vi"
      ? `${fieldName} không hợp lệ hoặc nhỏ hơn 0`
      : `${fieldName} is invalid or below zero`
  );
}

export function normalizeInitialItemStatusForRole(
  value: ProductInitialItemStatus,
  canEditPricing: boolean
): ProductInitialItemStatus {
  if (!canEditPricing && value === "SOLD") {
    return "READY";
  }
  return value;
}

export function resolveCreateProductErrorMessage(options: {
  error: unknown;
  copy: ProductsListCopy;
  fallback: string;
}): string {
  if (!(options.error instanceof Error)) return options.fallback;

  if (
    options.error.message === "DUPLICATE_ITEM_CODE" ||
    options.error.message === "DUPLICATE_ITEM_CODE_IN_PAYLOAD"
  ) {
    return options.copy.duplicateItemCodeExistsError;
  }

  if (options.error.message === "MISSING_REQUIRED_PRODUCT_PRICES") {
    return "Giá thuê là bắt buộc. (Rent price is required.)";
  }
  if (options.error.message === "FORBIDDEN_SENSITIVE_PRICING_FOR_STAFF") {
    return "Cần quyền quản lý giá nhập để nhập giá này. (Purchase-price permission is required.)";
  }

  return options.error.message || options.fallback;
}

export function resolveDeleteProductErrorMessage(options: {
  error: unknown;
  copy: ProductsListCopy;
  fallback: string;
}): string {
  if (!(options.error instanceof Error)) return options.fallback;

  if (options.error.message === "PRODUCT_DELETE_FORBIDDEN_FINANCIAL_LINKS") {
    return options.copy.deleteBlockedFinancialLinksError;
  }

  return options.error.message || options.fallback;
}
