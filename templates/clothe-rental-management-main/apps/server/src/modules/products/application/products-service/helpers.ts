import type {
  AddProductItemsPayload,
  ProductGender,
  ProductInitialItemStatus,
  ProductVariantPricingPatch,
  UpdateProductItemPayload,
  UpdateProductOverviewPayload,
  UpdateProductPricingPayload,
} from '../../types/products-catalog.type';
export const MAX_PAGE_SIZE = 60;
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_ADD_ITEMS_QUANTITY = 500;
export const PRICING_EDITOR_ROLE_SET = new Set([
  'owner_admin',
  'admin',
  'manager',
]);
export const PRODUCT_DELETE_ROLE_SET = new Set([
  'owner_admin',
  'admin',
  'manager',
]);
export const SENSITIVE_PRODUCT_OVERVIEW_ROLE_SET = new Set([
  'owner_admin',
  'admin',
  'manager',
]);
export const PRODUCT_ENTRY_STATUS_SET = new Set<ProductInitialItemStatus>([
  'READY',
  'LAUNDRY',
  'MAINTENANCE',
  'DAMAGED',
  'SOLD',
]);
export const MANUAL_VARIANT_MUTATION_DISABLED_CODE =
  'MANUAL_VARIANT_MUTATION_DISABLED';

export function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hasLegacyOrCurrentProductCategoryIdField(
  record: Record<string, unknown>,
): boolean {
  return (
    Object.prototype.hasOwnProperty.call(record, 'productCategoryId') ||
    Object.prototype.hasOwnProperty.call(record, 'categoryId')
  );
}

export function parseProductCategoryIdFromRecord(
  record: Record<string, unknown>,
): string | null {
  if (Object.prototype.hasOwnProperty.call(record, 'productCategoryId')) {
    return parseString(record.productCategoryId);
  }

  return parseString(record.categoryId);
}

export function parseProductCategoryIdFromSearchParams(
  searchParams: URLSearchParams,
): string | null {
  const current = parseString(searchParams.get('productCategoryId'));
  if (current) return current;
  return parseString(searchParams.get('categoryId'));
}

export function parseBoolean(value: string | null): boolean {
  return value === '1' || value === 'true';
}

export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  return undefined;
}

export function parseInteger(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function parseCommaSeparatedIds(value: string | null): string[] {
  if (!value) return [];

  const output: string[] = [];
  const seen = new Set<string>();

  for (const part of value.split(',')) {
    const normalized = parseString(part);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

export function parseGender(value: unknown): ProductGender | null | undefined {
  if (value === null) return null;
  const text = parseString(typeof value === 'string' ? value : null);
  if (!text) return undefined;
  const normalized = text.toLowerCase();
  if (
    normalized === 'female' ||
    normalized === 'male' ||
    normalized === 'unisex' ||
    normalized === 'other'
  ) {
    return normalized;
  }
  return undefined;
}

export function parseGenderList(value: string | null): ProductGender[] {
  if (!value) return [];

  const output: ProductGender[] = [];
  const seen = new Set<ProductGender>();

  for (const part of value.split(',')) {
    const parsed = parseGender(part);
    if (!parsed || parsed === null) continue;
    if (seen.has(parsed)) continue;
    seen.add(parsed);
    output.push(parsed);
  }

  return output;
}

export function parseTagIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const output: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

export function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const output: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

export function parseNonNegativeNumber(
  value: unknown,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  let parsed: number;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string') {
    parsed = Number(value);
  } else {
    return undefined;
  }

  if (!Number.isFinite(parsed)) return undefined;
  if (parsed < 0) return undefined;
  return parsed;
}

export function parseOverviewPayload(body: Record<string, unknown>): {
  payload: UpdateProductOverviewPayload;
  hasPurchasePriceField: boolean;
} | null {
  const payload: UpdateProductOverviewPayload = {};
  let hasPurchasePriceField = false;

  const name = parseString(body.name);
  if (name) payload.name = name;

  if (hasLegacyOrCurrentProductCategoryIdField(body)) {
    payload.productCategoryId = parseProductCategoryIdFromRecord(body);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'gender')) {
    const gender = parseGender(body.gender);
    if (gender !== undefined) {
      payload.gender = gender;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'material')) {
    payload.material = parseString(body.material);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    payload.description = parseString(body.description);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'coverImagePath')) {
    payload.coverImagePath = parseString(body.coverImagePath);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'productCode')) {
    const productCode = parseString(body.productCode);
    if (productCode === null) return null;
    payload.productCode = productCode;
  }

  const galleryImagePaths = parseStringArray(body.galleryImagePaths);
  if (galleryImagePaths !== undefined) {
    payload.galleryImagePaths = galleryImagePaths;
  }

  const videoUrls = parseStringArray(body.videoUrls);
  if (videoUrls !== undefined) {
    payload.videoUrls = videoUrls;
  }

  const isActive = parseOptionalBoolean(body.isActive);
  if (
    Object.prototype.hasOwnProperty.call(body, 'isActive') &&
    isActive === undefined
  ) {
    return null;
  }
  if (isActive !== undefined) {
    payload.isActive = isActive;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'rentPricePerDay')) {
    const rentPricePerDay = parseNonNegativeNumber(body.rentPricePerDay);
    if (rentPricePerDay === undefined) return null;
    payload.rentPricePerDay = rentPricePerDay;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'quickRentPrice')) {
    const quickRentPrice = parseNonNegativeNumber(body.quickRentPrice);
    if (quickRentPrice === undefined) return null;
    payload.quickRentPrice = quickRentPrice;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'rentDepositAmount')) {
    const rentDepositAmount = parseNonNegativeNumber(body.rentDepositAmount);
    if (rentDepositAmount === undefined) return null;
    payload.rentDepositAmount = rentDepositAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'salePrice')) {
    const salePrice = parseNonNegativeNumber(body.salePrice);
    if (salePrice === undefined) return null;
    payload.salePrice = salePrice;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'purchasePrice')) {
    const purchasePrice = parseNonNegativeNumber(body.purchasePrice);
    if (purchasePrice === undefined) return null;
    payload.purchasePrice = purchasePrice;
    hasPurchasePriceField = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isRentable')) {
    const isRentable = parseOptionalBoolean(body.isRentable);
    if (isRentable === undefined) return null;
    payload.isRentable = isRentable;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isSaleable')) {
    const isSaleable = parseOptionalBoolean(body.isSaleable);
    if (isSaleable === undefined) return null;
    payload.isSaleable = isSaleable;
  }

  const tagIds = parseTagIds(body.tagIds);
  if (tagIds !== undefined) {
    payload.tagIds = tagIds;
  }

  return {
    payload,
    hasPurchasePriceField,
  };
}

