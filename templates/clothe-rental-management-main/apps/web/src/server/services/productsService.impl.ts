import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import { createServiceRoleClient } from "@/server/data-access/auth";
import {
  addProductItemsForAdmin,
  createProductForAdmin,
  createSalesProductEntryForActor,
  deleteProductItemForAdmin,
  deleteProductForAdmin,
  fetchProfileRole,
  getSalesProductDetailForActor,
  getShowroomProductDetail,
  getProductDetailForAdmin,
  listProductsForSalesActor,
  listProductsForAdmin,
  listProductsForShowroom,
  SalesProductsDomainError,
  updateProductItemForAdmin,
  updateSalesProductOverviewForActor,
  updateProductOverviewForAdmin,
  updateProductPricingForAdmin,
} from "@/server/data-access/products";
import type {
  AddProductItemsPayload,
  CreateProductPayload,
  ProductInitialItemStatus,
  ProductGender,
  ShowroomProductDetailQuery,
  ProductVariantPricingPatch,
  ShowroomProductsQuery,
  UpdateProductItemPayload,
  UpdateProductOverviewPayload,
  UpdateProductPricingPayload,
} from "@/types/productsCatalog";
import type {
  CreateSalesProductEntryPayload,
  SalesProductsCatalogQuery,
} from "@/types/salesProductEntry";

const MAX_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 12;
const MAX_ADD_ITEMS_QUANTITY = 500;
const PRICING_EDITOR_ROLE_SET = new Set(["owner_admin", "admin", "manager"]);
const PRODUCT_DELETE_ROLE_SET = new Set(["owner_admin", "admin"]);
const SENSITIVE_PRODUCT_OVERVIEW_ROLE_SET = new Set(["owner_admin", "admin", "manager"]);
const PRODUCT_ENTRY_STATUS_SET = new Set<ProductInitialItemStatus>([
  "READY",
  "LAUNDRY",
  "MAINTENANCE",
  "DAMAGED",
  "SOLD",
]);
const MANUAL_VARIANT_MUTATION_DISABLED_CODE = "MANUAL_VARIANT_MUTATION_DISABLED";

function parseString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasLegacyOrCurrentProductCategoryIdField(record: Record<string, unknown>): boolean {
  return (
    Object.prototype.hasOwnProperty.call(record, "productCategoryId") ||
    Object.prototype.hasOwnProperty.call(record, "categoryId")
  );
}

function parseProductCategoryIdFromRecord(record: Record<string, unknown>): string | null {
  if (Object.prototype.hasOwnProperty.call(record, "productCategoryId")) {
    return parseString(record.productCategoryId);
  }

  return parseString(record.categoryId);
}

function parseProductCategoryIdFromSearchParams(searchParams: URLSearchParams): string | null {
  const current = parseString(searchParams.get("productCategoryId"));
  if (current) return current;
  return parseString(searchParams.get("categoryId"));
}

function parseProductCategoryIdsFromSearchParams(searchParams: URLSearchParams): string[] {
  const parsed = parseCommaSeparatedIds(
    searchParams.get("productCategoryIds") ?? searchParams.get("categoryIds")
  );
  if (parsed.length > 0) {
    return parsed;
  }

  const single = parseProductCategoryIdFromSearchParams(searchParams);
  return single ? [single] : [];
}

