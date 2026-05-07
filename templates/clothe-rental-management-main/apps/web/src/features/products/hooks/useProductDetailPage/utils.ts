import type { ProductOverviewFormDraft } from "@/features/products/types/productOverviewForm";
import type { ProductDetailDto } from "@/types/productsCatalog";
import type { ProductDetailCopy } from "./types";

export type OverviewDraft = ProductOverviewFormDraft;

function moneyToInput(value: number | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
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

export function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function generateAutoItemCodes(options: {
  productCode: string;
  existingItemCodes: string[];
  quantity: number;
}): string[] {
  const baseCode = options.productCode.trim();
  if (!baseCode || options.quantity <= 0) return [];

  const existingKeys = new Set(
    options.existingItemCodes
      .map((code) => code.trim().toLowerCase())
      .filter((code) => code.length > 0)
  );

  const prefix = `${baseCode.toLowerCase()}-`;
  let nextIndex = 1;

  for (const code of options.existingItemCodes) {
    const trimmed = code.trim();
    const normalized = trimmed.toLowerCase();
    if (!normalized.startsWith(prefix)) continue;

    const suffix = trimmed.slice(baseCode.length + 1).trim();
    if (!/^\d+$/.test(suffix)) continue;

    const parsed = Number.parseInt(suffix, 10);
    if (!Number.isFinite(parsed)) continue;
    nextIndex = Math.max(nextIndex, parsed + 1);
  }

  const generatedCodes: string[] = [];

  while (generatedCodes.length < options.quantity) {
    const candidate = `${baseCode}-${String(nextIndex).padStart(3, "0")}`;
    nextIndex += 1;

    const candidateKey = candidate.toLowerCase();
    if (existingKeys.has(candidateKey)) continue;

    existingKeys.add(candidateKey);
    generatedCodes.push(candidate);
  }

  return generatedCodes;
}

export function resolveProductDetailActionErrorMessage(options: {
  error: unknown;
  copy: ProductDetailCopy;
  fallback: string;
}): string {
  if (!(options.error instanceof Error)) return options.fallback;

  if (
    options.error.message === "DUPLICATE_ITEM_CODE" ||
    options.error.message === "DUPLICATE_ITEM_CODE_IN_PAYLOAD"
  ) {
    return options.copy.addItemsDuplicateError;
  }

  if (options.error.message === "ITEM_CODE_REQUIRED") {
    return options.copy.editItemRequiredCodeError;
  }

  if (options.error.message === "ITEM_IN_USE_CANNOT_DELETE") {
    return options.copy.deleteItemBlockedError;
  }

  if (options.error.message === "PRODUCT_ITEM_DELETE_FORBIDDEN_FINANCIAL_LINKS") {
    return options.copy.deleteItemRollbackRequiredError;
  }

  return options.error.message || options.fallback;
}

export function createOverviewDraftFromDetail(detail: ProductDetailDto): OverviewDraft {
  return {
    productCode: detail.overview.productCode,
    name: detail.overview.name,
    productCategoryId: detail.overview.productCategoryId ?? "",
    gender: detail.overview.gender ?? "",
    material: detail.overview.material ?? "",
    description: detail.overview.description ?? "",
    rentPricePerDay: moneyToInput(detail.overview.rentPricePerDay),
    quickRentPrice: moneyToInput(detail.overview.quickRentPrice),
    rentDepositAmount: moneyToInput(detail.overview.rentDepositAmount),
    salePrice: moneyToInput(detail.overview.salePrice),
    purchasePrice: moneyToInput(detail.overview.purchasePrice),
    isRentable: detail.overview.isRentable,
    isSaleable: detail.overview.isSaleable,
    isActive: detail.overview.isActive,
    tagIds: detail.overview.tags.map((entry) => entry.id),
    coverImageUrl: detail.overview.coverImagePath ?? "",
    galleryImageUrlsText: detail.overview.galleryImagePaths.join("\n"),
    videoUrlsText: detail.overview.videoUrls.join("\n"),
  };
}