export function parsePricingPayload(
  body: Record<string, unknown>,
): UpdateProductPricingPayload | null {
  if (!Array.isArray(body.variants)) {
    return null;
  }

  const patches: ProductVariantPricingPatch[] = [];

  for (const entry of body.variants) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const record = entry as Record<string, unknown>;
    const variantId = parseString(record.variantId);
    if (!variantId) {
      return null;
    }

    const defaultDepositAmount = parseNonNegativeNumber(
      record.defaultDepositAmount,
    );
    const price1d = parseNonNegativeNumber(record.price1d);
    const price3d = parseNonNegativeNumber(record.price3d);
    const price7d = parseNonNegativeNumber(record.price7d);
    const pricePerDay = parseNonNegativeNumber(record.pricePerDay);

    if (
      defaultDepositAmount === undefined ||
      price1d === undefined ||
      price3d === undefined ||
      price7d === undefined ||
      pricePerDay === undefined
    ) {
      return null;
    }

    patches.push({
      variantId,
      defaultDepositAmount,
      price1d,
      price3d,
      price7d,
      pricePerDay,
    });
  }

  return {
    variants: patches,
  };
}

export function parseInitialItemStatus(
  value: unknown,
): ProductInitialItemStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase() as ProductInitialItemStatus;
  if (!PRODUCT_ENTRY_STATUS_SET.has(normalized)) return null;
  return normalized;
}

export function parsePositiveInteger(value: unknown): number | null {
  if (value === undefined) return null;
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) return null;
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }

  return null;
}

export function buildItemCodesFromBase(
  itemCode: string,
  quantity: number,
): string[] {
  if (quantity <= 1) return [itemCode];

  return Array.from({ length: quantity }, (_value, index) => {
    const suffix = String(index + 1).padStart(3, '0');
    return `${itemCode}-${suffix}`;
  });
}

export function parseProductItemsPayload(
  body: Record<string, unknown>,
): AddProductItemsPayload | null {
  if (Array.isArray(body.items)) {
    const items: AddProductItemsPayload['items'] = [];
    for (const row of body.items) {
      if (!row || typeof row !== 'object') return null;
      const record = row as Record<string, unknown>;
      const itemCode = parseString(record.itemCode);
      const initialStatus = parseInitialItemStatus(record.initialStatus);
      if (!itemCode || !initialStatus) return null;
      items.push({
        itemCode,
        initialStatus,
        size: parseString(record.size),
      });
    }

    if (items.length === 0) return null;
    return { items };
  }

  const itemCode = parseString(
    typeof body.itemCode === 'string' ? body.itemCode : null,
  );
  const initialStatus = parseInitialItemStatus(body.initialStatus);
  if (!itemCode || !initialStatus) return null;

  const parsedQuantity = Object.prototype.hasOwnProperty.call(body, 'quantity')
    ? parsePositiveInteger(body.quantity)
    : 1;
  if (!parsedQuantity || parsedQuantity > MAX_ADD_ITEMS_QUANTITY) return null;

  const size = parseString(typeof body.size === 'string' ? body.size : null);
  const generatedItemCodes = buildItemCodesFromBase(itemCode, parsedQuantity);

  return {
    items: generatedItemCodes.map((generatedItemCode) => ({
      itemCode: generatedItemCode,
      initialStatus,
      size,
    })),
  };
}

export function parseUpdateProductItemPayload(
  body: Record<string, unknown>,
): UpdateProductItemPayload | null {
  const itemCode = parseString(body.itemCode);
  if (!itemCode) return null;

  let size: string | null | undefined;
  if (Object.prototype.hasOwnProperty.call(body, 'size')) {
    if (body.size === null) {
      size = null;
    } else if (typeof body.size === 'string') {
      size = parseString(body.size);
    } else {
      return null;
    }
  }

  if (size === undefined) {
    return { itemCode };
  }

  return {
    itemCode,
    size,
  };
}