function parseBoolean(value: string | null): boolean {
  return value === "1" || value === "true";
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function parseInteger(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseCommaSeparatedIds(value: string | null): string[] {
  if (!value) return [];

  const output: string[] = [];
  const seen = new Set<string>();

  for (const part of value.split(",")) {
    const normalized = parseString(part);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function parseGender(value: unknown): ProductGender | null | undefined {
  if (value === null) return null;
  const text = parseString(typeof value === "string" ? value : null);
  if (!text) return undefined;
  const normalized = text.toLowerCase();
  if (normalized === "female" || normalized === "male" || normalized === "unisex" || normalized === "other") {
    return normalized;
  }
  return undefined;
}

function parseGenderList(value: string | null): ProductGender[] {
  if (!value) return [];

  const output: ProductGender[] = [];
  const seen = new Set<ProductGender>();

  for (const part of value.split(",")) {
    const parsed = parseGender(part);
    if (!parsed || parsed === null) continue;
    if (seen.has(parsed)) continue;
    seen.add(parsed);
    output.push(parsed);
  }

  return output;
}

function parseTagIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const output: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const output: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

function parseNonNegativeNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  let parsed: number;
  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string") {
    parsed = Number(value);
  } else {
    return undefined;
  }

  if (!Number.isFinite(parsed)) return undefined;
  if (parsed < 0) return undefined;
  return parsed;
}

function parseOverviewPayload(
  body: Record<string, unknown>
): { payload: UpdateProductOverviewPayload; hasPurchasePriceField: boolean } | null {
  const payload: UpdateProductOverviewPayload = {};
  let hasPurchasePriceField = false;

  const name = parseString(body.name);
  if (name) payload.name = name;

  if (hasLegacyOrCurrentProductCategoryIdField(body)) {
    payload.productCategoryId = parseProductCategoryIdFromRecord(body);
  }

  if (Object.prototype.hasOwnProperty.call(body, "gender")) {
    const gender = parseGender(body.gender);
    if (gender !== undefined) {
      payload.gender = gender;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "material")) {
    payload.material = parseString(body.material);
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    payload.description = parseString(body.description);
  }

  if (Object.prototype.hasOwnProperty.call(body, "coverImagePath")) {
    payload.coverImagePath = parseString(body.coverImagePath);
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
  if (Object.prototype.hasOwnProperty.call(body, "isActive") && isActive === undefined) {
    return null;
  }
  if (isActive !== undefined) {
    payload.isActive = isActive;
  }

  if (Object.prototype.hasOwnProperty.call(body, "rentPricePerDay")) {
    const rentPricePerDay = parseNonNegativeNumber(body.rentPricePerDay);
    if (rentPricePerDay === undefined) return null;
    payload.rentPricePerDay = rentPricePerDay;
  }

  if (Object.prototype.hasOwnProperty.call(body, "rentDepositAmount")) {
    const rentDepositAmount = parseNonNegativeNumber(body.rentDepositAmount);
    if (rentDepositAmount === undefined) return null;
    payload.rentDepositAmount = rentDepositAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, "salePrice")) {
    const salePrice = parseNonNegativeNumber(body.salePrice);
    if (salePrice === undefined) return null;
    payload.salePrice = salePrice;
  }

  if (Object.prototype.hasOwnProperty.call(body, "purchasePrice")) {
    const purchasePrice = parseNonNegativeNumber(body.purchasePrice);
    if (purchasePrice === undefined) return null;
    payload.purchasePrice = purchasePrice;
    hasPurchasePriceField = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "isRentable")) {
    const isRentable = parseOptionalBoolean(body.isRentable);
    if (isRentable === undefined) return null;
    payload.isRentable = isRentable;
  }

  if (Object.prototype.hasOwnProperty.call(body, "isSaleable")) {
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

function parsePricingPayload(body: Record<string, unknown>): UpdateProductPricingPayload | null {
  if (!Array.isArray(body.variants)) {
    return null;
  }

  const patches: ProductVariantPricingPatch[] = [];

  for (const entry of body.variants) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const record = entry as Record<string, unknown>;
    const variantId = parseString(record.variantId);
    if (!variantId) {
      return null;
    }

    const defaultDepositAmount = parseNonNegativeNumber(record.defaultDepositAmount);
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

function parseInitialItemStatus(value: unknown): ProductInitialItemStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase() as ProductInitialItemStatus;
  if (!PRODUCT_ENTRY_STATUS_SET.has(normalized)) return null;
  return normalized;
}

function parsePositiveInteger(value: unknown): number | null {
  if (value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0) return null;
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }

  return null;
}

function buildItemCodesFromBase(itemCode: string, quantity: number): string[] {
  if (quantity <= 1) return [itemCode];

  return Array.from({ length: quantity }, (_value, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    return `${itemCode}-${suffix}`;
  });
}

function parseProductItemsPayload(
  body: Record<string, unknown>
): AddProductItemsPayload | null {
  if (Array.isArray(body.items)) {
    const items: AddProductItemsPayload["items"] = [];
    for (const row of body.items) {
      if (!row || typeof row !== "object") return null;
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

  const itemCode = parseString(typeof body.itemCode === "string" ? body.itemCode : null);
  const initialStatus = parseInitialItemStatus(body.initialStatus);
  if (!itemCode || !initialStatus) return null;

  const parsedQuantity = Object.prototype.hasOwnProperty.call(body, "quantity")
    ? parsePositiveInteger(body.quantity)
    : 1;
  if (!parsedQuantity || parsedQuantity > MAX_ADD_ITEMS_QUANTITY) return null;

  const size = parseString(typeof body.size === "string" ? body.size : null);
  const generatedItemCodes = buildItemCodesFromBase(itemCode, parsedQuantity);

  return {
    items: generatedItemCodes.map((generatedItemCode) => ({
      itemCode: generatedItemCode,
      initialStatus,
      size,
    })),
  };
}

function parseUpdateProductItemPayload(
  body: Record<string, unknown>
): UpdateProductItemPayload | null {
  const itemCode = parseString(body.itemCode);
  if (!itemCode) return null;

  let size: string | null | undefined;
  if (Object.prototype.hasOwnProperty.call(body, "size")) {
    if (body.size === null) {
      size = null;
    } else if (typeof body.size === "string") {
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

function parseSalesProductEntryPayload(
  body: Record<string, unknown>
): CreateSalesProductEntryPayload | null {
  const productRaw = body.product;
  const pricingRaw = body.pricing;
  const itemsRaw = body.items;

  if (!productRaw || typeof productRaw !== "object") return null;
  if (!pricingRaw || typeof pricingRaw !== "object") return null;
  if (!Array.isArray(itemsRaw)) return null;

  const productRecord = productRaw as Record<string, unknown>;
  const pricingRecord = pricingRaw as Record<string, unknown>;

  const productCode = parseString(productRecord.productCode);
  const productName = parseString(productRecord.name);
  if (!productCode || !productName) return null;

  const isActive = parseOptionalBoolean(productRecord.isActive);
  if (Object.prototype.hasOwnProperty.call(productRecord, "isActive") && isActive === undefined) {
    return null;
  }

  const isRentable = parseOptionalBoolean(productRecord.isRentable);
  if (Object.prototype.hasOwnProperty.call(productRecord, "isRentable") && isRentable === undefined) {
    return null;
  }

  const isSaleable = parseOptionalBoolean(productRecord.isSaleable);
  if (Object.prototype.hasOwnProperty.call(productRecord, "isSaleable") && isSaleable === undefined) {
    return null;
  }

  const salePrice = parseNonNegativeNumber(productRecord.salePrice);
  if (Object.prototype.hasOwnProperty.call(productRecord, "salePrice") && salePrice === undefined) {
    return null;
  }

  const rentDepositAmount = parseNonNegativeNumber(productRecord.rentDepositAmount);
  if (
    Object.prototype.hasOwnProperty.call(productRecord, "rentDepositAmount") &&
    rentDepositAmount === undefined
  ) {
    return null;
  }

  const purchasePrice = parseNonNegativeNumber(productRecord.purchasePrice);
  if (Object.prototype.hasOwnProperty.call(productRecord, "purchasePrice") && purchasePrice === undefined) {
    return null;
  }

  const price1d = parseNonNegativeNumber(pricingRecord.price1d);
  if (price1d === undefined || price1d === null) return null;

  const defaultDepositAmount = parseNonNegativeNumber(pricingRecord.defaultDepositAmount);
  const price3d = parseNonNegativeNumber(pricingRecord.price3d);
  const price7d = parseNonNegativeNumber(pricingRecord.price7d);
  const pricePerDay = parseNonNegativeNumber(pricingRecord.pricePerDay);

  if (
    defaultDepositAmount === undefined ||
    price3d === undefined ||
    price7d === undefined ||
    pricePerDay === undefined
  ) {
    return null;
  }

  const items: CreateSalesProductEntryPayload["items"] = [];
  for (const row of itemsRaw) {
    if (!row || typeof row !== "object") return null;
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

  if (items.length === 0) {
    return null;
  }

  return {
    branchId: parseString(body.branchId),
    product: {
      productCode,
      name: productName,
      productCategoryId: parseProductCategoryIdFromRecord(productRecord),
      gender: parseGender(productRecord.gender) ?? null,
      material: parseString(productRecord.material),
      description: parseString(productRecord.description),
      coverImagePath: parseString(productRecord.coverImagePath),
      galleryImagePaths: parseStringArray(productRecord.galleryImagePaths) ?? [],
      videoUrls: parseStringArray(productRecord.videoUrls) ?? [],
      rentDepositAmount: rentDepositAmount ?? null,
      salePrice: salePrice ?? null,
      purchasePrice: purchasePrice ?? null,
      tagIds: parseTagIds(productRecord.tagIds) ?? [],
      isActive: isActive ?? true,
      isRentable: isRentable ?? true,
      isSaleable: isSaleable ?? true,
    },
    pricing: {
      price1d,
      defaultDepositAmount,
      price3d,
      price7d,
      pricePerDay,
    },
    items,
  };
}

function mapSalesProductsDomainError(error: unknown): NextResponse | null {
  if (!(error instanceof SalesProductsDomainError)) {
    return null;
  }

  const payload =
    Object.keys(error.context ?? {}).length > 0
      ? { error: error.code, context: error.context }
      : { error: error.code };

  if (
    error.code === "FORBIDDEN_SALES_ACCESS" ||
    error.code === "BRANCH_ACCESS_DENIED" ||
    error.code === "FORBIDDEN_SENSITIVE_PRICING_FOR_STAFF" ||
    error.code === "FORBIDDEN_MANAGER_ONLY_ITEM_STATUS"
  ) {
    return NextResponse.json(payload, { status: 403 });
  }

  if (error.code === "PRODUCT_NOT_FOUND" || error.code === "SHOWROOM_NOT_FOUND") {
    return NextResponse.json(payload, { status: 404 });
  }

  if (
    error.code === "DUPLICATE_ITEM_CODE_IN_PAYLOAD" ||
    error.code === "PRODUCT_DELETE_FORBIDDEN_FINANCIAL_LINKS" ||
    error.code === "PRODUCT_ITEM_DELETE_FORBIDDEN_FINANCIAL_LINKS"
  ) {
    return NextResponse.json(payload, { status: 409 });
  }

  if (
    error.code === "MISSING_PROFILE_CONTEXT" ||
    error.code === "MISSING_BRANCH_CONTEXT" ||
    error.code === "INVALID_PRODUCT_ENTRY_STATUS" ||
    error.code === "MISSING_REQUIRED_PRODUCT_PRICES"
  ) {
    return NextResponse.json(payload, { status: 400 });
  }

  return NextResponse.json(payload, { status: 400 });
}

function mapProductItemsDomainError(error: unknown): NextResponse | null {
  if (!(error instanceof Error)) return null;

  if (error.message === "BRANCH_ID_REQUIRED_FOR_PRODUCT_ITEMS") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error.message === "ITEM_CODE_REQUIRED") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return null;
}

function mapConstraintError(error: unknown): NextResponse | null {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : "";

  if (code !== "23505" && code !== "23503") {
    return null;
  }

  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : "";
  const details =
    typeof error === "object" && error !== null && "details" in error
      ? String((error as { details?: string }).details ?? "")
      : "";

  const haystack = `${message} ${details}`.toLowerCase();

  if (
    haystack.includes("products_global_product_code_unique") ||
    haystack.includes("products_branch_product_code_unique")
  ) {
    return NextResponse.json({ error: "DUPLICATE_PRODUCT_CODE" }, { status: 409 });
  }

  if (haystack.includes("items_branch_item_code_unique")) {
    return NextResponse.json({ error: "DUPLICATE_ITEM_CODE" }, { status: 409 });
  }

  if (
    code === "23503" &&
    (haystack.includes("rental_order_items_item_id_fkey") ||
      haystack.includes("reservation_windows_item_id_fkey") ||
      haystack.includes("maintenance_tasks_item_id_fkey") ||
      haystack.includes("incidents_item_id_fkey") ||
      haystack.includes("item_status_logs_item_id_fkey"))
  ) {
    return NextResponse.json({ error: "ITEM_IN_USE_CANNOT_DELETE" }, { status: 409 });
  }

  if (code === "23505") {
    return NextResponse.json({ error: "DUPLICATE_RESOURCE" }, { status: 409 });
  }

  return null;
}

async function getAuthenticatedClient(
  request: NextRequest
): Promise<{ userId: string; supabase: Awaited<ReturnType<typeof getSupabaseClientAndUser>>["supabase"] }> {
  const { supabase, user } = await getSupabaseClientAndUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }

  return {
    userId: user.id,
    supabase,
  };
}

function handleUnexpectedError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

async function canAccessSensitiveProductOverview(options: {
  supabase: Awaited<ReturnType<typeof getSupabaseClientAndUser>>["supabase"];
  userId: string;
}): Promise<boolean> {
  const role = await fetchProfileRole(options.supabase, options.userId);
  const normalizedRole = role?.trim().toLowerCase() ?? null;
  return Boolean(normalizedRole && SENSITIVE_PRODUCT_OVERVIEW_ROLE_SET.has(normalizedRole));
}

export async function handleGetProducts(request: NextRequest) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const allowSensitivePricing = await canAccessSensitiveProductOverview({
      supabase,
      userId,
    });

    const searchParams = request.nextUrl.searchParams;
    const page = parseInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(parseInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

    const result = await listProductsForAdmin(supabase, {
      branchId: parseString(searchParams.get("branchId")),
      search: parseString(searchParams.get("search")),
      productCategoryId: parseProductCategoryIdFromSearchParams(searchParams),
      tagId: parseString(searchParams.get("tagId")),
      hasReadyItems: parseBoolean(searchParams.get("hasReadyItems")),
      page,
      pageSize,
      allowSensitivePricing,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handleUnexpectedError(error);
  }
}

export async function handleCreateProduct(request: NextRequest) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const allowSensitivePricing = await canAccessSensitiveProductOverview({
      supabase,
      userId,
    });

    const productCode = parseString(body.productCode);
    const name = parseString(body.name);
    if (!productCode || !name) {
      return NextResponse.json({ error: "productCode and name are required" }, { status: 400 });
    }

    const rentPricePerDay = parseNonNegativeNumber(body.rentPricePerDay);
    const rentDepositAmount = parseNonNegativeNumber(body.rentDepositAmount);
    const salePrice = parseNonNegativeNumber(body.salePrice);
    const purchasePrice = parseNonNegativeNumber(body.purchasePrice);
    const isRentable = parseOptionalBoolean(body.isRentable);
    const isSaleable = parseOptionalBoolean(body.isSaleable);

    if (
      (Object.prototype.hasOwnProperty.call(body, "rentPricePerDay") && rentPricePerDay === undefined) ||
      (Object.prototype.hasOwnProperty.call(body, "rentDepositAmount") && rentDepositAmount === undefined) ||
      (Object.prototype.hasOwnProperty.call(body, "salePrice") && salePrice === undefined) ||
      (Object.prototype.hasOwnProperty.call(body, "purchasePrice") && purchasePrice === undefined) ||
      (Object.prototype.hasOwnProperty.call(body, "isRentable") && isRentable === undefined) ||
      (Object.prototype.hasOwnProperty.call(body, "isSaleable") && isSaleable === undefined)
    ) {
      return NextResponse.json({ error: "Invalid product overview payload" }, { status: 400 });
    }

    if (
      Object.prototype.hasOwnProperty.call(body, "purchasePrice") &&
      purchasePrice !== null &&
      !allowSensitivePricing
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const hasItemsField = Object.prototype.hasOwnProperty.call(body, "items");
    const parsedItemsPayload = hasItemsField ? parseProductItemsPayload(body) : null;
    if (hasItemsField && !parsedItemsPayload) {
      return NextResponse.json({ error: "Invalid product items payload" }, { status: 400 });
    }

    const payload: CreateProductPayload = {
      branchId: parseString(body.branchId),
      productCode,
      name,
      productCategoryId: parseProductCategoryIdFromRecord(body),
      gender: parseGender(body.gender) ?? null,
      material: parseString(body.material),
      description: parseString(body.description),
      coverImagePath: parseString(body.coverImagePath),
      galleryImagePaths: parseStringArray(body.galleryImagePaths) ?? [],
      videoUrls: parseStringArray(body.videoUrls) ?? [],
      rentPricePerDay: rentPricePerDay ?? null,
      rentDepositAmount: rentDepositAmount ?? null,
      salePrice: salePrice ?? null,
      purchasePrice: allowSensitivePricing ? purchasePrice ?? null : null,
      isRentable: isRentable ?? true,
      isSaleable: isSaleable ?? false,
      tagIds: parseTagIds(body.tagIds) ?? [],
      isActive: parseOptionalBoolean(body.isActive) ?? true,
      items: parsedItemsPayload?.items ?? [],
    };

    const created = await createProductForAdmin(supabase, userId, payload, {
      allowSensitivePricing,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    const itemErrorResponse = mapProductItemsDomainError(error);
    if (itemErrorResponse) {
      return itemErrorResponse;
    }

    const constraintResponse = mapConstraintError(error);
    if (constraintResponse) {
      return constraintResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleGetProductDetail(
  request: NextRequest,
  productId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const allowSensitivePricing = await canAccessSensitiveProductOverview({
      supabase,
      userId,
    });

    const detail = await getProductDetailForAdmin(supabase, productId, {
      allowSensitivePricing,
    });
    if (!detail) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handleUnexpectedError(error);
  }
}

export async function handleUpdateProductOverview(
  request: NextRequest,
  productId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const allowSensitivePricing = await canAccessSensitiveProductOverview({
      supabase,
      userId,
    });
    const body = (await request.json()) as Record<string, unknown>;

    const parsed = parseOverviewPayload(body);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid product overview payload" }, { status: 400 });
    }

    if (parsed.hasPurchasePriceField && !allowSensitivePricing) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const detail = await updateProductOverviewForAdmin(
      supabase,
      userId,
      productId,
      parsed.payload,
      {
        allowSensitivePricing,
      }
    );
    if (!detail) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handleUnexpectedError(error);
  }
}

export async function handleAddProductItems(
  request: NextRequest,
  productId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const allowSensitivePricing = await canAccessSensitiveProductOverview({
      supabase,
      userId,
    });
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseProductItemsPayload(body);
    if (!payload) {
      return NextResponse.json({ error: "Invalid product items payload" }, { status: 400 });
    }

    const detail = await addProductItemsForAdmin(supabase, userId, productId, payload, {
      allowSensitivePricing,
    });
    if (!detail) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    const itemErrorResponse = mapProductItemsDomainError(error);
    if (itemErrorResponse) {
      return itemErrorResponse;
    }

    const constraintResponse = mapConstraintError(error);
    if (constraintResponse) {
      return constraintResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleUpdateProductItem(
  request: NextRequest,
  productId: string,
  itemId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const allowSensitivePricing = await canAccessSensitiveProductOverview({
      supabase,
      userId,
    });
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseUpdateProductItemPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid product item payload" }, { status: 400 });
    }

    const detail = await updateProductItemForAdmin(
      supabase,
      userId,
      productId,
      itemId,
      payload,
      {
        allowSensitivePricing,
      }
    );
    if (!detail) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemErrorResponse = mapProductItemsDomainError(error);
    if (itemErrorResponse) {
      return itemErrorResponse;
    }

    const constraintResponse = mapConstraintError(error);
    if (constraintResponse) {
      return constraintResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleDeleteProductItem(
  request: NextRequest,
  productId: string,
  itemId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const allowSensitivePricing = await canAccessSensitiveProductOverview({
      supabase,
      userId,
    });

    const detail = await deleteProductItemForAdmin(supabase, userId, productId, itemId, {
      allowSensitivePricing,
    });
    if (!detail) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    const constraintResponse = mapConstraintError(error);
    if (constraintResponse) {
      return constraintResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleCreateProductVariant(
  request: NextRequest,
  productId: string
) {
  void request;
  void productId;
  return NextResponse.json(
    { error: MANUAL_VARIANT_MUTATION_DISABLED_CODE },
    { status: 410 }
  );
}

export async function handleUpdateProductVariant(
  request: NextRequest,
  productId: string,
  variantId: string
) {
  void request;
  void productId;
  void variantId;
  return NextResponse.json(
    { error: MANUAL_VARIANT_MUTATION_DISABLED_CODE },
    { status: 410 }
  );
}

export async function handleDeleteProductVariant(
  request: NextRequest,
  productId: string,
  variantId: string
) {
  void request;
  void productId;
  void variantId;
  return NextResponse.json(
    { error: MANUAL_VARIANT_MUTATION_DISABLED_CODE },
    { status: 410 }
  );
}

export async function handleDeleteProduct(
  request: NextRequest,
  productId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const role = await fetchProfileRole(supabase, userId);
    const normalizedRole = role?.trim().toLowerCase() ?? null;

    if (!normalizedRole || !PRODUCT_DELETE_ROLE_SET.has(normalizedRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isDeleted = await deleteProductForAdmin(supabase, userId, productId);
    if (!isDeleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleUpdateProductPricing(
  request: NextRequest,
  productId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const role = await fetchProfileRole(supabase, userId);
    const normalizedRole = role?.trim().toLowerCase() ?? null;

    if (!normalizedRole || !PRICING_EDITOR_ROLE_SET.has(normalizedRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const payload = parsePricingPayload(body);
    if (!payload) {
      return NextResponse.json({ error: "Invalid pricing payload" }, { status: 400 });
    }

    const detail = await updateProductPricingForAdmin(supabase, userId, productId, payload, {
      allowSensitivePricing: true,
    });
    if (!detail) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handleUnexpectedError(error);
  }
}

export async function handleGetSalesProducts(request: NextRequest) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const searchParams = request.nextUrl.searchParams;

    const query: SalesProductsCatalogQuery = {
      branchId: parseString(searchParams.get("branchId")),
      search: parseString(searchParams.get("search")) ?? undefined,
      productCategoryId: parseProductCategoryIdFromSearchParams(searchParams),
      tagId: parseString(searchParams.get("tagId")),
      hasReadyItems: parseBoolean(searchParams.get("hasReadyItems")),
      page: parseInteger(searchParams.get("page"), 1),
      pageSize: Math.min(parseInteger(searchParams.get("pageSize"), 24), MAX_PAGE_SIZE),
    };

    const payload = await listProductsForSalesActor(supabase, {
      actorProfileId: userId,
      query,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleCreateSalesProductEntry(request: NextRequest) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = parseSalesProductEntryPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid sales product entry payload" }, { status: 400 });
    }

    const detail = await createSalesProductEntryForActor(supabase, {
      actorProfileId: userId,
      payload,
    });

    return NextResponse.json(detail, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    const constraintResponse = mapConstraintError(error);
    if (constraintResponse) {
      return constraintResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleGetSalesProductDetail(
  request: NextRequest,
  productId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const detail = await getSalesProductDetailForActor(supabase, {
      actorProfileId: userId,
      productId,
      branchId: parseString(request.nextUrl.searchParams.get("branchId")),
    });

    if (!detail) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handlePatchSalesProduct(
  request: NextRequest,
  productId: string
) {
  try {
    const { userId, supabase } = await getAuthenticatedClient(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = parseOverviewPayload(body);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid sales product update payload" }, { status: 400 });
    }

    const detail = await updateSalesProductOverviewForActor(supabase, {
      actorProfileId: userId,
      productId,
      payload: parsed.payload,
      branchId: parseString(body.branchId),
    });

    if (!detail) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    const constraintResponse = mapConstraintError(error);
    if (constraintResponse) {
      return constraintResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleGetShowroomProducts(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: ShowroomProductsQuery = {
      showroomSlug: parseString(searchParams.get("showroomSlug")),
      branchId: parseString(searchParams.get("branchId")),
      search: parseString(searchParams.get("search")) ?? undefined,
      productCategoryId: parseProductCategoryIdFromSearchParams(searchParams),
      productCategoryIds: parseProductCategoryIdsFromSearchParams(searchParams),
      tagId: parseString(searchParams.get("tagId")),
      gender: parseGender(searchParams.get("gender")) ?? null,
      genders: parseGenderList(searchParams.get("genders")),
      size: parseString(searchParams.get("size")),
      sizes: parseCommaSeparatedIds(searchParams.get("sizes")),
      color: parseString(searchParams.get("color")),
      productIds: parseCommaSeparatedIds(searchParams.get("productIds")),
      preferRecentIntake: parseBoolean(searchParams.get("preferRecentIntake")),
      page: parseInteger(searchParams.get("page"), 1),
      pageSize: Math.min(parseInteger(searchParams.get("pageSize"), 18), MAX_PAGE_SIZE),
    };

    const supabase = createServiceRoleClient();
    const payload = await listProductsForShowroom(supabase, { query });
    return NextResponse.json(payload);
  } catch (error) {
    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    return handleUnexpectedError(error);
  }
}

export async function handleGetShowroomProductDetail(
  request: NextRequest,
  productId: string
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: ShowroomProductDetailQuery = {
      showroomSlug: parseString(searchParams.get("showroomSlug")),
      branchId: parseString(searchParams.get("branchId")),
    };

    const supabase = createServiceRoleClient();
    const payload = await getShowroomProductDetail(supabase, {
      productId,
      query,
    });

    if (!payload) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    const domainErrorResponse = mapSalesProductsDomainError(error);
    if (domainErrorResponse) {
      return domainErrorResponse;
    }

    return handleUnexpectedError(error);
  }
}
