import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ITEM_STATUS_VALUES,
} from "@/constants/domainPrimitives";
import type {
  AddProductItemsPayload,
  ProductActivityEntryDto,
  CreateProductPayload,
  CreateProductVariantPayload,
  ProductCategoryDto,
  ProductDetailDto,
  ProductGender,
  ProductInitialItemStatus,
  ProductItemDto,
  ProductPricePlanDto,
  ProductSummaryDto,
  ProductTagDto,
  ProductVariantDto,
  ProductsListResponse,
  ShowroomProductCardDto,
  ShowroomProductDetailDto,
  ShowroomProductDetailQuery,
  ShowroomReadyItemSizeDto,
  ShowroomProductVariantDto,
  ShowroomProductsQuery,
  ShowroomProductsResponse,
  UpdateProductItemPayload,
  UpdateProductOverviewPayload,
  UpdateProductPricingPayload,
  UpdateProductVariantPayload,
} from "@/types/productsCatalog";
import type {
  CreateSalesProductEntryPayload,
  SalesProductsCatalogQuery,
} from "@/types/salesProductEntry";

const ITEM_STATUS_SET = new Set<string>(ITEM_STATUS_VALUES);
const SALES_PRODUCT_ENTRY_ROLE_SET = new Set(["owner_admin", "admin", "manager", "staff"]);
const OWNER_ADMIN_ROLE_SET = new Set(["owner_admin", "admin"]);
const SENSITIVE_PRICING_ROLE_SET = new Set(["owner_admin", "admin", "manager"]);
const PRODUCT_ENTRY_ITEM_STATUS_SET = new Set<ProductInitialItemStatus>([
  "READY",
  "LAUNDRY",
  "MAINTENANCE",
  "DAMAGED",
  "SOLD",
]);
const MANAGER_ONLY_PRODUCT_ENTRY_STATUS_SET = new Set<ProductInitialItemStatus>(["SOLD"]);
const DEFAULT_PRODUCT_VARIANT_CODE = "DEFAULT";
const PRODUCT_ACTIVITY_LIMIT = 120;
const PRODUCT_ENTRY_PAYMENT_REASON = "PRODUCT_ENTRY_INTAKE_EXPENSE";
const PRODUCT_ENTRY_PAYMENT_SOURCE = "PRODUCT_ENTRY";
const PROCUREMENT_ROLLBACK_NOTE_META_PREFIX = "##PROCUREMENT_ROLLBACK_META##";

interface ProductRow {
  id: string;
  branch_id: string | null;
  product_code: string;
  name: string;
  category_id: string | null;
  gender: string | null;
  material: string | null;
  description: string | null;
  cover_image_path: string | null;
  gallery_image_paths: string[] | null;
  video_urls: string[] | null;
  is_active: boolean;
  is_archived: boolean;
  rent_price_per_day: number | string | null;
  quick_rent_price: number | string | null;
  rent_deposit_amount: number | string | null;
  sale_price: number | string | null;
  purchase_price: number | string | null;
  successful_rent_count: number | string | null;
  is_rentable: boolean;
  is_saleable: boolean;
  updated_at: string;
}

interface ProductCategoryRow {
  id: string;
  branch_id: string | null;
  code: string;
  name: string;
  is_active: boolean;
}

interface ProductTagRow {
  id: string;
  branch_id: string | null;
  code: string;
  name: string;
  color: string | null;
  is_active: boolean;
}

interface ProductTagAssignmentRow {
  product_id: string;
  tag_id: string;
}

interface ProductVariantRow {
  id: string;
  product_id: string;
  variant_code: string;
  sku_code: string | null;
  name: string;
  size: string | null;
  color: string | null;
  default_deposit_amount: number | string | null;
  price_1d: number | string | null;
  price_3d: number | string | null;
  price_7d: number | string | null;
  price_per_day: number | string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ItemRow {
  id: string;
  product_id: string;
  branch_id: string;
  item_code: string;
  size: string | null;
  status: string;
}

interface ItemRentalRow {
  item_id: string;
  created_at: string;
}

interface AuditEventRow {
  id: string;
  actor_profile_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  reason: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

interface ProductItemStatusLogRow {
  id: string;
  item_id: string;
  order_id: string | null;
  from_status: string | null;
  to_status: string;
  reason_code: string | null;
  reason_note: string | null;
  actor_profile_id: string | null;
  happened_at: string;
}

interface ProfileNameRow {
  id: string;
  full_name: string | null;
}

interface ProfileRoleRow {
  role: string | null;
}

interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}

interface ProfileBranchAccessRow {
  branch_id: string;
}

interface BranchRow {
  id: string;
}

interface ShowroomRow {
  id: string;
  slug: string;
  branch_id: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface InsertedItemRow {
  id: string;
  item_code: string;
  status: string;
}

interface ProductItemMutationRow {
  id: string;
  item_code: string;
  size: string | null;
  status: string;
  branch_id: string;
}

interface InsertedProcurementReceiptRow {
  id: string;
  receipt_code: string;
}

interface InsertedPaymentRow {
  id: string;
}

interface ProductEntryIntakeResult {
  receiptId: string;
  paymentId: string;
  paymentAmount: number;
}

interface ProductProcurementLinkRow {
  receipt_id: string;
}

interface ProductProcurementReceiptRow {
  id: string;
  note: string | null;
}

interface ProductOrderLinkRow {
  id: string;
}

interface ProductIdentityRow {
  id: string;
  product_code: string;
}

interface ProcurementReceiptLookupRow {
  id: string;
}

interface ProcurementReceiptItemLookupRow {
  product_id: string;
  created_at: string;
}

const PRODUCT_SELECT_CORE_FIELDS =
  "id, branch_id, product_code, name, category_id, gender, material, description, cover_image_path, is_active, is_archived, updated_at";
const PRODUCT_SELECT_OPTIONAL_FIELDS =
  "gallery_image_paths, video_urls, rent_price_per_day, quick_rent_price, rent_deposit_amount, sale_price, purchase_price, successful_rent_count, is_rentable, is_saleable";
const PRODUCT_SELECT_FIELDS = `${PRODUCT_SELECT_CORE_FIELDS}, ${PRODUCT_SELECT_OPTIONAL_FIELDS}`;
const PRODUCT_SELECT_FIELDS_LEGACY = PRODUCT_SELECT_CORE_FIELDS;
const PRODUCT_OPTIONAL_COLUMN_SET = new Set([
  "gallery_image_paths",
  "video_urls",
  "rent_price_per_day",
  "quick_rent_price",
  "rent_deposit_amount",
  "sale_price",
  "purchase_price",
  "successful_rent_count",
  "is_rentable",
  "is_saleable",
]);

type QueryErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
} | null;

function shouldFallbackProductSelectLegacy(error: QueryErrorLike): boolean {
  if (!error) return false;

  const haystack = [error.message, error.details, error.hint]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();

  if (!haystack) return false;
  for (const column of PRODUCT_OPTIONAL_COLUMN_SET) {
    if (haystack.includes(column)) return true;
  }

  return false;
}

async function executeSingleProductQuery(
  runQuery: (
    selectFields: string
  ) => PromiseLike<{ data: ProductRow | null; error: QueryErrorLike }>
): Promise<ProductRow | null> {
  const primary = await runQuery(PRODUCT_SELECT_FIELDS);
  if (!primary.error) {
    return primary.data ?? null;
  }

  if (!shouldFallbackProductSelectLegacy(primary.error)) {
    throw primary.error;
  }

  const fallback = await runQuery(PRODUCT_SELECT_FIELDS_LEGACY);
  if (fallback.error) throw fallback.error;
  return fallback.data ?? null;
}

export type SalesProductsDomainErrorCode =
  | "MISSING_PROFILE_CONTEXT"
  | "FORBIDDEN_SALES_ACCESS"
  | "MISSING_BRANCH_CONTEXT"
  | "BRANCH_ACCESS_DENIED"
  | "SHOWROOM_NOT_FOUND"
  | "FORBIDDEN_SENSITIVE_PRICING_FOR_STAFF"
  | "MISSING_REQUIRED_PRODUCT_PRICES"
  | "FORBIDDEN_MANAGER_ONLY_ITEM_STATUS"
  | "INVALID_PRODUCT_ENTRY_STATUS"
  | "DUPLICATE_ITEM_CODE_IN_PAYLOAD"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_DELETE_FORBIDDEN_FINANCIAL_LINKS"
  | "PRODUCT_ITEM_DELETE_FORBIDDEN_FINANCIAL_LINKS";

export class SalesProductsDomainError extends Error {
  readonly code: SalesProductsDomainErrorCode;
  readonly context: Record<string, unknown>;

  constructor(code: SalesProductsDomainErrorCode, context: Record<string, unknown> = {}) {
    super(code);
    this.name = "SalesProductsDomainError";
    this.code = code;
    this.context = context;
  }
}

function collectMissingRequiredProductPrices(payload: CreateProductPayload): Array<"rentPricePerDay"> {
  const missing: Array<"rentPricePerDay"> = [];

  if (payload.rentPricePerDay === null || payload.rentPricePerDay === undefined) {
    missing.push("rentPricePerDay");
  }

  return missing;
}

function parseNumeric(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseNonNegativeInteger(
  value: number | string | null | undefined,
  fallback = 0
): number {
  const parsed = parseNumeric(value);
  if (parsed === null) return fallback;
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return rounded >= 0 ? rounded : fallback;
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeStringArray(values: Array<string | null | undefined> | null | undefined): string[] {
  if (!Array.isArray(values)) return [];

  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const sanitized = sanitizeText(value);
    if (!sanitized) continue;

    const key = sanitized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(sanitized);
  }

  return output;
}

function resolvePrimaryProductImagePath(
  coverImagePath: string | null | undefined,
  galleryImagePaths: Array<string | null | undefined> | null | undefined
): string | null {
  const coverImage = sanitizeText(coverImagePath);
  if (coverImage) return coverImage;

  const gallery = sanitizeStringArray(galleryImagePaths);
  return gallery[0] ?? null;
}

function sanitizeSearchTerm(value: string | null | undefined): string | null {
  if (!value) return null;
  const sanitized = value.replace(/[,%]/g, " ").trim();
  if (!sanitized) return null;
  return sanitized;
}

function buildReceiptDateCode(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function generateProcurementReceiptCodeForProductEntry(
  supabase: SupabaseClient,
  branchId: string
): Promise<string> {
  const dateCode = buildReceiptDateCode();
  const fromIso = `${dateCode.slice(0, 4)}-${dateCode.slice(4, 6)}-${dateCode.slice(6, 8)}T00:00:00.000Z`;
  const toDate = new Date(fromIso);
  toDate.setUTCDate(toDate.getUTCDate() + 1);

  const { count, error } = await supabase
    .from("procurement_receipts")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId)
    .gte("created_at", fromIso)
    .lt("created_at", toDate.toISOString());

  if (error) throw error;

  const sequence = String((count ?? 0) + 1).padStart(4, "0");
  return `PN${dateCode}-${sequence}`;
}

async function createProductEntryIntakePayment(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId: string;
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    purchasePrice: number | null;
  }
): Promise<ProductEntryIntakeResult | null> {
  const quantity = Math.max(0, Math.floor(options.quantity));
  if (quantity <= 0) return null;

  const unitCostAmount = roundMoney(Math.max(0, options.purchasePrice ?? 0));
  const totalCostAmount = roundMoney(quantity * unitCostAmount);
  const receiptCode = await generateProcurementReceiptCodeForProductEntry(
    supabase,
    options.branchId
  );
  const intakeNote = `Auto-created from product entry ${options.productCode}.`;
  const paidAt = new Date().toISOString();

  const { data: insertedReceipt, error: receiptError } = await supabase
    .from("procurement_receipts")
    .insert({
      branch_id: options.branchId,
      receipt_code: receiptCode,
      intake_channel: "MANUAL",
      note: intakeNote,
      total_quantity: quantity,
      total_cost_amount: totalCostAmount,
      payment_expense_amount: totalCostAmount,
      payment_method: "CASH",
      payment_note: intakeNote,
      paid_at: paidAt,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select("id, receipt_code")
    .maybeSingle<InsertedProcurementReceiptRow>();

  if (receiptError) throw receiptError;
  if (!insertedReceipt) {
    throw new Error("PRODUCT_ENTRY_RECEIPT_CREATE_FAILED");
  }

  const { error: receiptItemsError } = await supabase
    .from("procurement_receipt_items")
    .insert({
      receipt_id: insertedReceipt.id,
      branch_id: options.branchId,
      product_id: options.productId,
      product_code_snapshot: options.productCode,
      product_name_snapshot: options.productName,
      quantity,
      unit_cost_amount: unitCostAmount,
      line_total_amount: totalCostAmount,
      note: intakeNote,
    });

  if (receiptItemsError) throw receiptItemsError;

  const { data: insertedPayment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      branch_id: options.branchId,
      order_id: null,
      procurement_receipt_id: insertedReceipt.id,
      customer_id: null,
      type: "EXPENSE",
      method: "CASH",
      amount: totalCostAmount,
      currency_code: "VND",
      reason: PRODUCT_ENTRY_PAYMENT_REASON,
      source: PRODUCT_ENTRY_PAYMENT_SOURCE,
      status: "POSTED",
      note: intakeNote,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select("id")
    .maybeSingle<InsertedPaymentRow>();

  if (paymentError) throw paymentError;
  if (!insertedPayment) {
    throw new Error("PRODUCT_ENTRY_PAYMENT_CREATE_FAILED");
  }

  return {
    receiptId: insertedReceipt.id,
    paymentId: insertedPayment.id,
    paymentAmount: totalCostAmount,
  };
}

function normalizeShowroomSlug(value: string | null | undefined): string | null {
  const text = sanitizeText(value);
  if (!text) return null;

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
  return normalized;
}

async function resolvePublicShowroomBranchId(
  supabase: SupabaseClient,
  options: {
    showroomSlug?: string | null;
    branchId?: string | null;
  }
): Promise<string | null> {
  const normalizedShowroomSlug = normalizeShowroomSlug(options.showroomSlug ?? null);
  const normalizedBranchId = sanitizeText(options.branchId ?? null);

  if (options.showroomSlug && !normalizedShowroomSlug) {
    throw new SalesProductsDomainError("SHOWROOM_NOT_FOUND", {
      showroomSlug: options.showroomSlug,
    });
  }

  if (normalizedShowroomSlug) {
    const { data, error } = await supabase
      .from("showrooms")
      .select("id, slug, branch_id, is_default, is_active, created_at")
      .eq("slug", normalizedShowroomSlug)
      .eq("is_active", true)
      .maybeSingle<ShowroomRow>();

    if (error) throw error;
    if (!data) {
      throw new SalesProductsDomainError("SHOWROOM_NOT_FOUND", {
        showroomSlug: normalizedShowroomSlug,
      });
    }

    return data.branch_id;
  }

  if (normalizedBranchId) {
    const { data, error } = await supabase
      .from("showrooms")
      .select("id, slug, branch_id, is_default, is_active, created_at")
      .eq("branch_id", normalizedBranchId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<ShowroomRow>();

    if (error) throw error;
    return data?.branch_id ?? normalizedBranchId;
  }

  const { data: defaultShowroom, error: defaultError } = await supabase
    .from("showrooms")
    .select("id, slug, branch_id, is_default, is_active, created_at")
    .eq("is_default", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle<ShowroomRow>();

  if (defaultError) throw defaultError;
  if (defaultShowroom) return defaultShowroom.branch_id;

  const { data: fallbackShowroom, error: fallbackShowroomError } = await supabase
    .from("showrooms")
    .select("id, slug, branch_id, is_default, is_active, created_at")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ShowroomRow>();

  if (fallbackShowroomError) throw fallbackShowroomError;
  if (fallbackShowroom) return fallbackShowroom.branch_id;

  const { data: firstBranch, error: branchError } = await supabase
    .from("branches")
    .select("id")
    .eq("is_active", true)
    .order("code", { ascending: true })
    .limit(1)
    .maybeSingle<BranchRow>();

  if (branchError) throw branchError;
  return firstBranch?.id ?? null;
}

function normalizeRoleValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function isAutoGeneratedProductCode(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  return value.trim().toUpperCase().startsWith("AUTO");
}

function normalizeProductGender(value: string | null | undefined): ProductGender | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "female" || normalized === "male" || normalized === "unisex" || normalized === "other") {
    return normalized;
  }
  return null;
}

function normalizeItemStatus(value: string): ProductItemDto["status"] {
  if (ITEM_STATUS_SET.has(value)) {
    return value as ProductItemDto["status"];
  }
  return "READY";
}

function normalizeNullableItemStatus(
  value: string | null | undefined
): ProductActivityEntryDto["toStatus"] {
  if (!value) return null;
  if (ITEM_STATUS_SET.has(value)) {
    return value as ProductActivityEntryDto["toStatus"];
  }
  return null;
}

function parseOptionalNumeric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  return parseNumeric(value);
}

function mapProductRowToActivitySnapshot(product: ProductRow): Record<string, unknown> {
  return {
    productCode: product.product_code,
    name: product.name,
    productCategoryId: product.category_id,
    gender: normalizeProductGender(product.gender),
    material: sanitizeText(product.material),
    description: sanitizeText(product.description),
    isActive: product.is_active,
    isRentable: product.is_rentable !== false,
    isSaleable: product.is_saleable === true,
    rentPricePerDay: parseOptionalNumeric(product.rent_price_per_day),
    quickRentPrice: parseOptionalNumeric(product.quick_rent_price),
    rentDepositAmount: parseOptionalNumeric(product.rent_deposit_amount),
    salePrice: parseOptionalNumeric(product.sale_price),
    purchasePrice: parseOptionalNumeric(product.purchase_price),
    coverImagePath: sanitizeText(product.cover_image_path),
    galleryImagePaths: sanitizeStringArray(product.gallery_image_paths),
    videoUrls: sanitizeStringArray(product.video_urls),
  };
}

function mapProductOverviewToActivitySnapshot(
  overview: ProductDetailDto["overview"]
): Record<string, unknown> {
  return {
    productCode: overview.productCode,
    name: overview.name,
    productCategoryId: overview.productCategoryId,
    gender: overview.gender,
    material: overview.material,
    description: overview.description,
    isActive: overview.isActive,
    isRentable: overview.isRentable,
    isSaleable: overview.isSaleable,
    rentPricePerDay: overview.rentPricePerDay,
    quickRentPrice: overview.quickRentPrice,
    rentDepositAmount: overview.rentDepositAmount,
    salePrice: overview.salePrice,
    purchasePrice: overview.purchasePrice,
    coverImagePath: overview.coverImagePath,
    galleryImagePaths: overview.galleryImagePaths,
    videoUrls: overview.videoUrls,
  };
}

function listUpdatedOverviewFields(payload: UpdateProductOverviewPayload): string[] {
  const output: string[] = [];
  const entries = Object.entries(payload) as Array<[keyof UpdateProductOverviewPayload, unknown]>;

  for (const [key, value] of entries) {
    if (value === undefined) continue;
    output.push(String(key));
  }

  return output;
}

function mapItemRowToActivitySnapshot(item: ProductItemMutationRow): Record<string, unknown> {
  return {
    itemId: item.id,
    itemCode: item.item_code,
    size: sanitizeText(item.size),
    status: normalizeItemStatus(item.status),
  };
}

function isStockCountedItemStatus(value: string | null | undefined): boolean {
  if (typeof value !== "string") return true;
  return value.trim().toUpperCase() !== "SOLD";
}

function uniqueStringValues(values: Array<string | null | undefined>): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

async function fetchSalesActorProfile(
  supabase: SupabaseClient,
  actorProfileId: string
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, default_branch_id")
    .eq("id", actorProfileId)
    .eq("is_active", true)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  return data ?? null;
}

async function assertSalesActorBranchAccess(
  supabase: SupabaseClient,
  actor: ProfileActorRow,
  branchId: string
): Promise<void> {
  const role = normalizeRoleValue(actor.role);

  if (role && OWNER_ADMIN_ROLE_SET.has(role)) {
    const { data, error } = await supabase
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .maybeSingle<BranchRow>();

    if (error) throw error;
    if (!data) {
      throw new SalesProductsDomainError("BRANCH_ACCESS_DENIED", {
        actorProfileId: actor.id,
        branchId,
      });
    }
    return;
  }

  const { data, error } = await supabase
    .from("profile_branch_access")
    .select("branch_id")
    .eq("profile_id", actor.id)
    .eq("branch_id", branchId)
    .eq("is_delete", false)
    .maybeSingle<ProfileBranchAccessRow>();

  if (error) throw error;
  if (!data) {
    throw new SalesProductsDomainError("BRANCH_ACCESS_DENIED", {
      actorProfileId: actor.id,
      branchId,
    });
  }
}

async function resolveSalesActorContext(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    requestedBranchId?: string | null;
  }
): Promise<{ actor: ProfileActorRow; role: string; branchId: string; canEditSensitivePricing: boolean }> {
  const actor = await fetchSalesActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new SalesProductsDomainError("MISSING_PROFILE_CONTEXT", {
      actorProfileId: options.actorProfileId,
    });
  }

  const role = normalizeRoleValue(actor.role);
  if (!role || !SALES_PRODUCT_ENTRY_ROLE_SET.has(role)) {
    throw new SalesProductsDomainError("FORBIDDEN_SALES_ACCESS", {
      actorProfileId: actor.id,
      role: actor.role,
    });
  }

  const branchId = sanitizeText(options.requestedBranchId) ?? sanitizeText(actor.default_branch_id);
  if (!branchId) {
    throw new SalesProductsDomainError("MISSING_BRANCH_CONTEXT", {
      actorProfileId: actor.id,
    });
  }

  await assertSalesActorBranchAccess(supabase, actor, branchId);

  return {
    actor,
    role,
    branchId,
    canEditSensitivePricing: SENSITIVE_PRICING_ROLE_SET.has(role),
  };
}

function buildPricePlanFromVariant(variant: ProductVariantRow | null): ProductPricePlanDto {
  if (!variant) {
    return {
      defaultDepositAmount: null,
      price1d: null,
      price3d: null,
      price7d: null,
      pricePerDay: null,
    };
  }

  return {
    defaultDepositAmount: parseNumeric(variant.default_deposit_amount),
    price1d: parseNumeric(variant.price_1d),
    price3d: parseNumeric(variant.price_3d),
    price7d: parseNumeric(variant.price_7d),
    pricePerDay: parseNumeric(variant.price_per_day),
  };
}

function buildSyntheticVariantRow(product: ProductRow): ProductVariantRow {
  const defaultPrice = parseNumeric(product.rent_price_per_day);
  const defaultDepositAmount = parseNumeric(product.rent_deposit_amount);

  return {
    id: product.id,
    product_id: product.id,
    variant_code: DEFAULT_PRODUCT_VARIANT_CODE,
    sku_code: null,
    name: product.name,
    size: null,
    color: null,
    default_deposit_amount: defaultDepositAmount,
    price_1d: defaultPrice,
    price_3d: null,
    price_7d: null,
    price_per_day: defaultPrice,
    is_active: true,
    sort_order: 0,
    created_at: product.updated_at,
    updated_at: product.updated_at,
  };
}

function mapCategoryRow(row: ProductCategoryRow): ProductCategoryDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    isActive: row.is_active,
  };
}

function mapTagRow(row: ProductTagRow): ProductTagDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    color: row.color,
    isActive: row.is_active,
  };
}

function buildPriceLabel(plan: ProductPricePlanDto): string | null {
  const chunks: string[] = [];
  if (plan.price1d !== null) chunks.push(`1d: ${plan.price1d}`);
  if (plan.price3d !== null) chunks.push(`3d: ${plan.price3d}`);
  if (plan.price7d !== null) chunks.push(`7d: ${plan.price7d}`);
  if (plan.pricePerDay !== null) chunks.push(`Per-day: ${plan.pricePerDay}`);
  return chunks.length > 0 ? chunks.join(" | ") : null;
}

function buildDepositLabel(plan: ProductPricePlanDto): string | null {
  if (plan.defaultDepositAmount === null) return null;
  return `Deposit: ${plan.defaultDepositAmount}`;
}

function resolveShowroomCardRentSortValue(card: ShowroomProductCardDto): number {
  const value =
    card.rentPricePerDay ?? card.pricePlan.pricePerDay ?? card.pricePlan.price1d;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Number.NEGATIVE_INFINITY;
}

function sortShowroomCardsByRentPriceDesc(
  cards: ShowroomProductCardDto[]
): ShowroomProductCardDto[] {
  return [...cards].sort((a, b) => {
    const priceDelta =
      resolveShowroomCardRentSortValue(b) -
      resolveShowroomCardRentSortValue(a);
    if (priceDelta !== 0) return priceDelta;

    return a.title.localeCompare(b.title);
  });
}

async function fetchCategories(
  supabase: SupabaseClient,
  branchId: string | null
): Promise<ProductCategoryDto[]> {
  let query = supabase
    .from("product_categories")
    .select("id, branch_id, code, name, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (branchId) {
    query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`);
  }

  const { data, error } = await query.returns<ProductCategoryRow[]>();
  if (error) throw error;
  return (data ?? []).map(mapCategoryRow);
}

async function fetchTags(
  supabase: SupabaseClient,
  branchId: string | null
): Promise<ProductTagDto[]> {
  let query = supabase
    .from("product_tags")
    .select("id, branch_id, code, name, color, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (branchId) {
    query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`);
  }

  const { data, error } = await query.returns<ProductTagRow[]>();
  if (error) throw error;
  return (data ?? []).map(mapTagRow);
}

async function fetchProducts(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    search: string | null;
    productCategoryId: string | null;
    page: number;
    pageSize: number;
    productIds?: string[] | null;
  }
): Promise<{ items: ProductRow[]; total: number }> {
  if (options.productIds && options.productIds.length === 0) {
    return {
      items: [],
      total: 0,
    };
  }

  const page = Math.max(1, Math.floor(options.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize));
  const offset = (page - 1) * pageSize;

  const runQuery = (selectFields: string) => {
    let query = supabase
      .from("products")
      .select(selectFields, { count: "exact" })
      .eq("is_delete", false)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (options.branchId) {
      query = query.or(`branch_id.is.null,branch_id.eq.${options.branchId}`);
    }

    if (options.productCategoryId) {
      query = query.eq("category_id", options.productCategoryId);
    }

    if (options.search) {
      const search = options.search;
      query = query.or(`name.ilike.%${search}%,product_code.ilike.%${search}%`);
    }

    if (options.productIds && options.productIds.length > 0) {
      query = query.in("id", options.productIds);
    }

    return query.returns<ProductRow[]>();
  };

  const primary = await runQuery(PRODUCT_SELECT_FIELDS);
  if (!primary.error) {
    return {
      items: primary.data ?? [],
      total: primary.count ?? 0,
    };
  }

  if (!shouldFallbackProductSelectLegacy(primary.error)) {
    throw primary.error;
  }

  const fallback = await runQuery(PRODUCT_SELECT_FIELDS_LEGACY);
  if (fallback.error) throw fallback.error;

  return {
    items: fallback.data ?? [],
    total: fallback.count ?? 0,
  };
}

async function fetchProductIdsByTagId(
  supabase: SupabaseClient,
  tagId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_tag_assignments")
    .select("product_id")
    .eq("tag_id", tagId)
    .returns<Array<{ product_id: string }>>();

  if (error) throw error;
  return uniqueStringValues((data ?? []).map((entry) => entry.product_id));
}

async function fetchReadyProductIds(
  supabase: SupabaseClient,
  branchId: string | null
): Promise<string[]> {
  let query = supabase
    .from("items")
    .select("product_id")
    .eq("status", "READY");

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query.returns<Array<{ product_id: string }>>();
  if (error) throw error;
  return uniqueStringValues((data ?? []).map((entry) => entry.product_id));
}

function intersectStringIds(left: string[] | null, right: string[] | null): string[] | null {
  if (!left && !right) return null;
  if (!left) return right ?? [];
  if (!right) return left;

  const rightSet = new Set(right);
  return left.filter((entry) => rightSet.has(entry));
}

async function fetchTagAssignmentsByProductIds(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (productIds.length === 0) return map;

  const { data, error } = await supabase
    .from("product_tag_assignments")
    .select("product_id, tag_id")
    .in("product_id", productIds)
    .returns<ProductTagAssignmentRow[]>();

  if (error) throw error;

  for (const row of data ?? []) {
    const current = map.get(row.product_id);
    if (current) {
      current.push(row.tag_id);
    } else {
      map.set(row.product_id, [row.tag_id]);
    }
  }

  return map;
}

async function fetchVariantsByProductIds(
  _supabase: SupabaseClient,
  products: ProductRow[]
): Promise<ProductVariantRow[]> {
  if (products.length === 0) return [];
  return products.map((product) => buildSyntheticVariantRow(product));
}

async function fetchItemsByProductIds(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<ItemRow[]> {
  if (productIds.length === 0) return [];

  const { data, error } = await supabase
    .from("items")
    .select("id, product_id, branch_id, item_code, size, status")
    .in("product_id", productIds)
    .returns<ItemRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchLastRentMapByItemIds(
  supabase: SupabaseClient,
  itemIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (itemIds.length === 0) return map;

  const { data, error } = await supabase
    .from("rental_order_items")
    .select("item_id, created_at")
    .in("item_id", itemIds)
    .order("created_at", { ascending: false })
    .returns<ItemRentalRow[]>();

  if (error) throw error;

  for (const row of data ?? []) {
    if (!map.has(row.item_id)) {
      map.set(row.item_id, row.created_at);
    }
  }

  return map;
}

async function fetchProductItemById(
  supabase: SupabaseClient,
  options: {
    itemId: string;
    productId: string;
  }
): Promise<ProductItemMutationRow | null> {
  const { data, error } = await supabase
    .from("items")
    .select("id, item_code, size, status, branch_id")
    .eq("id", options.itemId)
    .eq("product_id", options.productId)
    .maybeSingle<ProductItemMutationRow>();

  if (error) throw error;
  return data ?? null;
}

interface ProductFinancialLinkSummary {
  hasProcurementLinks: boolean;
  procurementReceiptIds: string[];
  hasOrderLinks: boolean;
}

function isRolledBackProcurementReceipt(note: string | null | undefined): boolean {
  if (typeof note !== "string" || note.length === 0) {
    return false;
  }
  return note.includes(PROCUREMENT_ROLLBACK_NOTE_META_PREFIX);
}

async function fetchProductFinancialLinkSummary(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductFinancialLinkSummary> {
  const [procurementResult, orderResult] = await Promise.all([
    supabase
      .from("procurement_receipt_items")
      .select("receipt_id")
      .eq("product_id", productId)
      .limit(40)
      .returns<ProductProcurementLinkRow[]>(),
    supabase
      .from("rental_order_items")
      .select("id")
      .eq("product_id", productId)
      .limit(1)
      .returns<ProductOrderLinkRow[]>(),
  ]);

  if (procurementResult.error) throw procurementResult.error;
  if (orderResult.error) throw orderResult.error;

  const procurementReceiptIds = uniqueStringValues(
    (procurementResult.data ?? []).map((row) => row.receipt_id)
  );
  let activeProcurementReceiptIds: string[] = [];
  if (procurementReceiptIds.length > 0) {
    const { data: receiptRows, error: receiptError } = await supabase
      .from("procurement_receipts")
      .select("id, note")
      .in("id", procurementReceiptIds)
      .returns<ProductProcurementReceiptRow[]>();

    if (receiptError) throw receiptError;

    activeProcurementReceiptIds = uniqueStringValues(
      (receiptRows ?? [])
        .filter((row) => !isRolledBackProcurementReceipt(row.note))
        .map((row) => row.id)
    );
  }

  return {
    hasProcurementLinks: activeProcurementReceiptIds.length > 0,
    procurementReceiptIds: activeProcurementReceiptIds,
    hasOrderLinks: (orderResult.data ?? []).length > 0,
  };
}

async function fetchProductAuditEvents(
  supabase: SupabaseClient,
  productId: string
): Promise<AuditEventRow[]> {
  const { data, error } = await supabase
    .from("audit_events")
    .select(
      "id, actor_profile_id, entity_type, entity_id, action, reason, before_data, after_data, meta, created_at"
    )
    .eq("entity_type", "product")
    .eq("entity_id", productId)
    .order("created_at", { ascending: false })
    .limit(PRODUCT_ACTIVITY_LIMIT)
    .returns<AuditEventRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchItemStatusLogsByItemIds(
  supabase: SupabaseClient,
  itemIds: string[]
): Promise<ProductItemStatusLogRow[]> {
  if (itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("item_status_logs")
    .select(
      "id, item_id, order_id, from_status, to_status, reason_code, reason_note, actor_profile_id, happened_at"
    )
    .in("item_id", itemIds)
    .order("happened_at", { ascending: false })
    .limit(PRODUCT_ACTIVITY_LIMIT)
    .returns<ProductItemStatusLogRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchProfileNameByIds(
  supabase: SupabaseClient,
  profileIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (profileIds.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds)
    .returns<ProfileNameRow[]>();

  if (error) throw error;

  for (const row of data ?? []) {
    const name = sanitizeText(row.full_name);
    if (name) {
      map.set(row.id, name);
    }
  }

  return map;
}

function mapAuditEventToProductActivityEntry(
  row: AuditEventRow,
  actorNameById: Map<string, string>
): ProductActivityEntryDto {
  const actorName = row.actor_profile_id ? actorNameById.get(row.actor_profile_id) ?? null : null;
  const meta: Record<string, unknown> = row.meta ? { ...row.meta } : {};

  if (row.before_data) {
    meta.beforeData = row.before_data;
  }
  if (row.after_data) {
    meta.afterData = row.after_data;
  }

  return {
    id: `audit:${row.id}`,
    source: "AUDIT_EVENT",
    actorProfileId: row.actor_profile_id,
    actorName,
    itemId: null,
    itemCode: null,
    action: row.action,
    reason: row.reason,
    fromStatus: null,
    toStatus: null,
    meta: Object.keys(meta).length > 0 ? meta : null,
    createdAt: row.created_at,
  };
}

function mapStatusLogToProductActivityEntry(
  row: ProductItemStatusLogRow,
  options: {
    itemCodeById: Map<string, string>;
    actorNameById: Map<string, string>;
  }
): ProductActivityEntryDto {
  const actorName = row.actor_profile_id
    ? options.actorNameById.get(row.actor_profile_id) ?? null
    : null;

  return {
    id: `status:${row.id}`,
    source: "ITEM_STATUS_LOG",
    actorProfileId: row.actor_profile_id,
    actorName,
    itemId: row.item_id,
    itemCode: options.itemCodeById.get(row.item_id) ?? null,
    action: row.reason_code ?? "ITEM_STATUS_CHANGED",
    reason: row.reason_note ?? row.reason_code ?? null,
    fromStatus: normalizeNullableItemStatus(row.from_status),
    toStatus: normalizeNullableItemStatus(row.to_status),
    meta: row.order_id ? { orderId: row.order_id } : null,
    createdAt: row.happened_at,
  };
}

async function buildProductActivityTimeline(
  supabase: SupabaseClient,
  options: {
    productId: string;
    itemRows: ItemRow[];
  }
): Promise<ProductActivityEntryDto[]> {
  const [auditEvents, statusLogs] = await Promise.all([
    fetchProductAuditEvents(supabase, options.productId),
    fetchItemStatusLogsByItemIds(
      supabase,
      options.itemRows.map((row) => row.id)
    ),
  ]);

  const actorIds = uniqueStringValues([
    ...auditEvents.map((row) => row.actor_profile_id),
    ...statusLogs.map((row) => row.actor_profile_id),
  ]);
  const actorNameById = await fetchProfileNameByIds(supabase, actorIds);
  const itemCodeById = new Map(options.itemRows.map((row) => [row.id, row.item_code]));

  const merged = [
    ...auditEvents.map((row) => mapAuditEventToProductActivityEntry(row, actorNameById)),
    ...statusLogs.map((row) =>
      mapStatusLogToProductActivityEntry(row, {
        itemCodeById,
        actorNameById,
      })
    ),
  ];

  merged.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return merged.slice(0, PRODUCT_ACTIVITY_LIMIT);
}

async function writeProductAuditEvent(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    actorProfileId: string;
    productId: string;
    action: string;
    reason?: string | null;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
    meta?: Record<string, unknown> | null;
  }
): Promise<void> {
  const { error } = await supabase.from("audit_events").insert({
    branch_id: options.branchId ?? null,
    actor_profile_id: options.actorProfileId,
    entity_type: "product",
    entity_id: options.productId,
    action: options.action,
    reason: options.reason ?? null,
    before_data: options.beforeData ?? null,
    after_data: options.afterData ?? null,
    meta: options.meta ?? null,
  });

  if (error) throw error;
}

function mapVariantRows(
  variants: ProductVariantRow[],
  items: ItemRow[]
): {
  variants: ProductVariantDto[];
  variantByProductId: Map<string, ProductVariantRow[]>;
  itemByVariantId: Map<string, ItemRow[]>;
} {
  const itemByVariantId = new Map<string, ItemRow[]>();

  for (const item of items) {
    const bucket = itemByVariantId.get(item.product_id);
    if (bucket) {
      bucket.push(item);
    } else {
      itemByVariantId.set(item.product_id, [item]);
    }
  }

  const variantDtos: ProductVariantDto[] = variants.map((variant) => {
    const itemRows = itemByVariantId.get(variant.id) ?? [];
    const stockCount = itemRows.filter((item) => isStockCountedItemStatus(item.status)).length;
    const readyCount = itemRows.filter((item) => item.status === "READY").length;

    return {
      id: variant.id,
      productId: variant.product_id,
      variantCode: variant.variant_code,
      skuCode: variant.sku_code,
      name: variant.name,
      size: variant.size,
      color: variant.color,
      defaultDepositAmount: parseNumeric(variant.default_deposit_amount),
      price1d: parseNumeric(variant.price_1d),
      price3d: parseNumeric(variant.price_3d),
      price7d: parseNumeric(variant.price_7d),
      pricePerDay: parseNumeric(variant.price_per_day),
      isActive: variant.is_active,
      sortOrder: variant.sort_order,
      itemCount: stockCount,
      readyItemCount: readyCount,
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    };
  });

  const variantByProductId = new Map<string, ProductVariantRow[]>();
  for (const variant of variants) {
    const bucket = variantByProductId.get(variant.product_id);
    if (bucket) {
      bucket.push(variant);
    } else {
      variantByProductId.set(variant.product_id, [variant]);
    }
  }

  return {
    variants: variantDtos,
    variantByProductId,
    itemByVariantId,
  };
}

function mapProductSummaryRows(options: {
  products: ProductRow[];
  categoriesById: Map<string, ProductCategoryDto>;
  tagsById: Map<string, ProductTagDto>;
  tagIdsByProductId: Map<string, string[]>;
  variantRowsByProductId: Map<string, ProductVariantRow[]>;
  itemRowsByVariantId: Map<string, ItemRow[]>;
  allowSensitivePricing: boolean;
}): ProductSummaryDto[] {
  return options.products.map((product) => {
    const category = product.category_id ? options.categoriesById.get(product.category_id) : null;
    const tagIds = options.tagIdsByProductId.get(product.id) ?? [];
    const tags = tagIds
      .map((tagId) => options.tagsById.get(tagId))
      .filter((entry): entry is ProductTagDto => Boolean(entry));

    const variants = options.variantRowsByProductId.get(product.id) ?? [];
    const preferredVariant = variants.find((variant) => variant.is_active) ?? variants[0] ?? null;
    const sizes = uniqueStringValues(variants.map((variant) => sanitizeText(variant.size)));
    const readyItemsDetail = variants.flatMap((variant) => {
      const itemRows = options.itemRowsByVariantId.get(variant.id) ?? [];
      const price1d = parseNumeric(variant.price_1d);
      const pricePerDay = parseNumeric(variant.price_per_day);
      const defaultDepositAmount = parseNumeric(variant.default_deposit_amount);

      return itemRows
        .filter((item) => item.status === "READY")
        .map((item) => ({
          id: item.id,
          itemCode: item.item_code,
          variantId: variant.id,
          variantName: variant.name,
          size: sanitizeText(variant.size) ?? sanitizeText(item.size),
          price1d,
          pricePerDay,
          defaultDepositAmount,
        }));
    });

    let totalItems = 0;
    let readyItems = 0;

    for (const variant of variants) {
      const itemRows = options.itemRowsByVariantId.get(variant.id) ?? [];
      totalItems += itemRows.filter((item) => isStockCountedItemStatus(item.status)).length;
      readyItems += itemRows.filter((item) => item.status === "READY").length;
    }

    const isRentable = product.is_rentable !== false;
    const isSaleable = product.is_saleable === true;

    return {
      id: product.id,
      branchId: product.branch_id,
      productCode: product.product_code,
      sizes,
      readyItemsDetail,
      name: product.name,
      productCategoryId: product.category_id,
      categoryName: category?.name ?? null,
      gender: normalizeProductGender(product.gender),
      material: product.material,
      coverImagePath: product.cover_image_path,
      isActive: product.is_active,
      isArchived: product.is_archived,
      rentPricePerDay: isRentable ? parseNumeric(product.rent_price_per_day) : null,
      quickRentPrice: isRentable ? parseNumeric(product.quick_rent_price) : null,
      rentDepositAmount: isRentable ? parseNumeric(product.rent_deposit_amount) : null,
      salePrice: isSaleable ? parseNumeric(product.sale_price) : null,
      purchasePrice: options.allowSensitivePricing
        ? parseNumeric(product.purchase_price)
        : null,
      isRentable,
      isSaleable,
      successfulRentCount: parseNonNegativeInteger(product.successful_rent_count),
      tags,
      totalItems,
      readyItems,
      variantCount: variants.length,
      pricePolicy: buildPricePlanFromVariant(preferredVariant),
      updatedAt: product.updated_at,
    };
  });
}

function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const offset = (page - 1) * pageSize;
  return items.slice(offset, offset + pageSize);
}

export async function listProductsForAdmin(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    search: string | null;
    productCategoryId: string | null;
    tagId: string | null;
    hasReadyItems: boolean;
    page: number;
    pageSize: number;
    allowSensitivePricing?: boolean;
  }
): Promise<ProductsListResponse> {
  const page = Math.max(1, Math.floor(options.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize));
  const [categories, tags] = await Promise.all([
    fetchCategories(supabase, options.branchId),
    fetchTags(supabase, options.branchId),
  ]);

  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));
  const tagById = new Map(tags.map((entry) => [entry.id, entry]));
  const [tagFilteredProductIds, readyProductIds] = await Promise.all([
    options.tagId ? fetchProductIdsByTagId(supabase, options.tagId) : Promise.resolve(null),
    options.hasReadyItems ? fetchReadyProductIds(supabase, options.branchId) : Promise.resolve(null),
  ]);
  const constrainedProductIds = intersectStringIds(tagFilteredProductIds, readyProductIds);

  const productsPage = await fetchProducts(supabase, {
    branchId: options.branchId,
    search: sanitizeSearchTerm(options.search),
    productCategoryId: options.productCategoryId,
    productIds: constrainedProductIds,
    page,
    pageSize,
  });
  const products = productsPage.items;

  const productIds = products.map((product) => product.id);
  const [tagAssignmentsByProductId, variantRows] = await Promise.all([
    fetchTagAssignmentsByProductIds(supabase, productIds),
    fetchVariantsByProductIds(supabase, products),
  ]);

  const itemRows = await fetchItemsByProductIds(supabase, productIds);

  const { variantByProductId, itemByVariantId } = mapVariantRows(variantRows, itemRows);

  const summaries = mapProductSummaryRows({
    products,
    categoriesById: categoryById,
    tagsById: tagById,
    tagIdsByProductId: tagAssignmentsByProductId,
    variantRowsByProductId: variantByProductId,
    itemRowsByVariantId: itemByVariantId,
    allowSensitivePricing: options.allowSensitivePricing ?? true,
  });

  return {
    items: summaries,
    total: productsPage.total,
    page,
    pageSize,
    categories,
    tags,
  };
}

async function getProductRow(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductRow | null> {
  return executeSingleProductQuery((selectFields) =>
    supabase
      .from("products")
      .select(selectFields)
      .eq("id", productId)
      .eq("is_delete", false)
      .eq("is_archived", false)
      .maybeSingle<ProductRow>()
  );
}

async function replaceProductTagAssignments(
  supabase: SupabaseClient,
  productId: string,
  tagIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("product_tag_assignments")
    .update({
      is_delete: true,
    })
    .eq("product_id", productId)
    .eq("is_delete", false);

  if (deleteError) throw deleteError;

  const normalizedTagIds = uniqueStringValues(tagIds);
  if (normalizedTagIds.length === 0) return;

  const rows = normalizedTagIds.map((tagId) => ({
    product_id: productId,
    tag_id: tagId,
    is_delete: false,
  }));

  const { error: insertError } = await supabase
    .from("product_tag_assignments")
    .insert(rows);

  if (insertError) throw insertError;
}

export async function getProductDetailForAdmin(
  supabase: SupabaseClient,
  productId: string,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  const product = await getProductRow(supabase, productId);
  if (!product) return null;

  const categoryPromise = product.category_id
    ? supabase
        .from("product_categories")
        .select("id, branch_id, code, name, is_active")
        .eq("id", product.category_id)
        .maybeSingle<ProductCategoryRow>()
    : Promise.resolve({ data: null, error: null });

  const [categoryResult, tagAssignmentsByProductId, variantRows] = await Promise.all([
    categoryPromise,
    fetchTagAssignmentsByProductIds(supabase, [product.id]),
    fetchVariantsByProductIds(supabase, [product]),
  ]);

  if (categoryResult.error) {
    throw categoryResult.error;
  }

  const [categories, tags] = await Promise.all([
    fetchCategories(supabase, product.branch_id),
    fetchTags(supabase, product.branch_id),
  ]);
  const tagsById = new Map(tags.map((entry) => [entry.id, entry]));

  const itemRows = await fetchItemsByProductIds(supabase, [product.id]);
  const lastRentMap = await fetchLastRentMapByItemIds(
    supabase,
    itemRows.map((entry) => entry.id)
  );

  const { variants, itemByVariantId } = mapVariantRows(variantRows, itemRows);
  const variantNameById = new Map(variants.map((entry) => [entry.id, entry.name]));

  const items: ProductItemDto[] = itemRows.map((item) => ({
    id: item.id,
    variantId: item.product_id,
    variantName: variantNameById.get(item.product_id) ?? product.name,
    itemCode: item.item_code,
    size: item.size,
    status: normalizeItemStatus(item.status),
    branchId: item.branch_id,
    lastRentDate: lastRentMap.get(item.id) ?? null,
  }));
  const activity = await buildProductActivityTimeline(supabase, {
    productId: product.id,
    itemRows,
  });

  const tagIds = tagAssignmentsByProductId.get(product.id) ?? [];
  const productTags = tagIds
    .map((tagId) => tagsById.get(tagId))
    .filter((entry): entry is ProductTagDto => Boolean(entry));

  const category = categoryResult.data ? mapCategoryRow(categoryResult.data) : null;
  const isRentable = product.is_rentable !== false;
  const isSaleable = product.is_saleable === true;

  return {
    overview: {
      id: product.id,
      branchId: product.branch_id,
      productCode: product.product_code,
      name: product.name,
      productCategoryId: product.category_id,
      categoryName: category?.name ?? null,
      gender: normalizeProductGender(product.gender),
      material: product.material,
      description: product.description,
      coverImagePath: product.cover_image_path,
      galleryImagePaths: sanitizeStringArray(product.gallery_image_paths),
      videoUrls: sanitizeStringArray(product.video_urls),
      isActive: product.is_active,
      isArchived: product.is_archived,
      rentPricePerDay: isRentable ? parseNumeric(product.rent_price_per_day) : null,
      quickRentPrice: isRentable ? parseNumeric(product.quick_rent_price) : null,
      rentDepositAmount: isRentable ? parseNumeric(product.rent_deposit_amount) : null,
      salePrice: isSaleable ? parseNumeric(product.sale_price) : null,
      purchasePrice:
        options?.allowSensitivePricing ?? true
          ? parseNumeric(product.purchase_price)
          : null,
      isRentable,
      isSaleable,
      successfulRentCount: parseNonNegativeInteger(product.successful_rent_count),
      tags: productTags,
      updatedAt: product.updated_at,
    },
    variants: variants.map((variant) => ({
      ...variant,
      itemCount: (itemByVariantId.get(variant.id) ?? []).filter((item) =>
        isStockCountedItemStatus(item.status)
      ).length,
      readyItemCount: (itemByVariantId.get(variant.id) ?? []).filter((item) => item.status === "READY").length,
    })),
    items,
    categories,
    tags,
    activity,
  };
}

export async function createProductForAdmin(
  supabase: SupabaseClient,
  userId: string,
  payload: CreateProductPayload,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto> {
  const allowSensitivePricing = options?.allowSensitivePricing ?? true;
  const initialItems = payload.items ?? [];
  let intakeResult: ProductEntryIntakeResult | null = null;

  if (!allowSensitivePricing && payload.purchasePrice !== null && payload.purchasePrice !== undefined) {
    throw new SalesProductsDomainError("FORBIDDEN_SENSITIVE_PRICING_FOR_STAFF", {
      actorProfileId: userId,
      reason: "purchase-price-forbidden-for-product-create",
    });
  }

  const missingPrices = collectMissingRequiredProductPrices(payload);
  if (missingPrices.length > 0) {
    throw new SalesProductsDomainError("MISSING_REQUIRED_PRODUCT_PRICES", {
      missingFields: missingPrices,
      productCode: payload.productCode,
    });
  }
  const rentPricePerDay = payload.rentPricePerDay as number;
  const salePrice = payload.salePrice ?? null;
  const purchasePrice = allowSensitivePricing ? payload.purchasePrice ?? null : null;

  if (initialItems.length > 0 && !payload.branchId) {
    throw new Error("BRANCH_ID_REQUIRED_FOR_PRODUCT_ITEMS");
  }
  assertManagerOnlyInitialItemStatusesAllowed({
    actorProfileId: userId,
    items: initialItems,
    allowManagerOnlyStatuses: allowSensitivePricing,
  });

  const insertPayload = {
    branch_id: payload.branchId ?? null,
    product_code: payload.productCode.trim(),
    name: payload.name.trim(),
    category_id: payload.productCategoryId ?? null,
    gender: payload.gender ?? null,
    material: sanitizeText(payload.material),
    description: sanitizeText(payload.description),
    cover_image_path: sanitizeText(payload.coverImagePath),
    gallery_image_paths: sanitizeStringArray(payload.galleryImagePaths),
    video_urls: sanitizeStringArray(payload.videoUrls),
    rent_price_per_day: rentPricePerDay,
    quick_rent_price: payload.quickRentPrice ?? null,
    rent_deposit_amount: payload.rentDepositAmount ?? null,
    sale_price: salePrice,
    purchase_price: purchasePrice,
    is_rentable: payload.isRentable ?? true,
    is_saleable: payload.isSaleable ?? false,
    is_active: payload.isActive ?? true,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(insertPayload)
    .select("id, branch_id")
    .single<{ id: string; branch_id: string | null }>();

  if (error) throw error;

  await replaceProductTagAssignments(supabase, data.id, payload.tagIds ?? []);

  if (initialItems.length > 0) {
    const branchId = data.branch_id ?? payload.branchId ?? null;
    if (!branchId) {
      throw new Error("BRANCH_ID_REQUIRED_FOR_PRODUCT_ITEMS");
    }

    await insertInitialItemsForProduct(supabase, {
      actorProfileId: userId,
      branchId,
      productId: data.id,
      items: initialItems,
    });

    intakeResult = await createProductEntryIntakePayment(supabase, {
      actorProfileId: userId,
      branchId,
      productId: data.id,
      productCode: payload.productCode.trim(),
      productName: payload.name.trim(),
      quantity: initialItems.length,
      purchasePrice,
    });
  }

  const detail = await getProductDetailForAdmin(supabase, data.id, {
    allowSensitivePricing,
  });
  if (!detail) {
    throw new Error("Created product could not be loaded");
  }

  await writeProductAuditEvent(supabase, {
    branchId: detail.overview.branchId,
    actorProfileId: userId,
    productId: detail.overview.id,
    action: "PRODUCT_CREATED",
    afterData: mapProductOverviewToActivitySnapshot(detail.overview),
    meta: {
      tagCount: detail.overview.tags.length,
      itemCount: detail.items.length,
      autoIntakeReceiptId: intakeResult?.receiptId ?? null,
      autoIntakePaymentId: intakeResult?.paymentId ?? null,
      autoIntakePaymentAmount: intakeResult?.paymentAmount ?? null,
    },
  });

  return detail;
}

export async function addProductItemsForAdmin(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  payload: AddProductItemsPayload,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  const product = await getProductRow(supabase, productId);
  if (!product) return null;
  if (!product.branch_id) {
    throw new Error("BRANCH_ID_REQUIRED_FOR_PRODUCT_ITEMS");
  }
  assertManagerOnlyInitialItemStatusesAllowed({
    actorProfileId: userId,
    items: payload.items,
    allowManagerOnlyStatuses: options?.allowSensitivePricing ?? true,
  });

  await insertInitialItemsForProduct(supabase, {
    actorProfileId: userId,
    branchId: product.branch_id,
    productId,
    items: payload.items,
  });

  const detail = await getProductDetailForAdmin(supabase, productId, {
    allowSensitivePricing: options?.allowSensitivePricing ?? true,
  });

  if (detail) {
    const itemCodePreview = payload.items.slice(0, 20).map((item) => item.itemCode);
    await writeProductAuditEvent(supabase, {
      branchId: detail.overview.branchId,
      actorProfileId: userId,
      productId: detail.overview.id,
      action: "PRODUCT_ITEMS_ADDED",
      meta: {
        quantity: payload.items.length,
        itemCodesPreview: itemCodePreview,
        hasMoreItemCodes: payload.items.length > itemCodePreview.length,
      },
    });
  }

  return detail;
}

export async function updateProductItemForAdmin(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  itemId: string,
  payload: UpdateProductItemPayload,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  const itemCode = sanitizeText(payload.itemCode);
  if (!itemCode) {
    throw new Error("ITEM_CODE_REQUIRED");
  }

  const currentItem = await fetchProductItemById(supabase, {
    itemId,
    productId,
  });
  if (!currentItem) return null;

  const updatePayload: Record<string, unknown> = {
    item_code: itemCode,
    updated_by: userId,
  };

  if (Object.prototype.hasOwnProperty.call(payload, "size")) {
    updatePayload.size = sanitizeText(payload.size);
  }

  const { data: updatedItem, error: updateError } = await supabase
    .from("items")
    .update(updatePayload)
    .eq("id", itemId)
    .eq("product_id", productId)
    .select("id, item_code, size, status, branch_id")
    .maybeSingle<ProductItemMutationRow>();

  if (updateError) throw updateError;
  if (!updatedItem) return null;

  const detail = await getProductDetailForAdmin(supabase, productId, {
    allowSensitivePricing: options?.allowSensitivePricing ?? true,
  });

  if (detail) {
    await writeProductAuditEvent(supabase, {
      branchId: detail.overview.branchId ?? updatedItem.branch_id,
      actorProfileId: userId,
      productId: detail.overview.id,
      action: "PRODUCT_ITEM_UPDATED",
      beforeData: mapItemRowToActivitySnapshot(currentItem),
      afterData: mapItemRowToActivitySnapshot(updatedItem),
      meta: {
        itemId: updatedItem.id,
      },
    });
  }

  return detail;
}

export async function deleteProductItemForAdmin(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  itemId: string,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  const currentItem = await fetchProductItemById(supabase, {
    itemId,
    productId,
  });
  if (!currentItem) return null;

  const financialLinks = await fetchProductFinancialLinkSummary(supabase, productId);
  if (financialLinks.hasProcurementLinks || financialLinks.hasOrderLinks) {
    await writeProductAuditEvent(supabase, {
      branchId: currentItem.branch_id,
      actorProfileId: userId,
      productId,
      action: "PRODUCT_ITEM_DELETE_BLOCKED_FINANCIAL_LINKS",
      reason: "ROLLBACK_RECREATE_REQUIRED",
      beforeData: mapItemRowToActivitySnapshot(currentItem),
      meta: {
        itemId: currentItem.id,
        hasProcurementLinks: financialLinks.hasProcurementLinks,
        hasOrderLinks: financialLinks.hasOrderLinks,
        procurementReceiptIdsPreview: financialLinks.procurementReceiptIds.slice(0, 10),
      },
    });

    throw new SalesProductsDomainError("PRODUCT_ITEM_DELETE_FORBIDDEN_FINANCIAL_LINKS", {
      productId,
      itemId,
      hasProcurementLinks: financialLinks.hasProcurementLinks,
      hasOrderLinks: financialLinks.hasOrderLinks,
      requiredFlow: "ROLLBACK_AND_RECREATE_RECEIPT",
    });
  }

  const { data: deletedItem, error: deleteError } = await supabase
    .from("items")
    .update({
      is_delete: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("product_id", productId)
    .eq("is_delete", false)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (deleteError) throw deleteError;
  if (!deletedItem) return null;

  const detail = await getProductDetailForAdmin(supabase, productId, {
    allowSensitivePricing: options?.allowSensitivePricing ?? true,
  });

  if (detail) {
    await writeProductAuditEvent(supabase, {
      branchId: detail.overview.branchId ?? currentItem.branch_id,
      actorProfileId: userId,
      productId: detail.overview.id,
      action: "PRODUCT_ITEM_DELETED",
      beforeData: mapItemRowToActivitySnapshot(currentItem),
      meta: {
        itemId: currentItem.id,
      },
    });
  }

  return detail;
}

export async function updateProductOverviewForAdmin(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  payload: UpdateProductOverviewPayload,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  const allowSensitivePricing = options?.allowSensitivePricing ?? true;
  const beforeProduct = await getProductRow(supabase, productId);
  if (!beforeProduct) return null;

  const updatePayload: Record<string, unknown> = {
    updated_by: userId,
  };

  if (payload.productCode !== undefined) {
    const canBypassOwnerAdminRoleForProductCode = isAutoGeneratedProductCode(
      beforeProduct.product_code
    );
    if (!canBypassOwnerAdminRoleForProductCode) {
      const role = await fetchProfileRole(supabase, userId);
      const normalizedRole = normalizeRoleValue(role);
      if (!normalizedRole || !OWNER_ADMIN_ROLE_SET.has(normalizedRole)) {
        throw new SalesProductsDomainError("FORBIDDEN_SALES_ACCESS", {
          actorProfileId: userId,
          role,
        });
      }
    }

    const trimmed = payload.productCode.trim();
    if (!trimmed) {
      throw new Error("INVALID_PRODUCT_CODE");
    }

    updatePayload.product_code = trimmed;
  }

  if (typeof payload.name === "string") {
    updatePayload.name = payload.name.trim();
  }

  if (payload.productCategoryId !== undefined) {
    updatePayload.category_id = payload.productCategoryId;
  }

  if (payload.gender !== undefined) {
    updatePayload.gender = payload.gender;
  }

  if (payload.material !== undefined) {
    updatePayload.material = sanitizeText(payload.material);
  }

  if (payload.description !== undefined) {
    updatePayload.description = sanitizeText(payload.description);
  }

  if (payload.coverImagePath !== undefined) {
    updatePayload.cover_image_path = sanitizeText(payload.coverImagePath);
  }

  if (payload.galleryImagePaths !== undefined) {
    updatePayload.gallery_image_paths = sanitizeStringArray(payload.galleryImagePaths);
  }

  if (payload.videoUrls !== undefined) {
    updatePayload.video_urls = sanitizeStringArray(payload.videoUrls);
  }

  if (payload.rentPricePerDay !== undefined) {
    updatePayload.rent_price_per_day = payload.rentPricePerDay;
  }
  if (payload.quickRentPrice !== undefined) {
    updatePayload.quick_rent_price = payload.quickRentPrice;
  }

  if (payload.rentDepositAmount !== undefined) {
    updatePayload.rent_deposit_amount = payload.rentDepositAmount;
  }

  if (payload.salePrice !== undefined) {
    updatePayload.sale_price = payload.salePrice;
  }

  if (allowSensitivePricing && payload.purchasePrice !== undefined) {
    updatePayload.purchase_price = payload.purchasePrice;
  }

  if (payload.isRentable !== undefined) {
    updatePayload.is_rentable = payload.isRentable;
  }

  if (payload.isSaleable !== undefined) {
    updatePayload.is_saleable = payload.isSaleable;
  }

  if (payload.isActive !== undefined) {
    updatePayload.is_active = payload.isActive;
  }

  const { error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId)
    .eq("is_delete", false);

  if (error) throw error;

  if (Array.isArray(payload.tagIds)) {
    await replaceProductTagAssignments(supabase, productId, payload.tagIds);
  }

  const detail = await getProductDetailForAdmin(supabase, productId, {
    allowSensitivePricing,
  });

  if (detail) {
    await writeProductAuditEvent(supabase, {
      branchId: detail.overview.branchId,
      actorProfileId: userId,
      productId: detail.overview.id,
      action: "PRODUCT_OVERVIEW_UPDATED",
      beforeData: mapProductRowToActivitySnapshot(beforeProduct),
      afterData: mapProductOverviewToActivitySnapshot(detail.overview),
      meta: {
        updatedFields: listUpdatedOverviewFields(payload),
      },
    });
  }

  return detail;
}

export async function createProductVariantForAdmin(
  supabase: SupabaseClient,
  productId: string,
  _payload: CreateProductVariantPayload,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  return getProductDetailForAdmin(supabase, productId, {
    allowSensitivePricing: options?.allowSensitivePricing ?? true,
  });
}

export async function updateProductVariantForAdmin(
  supabase: SupabaseClient,
  productId: string,
  _variantId: string,
  payload: UpdateProductVariantPayload,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  const nextRentPricePerDay = payload.pricePerDay ?? payload.price1d;
  const updatePayload: Record<string, unknown> = {};
  if (nextRentPricePerDay !== undefined) {
    updatePayload.rent_price_per_day = nextRentPricePerDay;
  }
  if (payload.defaultDepositAmount !== undefined) {
    updatePayload.rent_deposit_amount = payload.defaultDepositAmount;
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", productId)
      .eq("is_delete", false);

    if (error) throw error;
  }

  return getProductDetailForAdmin(supabase, productId, {
    allowSensitivePricing: options?.allowSensitivePricing ?? true,
  });
}

export async function deleteProductVariantForAdmin(
  supabase: SupabaseClient,
  productId: string,
  _variantId: string,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  return getProductDetailForAdmin(supabase, productId, {
    allowSensitivePricing: options?.allowSensitivePricing ?? true,
  });
}

export async function deleteProductForAdmin(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<boolean> {
  const beforeProduct = await getProductRow(supabase, productId);
  if (!beforeProduct) return false;

  const financialLinks = await fetchProductFinancialLinkSummary(supabase, productId);
  if (financialLinks.hasProcurementLinks || financialLinks.hasOrderLinks) {
    await writeProductAuditEvent(supabase, {
      branchId: beforeProduct.branch_id,
      actorProfileId: userId,
      productId,
      action: "PRODUCT_DELETE_BLOCKED_FINANCIAL_LINKS",
      reason: "ARCHIVE_DELETE_FORBIDDEN",
      beforeData: mapProductRowToActivitySnapshot(beforeProduct),
      meta: {
        hasProcurementLinks: financialLinks.hasProcurementLinks,
        hasOrderLinks: financialLinks.hasOrderLinks,
        procurementReceiptIdsPreview: financialLinks.procurementReceiptIds.slice(0, 10),
      },
    });

    throw new SalesProductsDomainError("PRODUCT_DELETE_FORBIDDEN_FINANCIAL_LINKS", {
      productId,
      hasProcurementLinks: financialLinks.hasProcurementLinks,
      hasOrderLinks: financialLinks.hasOrderLinks,
      requiredFlow: "KEEP_ARCHIVED_OR_USE_LEDGER_CORRECTION",
    });
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      is_archived: true,
      is_active: false,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("is_delete", false)
    .eq("is_archived", false)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) throw error;
  if (!data?.id) return false;

  await writeProductAuditEvent(supabase, {
    branchId: beforeProduct.branch_id,
    actorProfileId: userId,
    productId,
    action: "PRODUCT_ARCHIVED",
    beforeData: mapProductRowToActivitySnapshot(beforeProduct),
    afterData: {
      ...mapProductRowToActivitySnapshot(beforeProduct),
      isActive: false,
      isArchived: true,
    },
    meta: {
      financialLinksChecked: true,
    },
  });

  return true;
}

export async function updateProductPricingForAdmin(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  payload: UpdateProductPricingPayload,
  options?: {
    allowSensitivePricing?: boolean;
  }
): Promise<ProductDetailDto | null> {
  const beforeProduct = await getProductRow(supabase, productId);
  if (!beforeProduct) return null;

  if (!Array.isArray(payload.variants) || payload.variants.length === 0) {
    return getProductDetailForAdmin(supabase, productId, {
      allowSensitivePricing: options?.allowSensitivePricing ?? true,
    });
  }

  const selectedPatch =
    payload.variants.find((entry) => entry.variantId === productId) ??
    payload.variants[0] ??
    null;

  if (selectedPatch) {
    const nextRentPricePerDay = selectedPatch.pricePerDay ?? selectedPatch.price1d;
    const updatePayload: Record<string, unknown> = {
      rent_deposit_amount: selectedPatch.defaultDepositAmount ?? null,
    };
    if (nextRentPricePerDay !== undefined) {
      updatePayload.rent_price_per_day = nextRentPricePerDay;
    }
    const { error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", productId)
      .eq("is_delete", false);

    if (error) throw error;
  }

  const detail = await getProductDetailForAdmin(supabase, productId, {
    allowSensitivePricing: options?.allowSensitivePricing ?? true,
  });

  if (detail && selectedPatch) {
    await writeProductAuditEvent(supabase, {
      branchId: detail.overview.branchId,
      actorProfileId: userId,
      productId: detail.overview.id,
      action: "PRODUCT_PRICING_UPDATED",
      beforeData: {
        rentPricePerDay: parseNumeric(beforeProduct.rent_price_per_day),
        rentDepositAmount: parseNumeric(beforeProduct.rent_deposit_amount),
      },
      afterData: {
        rentPricePerDay: detail.overview.rentPricePerDay,
        rentDepositAmount: detail.overview.rentDepositAmount,
      },
      meta: {
        variantId: selectedPatch.variantId,
      },
    });
  }

  return detail;
}

export async function fetchProfileRole(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<ProfileRoleRow>();

  if (error) throw error;
  return data?.role ?? null;
}

function normalizeInitialItemStatus(
  value: ProductInitialItemStatus
): ProductInitialItemStatus {
  if (!PRODUCT_ENTRY_ITEM_STATUS_SET.has(value)) {
    throw new SalesProductsDomainError("INVALID_PRODUCT_ENTRY_STATUS", {
      value,
    });
  }

  return value;
}

function listManagerOnlyInitialItemStatuses(
  items: AddProductItemsPayload["items"]
): ProductInitialItemStatus[] {
  const output = new Set<ProductInitialItemStatus>();
  for (const item of items) {
    if (MANAGER_ONLY_PRODUCT_ENTRY_STATUS_SET.has(item.initialStatus)) {
      output.add(item.initialStatus);
    }
  }
  return Array.from(output);
}

function assertManagerOnlyInitialItemStatusesAllowed(options: {
  actorProfileId: string;
  items: AddProductItemsPayload["items"];
  allowManagerOnlyStatuses: boolean;
  role?: string;
}): void {
  if (options.allowManagerOnlyStatuses) return;

  const requestedStatuses = listManagerOnlyInitialItemStatuses(options.items);
  if (requestedStatuses.length === 0) return;

  throw new SalesProductsDomainError("FORBIDDEN_MANAGER_ONLY_ITEM_STATUS", {
    actorProfileId: options.actorProfileId,
    role: options.role ?? null,
    requestedStatuses,
  });
}

async function insertInitialItemsForProduct(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId: string;
    productId: string;
    items: AddProductItemsPayload["items"];
  }
): Promise<void> {
  const normalizedRows: Array<{
    itemCode: string;
    initialStatus: ProductInitialItemStatus;
    size: string | null;
  }> = [];
  const seenCodes = new Set<string>();

  for (const item of options.items) {
    const itemCode = sanitizeText(item.itemCode);
    if (!itemCode) continue;

    const lowerCode = itemCode.toLowerCase();
    if (seenCodes.has(lowerCode)) {
      throw new SalesProductsDomainError("DUPLICATE_ITEM_CODE_IN_PAYLOAD", {
        itemCode,
      });
    }
    seenCodes.add(lowerCode);

    normalizedRows.push({
      itemCode,
      initialStatus: normalizeInitialItemStatus(item.initialStatus),
      size: sanitizeText(item.size),
    });
  }

  if (normalizedRows.length === 0) {
    return;
  }

  const { data: insertedItems, error: insertError } = await supabase
    .from("items")
    .insert(
      normalizedRows.map((row) => ({
        branch_id: options.branchId,
        product_id: options.productId,
        item_code: row.itemCode,
        size: row.size,
        status: row.initialStatus,
      }))
    )
    .select("id, item_code, status")
    .returns<InsertedItemRow[]>();

  if (insertError) throw insertError;

  if ((insertedItems ?? []).length === 0) {
    return;
  }

  const { error: statusLogError } = await supabase.from("item_status_logs").insert(
    insertedItems.map((row) => ({
      branch_id: options.branchId,
      item_id: row.id,
      from_status: null,
      to_status: row.status,
      reason_code: "PRODUCT_ENTRY_CREATE",
      reason_note: `Initial status for ${row.item_code}`,
      actor_profile_id: options.actorProfileId,
    }))
  );

  if (statusLogError) throw statusLogError;
}

export async function listProductsForSalesActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: SalesProductsCatalogQuery;
  }
): Promise<ProductsListResponse> {
  const actorContext = await resolveSalesActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: options.query.branchId,
  });

  return listProductsForAdmin(supabase, {
    branchId: actorContext.branchId,
    search: options.query.search ?? null,
    productCategoryId: options.query.productCategoryId ?? null,
    tagId: options.query.tagId ?? null,
    hasReadyItems: options.query.hasReadyItems ?? false,
    page: Math.max(1, Number(options.query.page ?? 1)),
    pageSize: Math.max(1, Number(options.query.pageSize ?? 24)),
    allowSensitivePricing: actorContext.canEditSensitivePricing,
  });
}

export async function getSalesProductDetailForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    productId: string;
    branchId?: string | null;
  }
): Promise<ProductDetailDto | null> {
  const actorContext = await resolveSalesActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: options.branchId,
  });

  const detail = await getProductDetailForAdmin(supabase, options.productId, {
    allowSensitivePricing: actorContext.canEditSensitivePricing,
  });
  if (!detail) return null;

  const detailBranchId = detail.overview.branchId;
  if (detailBranchId) {
    await assertSalesActorBranchAccess(supabase, actorContext.actor, detailBranchId);
  }

  return detail;
}

export async function createSalesProductEntryForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateSalesProductEntryPayload;
  }
): Promise<ProductDetailDto> {
  const actorContext = await resolveSalesActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: options.payload.branchId,
  });

  const requestedProduct = options.payload.product;
  const requestedPricing = options.payload.pricing;
  if (
    !actorContext.canEditSensitivePricing &&
    ((requestedPricing.defaultDepositAmount ?? null) !== null ||
      (requestedPricing.price3d ?? null) !== null ||
      (requestedPricing.price7d ?? null) !== null ||
      (requestedPricing.pricePerDay ?? null) !== null ||
      (requestedProduct.purchasePrice ?? null) !== null)
  ) {
    throw new SalesProductsDomainError("FORBIDDEN_SENSITIVE_PRICING_FOR_STAFF", {
      actorProfileId: options.actorProfileId,
      role: actorContext.role,
    });
  }
  assertManagerOnlyInitialItemStatusesAllowed({
    actorProfileId: options.actorProfileId,
    items: options.payload.items,
    allowManagerOnlyStatuses: actorContext.canEditSensitivePricing,
    role: actorContext.role,
  });

  const defaultPricePerDay = requestedPricing.pricePerDay ?? requestedPricing.price1d;

  const createdProduct = await createProductForAdmin(supabase, options.actorProfileId, {
    branchId: actorContext.branchId,
    productCode: requestedProduct.productCode,
    name: requestedProduct.name,
    productCategoryId: requestedProduct.productCategoryId ?? null,
    gender: requestedProduct.gender ?? null,
    material: requestedProduct.material ?? null,
    description: requestedProduct.description ?? null,
    coverImagePath: requestedProduct.coverImagePath ?? null,
    galleryImagePaths: requestedProduct.galleryImagePaths ?? [],
    videoUrls: requestedProduct.videoUrls ?? [],
    rentPricePerDay: defaultPricePerDay,
    quickRentPrice: requestedProduct.quickRentPrice ?? null,
    rentDepositAmount: actorContext.canEditSensitivePricing
      ? requestedProduct.rentDepositAmount ?? requestedPricing.defaultDepositAmount ?? null
      : null,
    salePrice: requestedProduct.salePrice ?? null,
    purchasePrice: actorContext.canEditSensitivePricing
      ? requestedProduct.purchasePrice ?? null
      : null,
    tagIds: requestedProduct.tagIds ?? [],
    isActive: requestedProduct.isActive ?? true,
    isRentable: requestedProduct.isRentable ?? true,
    isSaleable: requestedProduct.isSaleable ?? true,
  }, {
    allowSensitivePricing: actorContext.canEditSensitivePricing,
  });

  const detailAfterPricing = await updateProductPricingForAdmin(
    supabase,
    options.actorProfileId,
    createdProduct.overview.id,
    {
      variants: [
        {
          variantId: createdProduct.overview.id,
          defaultDepositAmount: actorContext.canEditSensitivePricing
            ? requestedPricing.defaultDepositAmount ?? null
            : null,
          price1d: requestedPricing.price1d,
          price3d: actorContext.canEditSensitivePricing ? requestedPricing.price3d ?? null : null,
          price7d: actorContext.canEditSensitivePricing ? requestedPricing.price7d ?? null : null,
          pricePerDay: defaultPricePerDay,
        },
      ],
    },
    {
      allowSensitivePricing: actorContext.canEditSensitivePricing,
    }
  );

  if (!detailAfterPricing) {
    throw new SalesProductsDomainError("PRODUCT_NOT_FOUND", {
      productId: createdProduct.overview.id,
    });
  }

  await insertInitialItemsForProduct(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: actorContext.branchId,
    productId: createdProduct.overview.id,
    items: options.payload.items,
  });

  await createProductEntryIntakePayment(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: actorContext.branchId,
    productId: createdProduct.overview.id,
    productCode: createdProduct.overview.productCode,
    productName: createdProduct.overview.name,
    quantity: options.payload.items.length,
    purchasePrice: createdProduct.overview.purchasePrice,
  });

  const finalDetail = await getProductDetailForAdmin(supabase, createdProduct.overview.id, {
    allowSensitivePricing: actorContext.canEditSensitivePricing,
  });
  if (!finalDetail) {
    throw new SalesProductsDomainError("PRODUCT_NOT_FOUND", {
      productId: createdProduct.overview.id,
    });
  }

  return finalDetail;
}

export async function updateSalesProductOverviewForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    productId: string;
    payload: UpdateProductOverviewPayload;
    branchId?: string | null;
  }
): Promise<ProductDetailDto | null> {
  const actorContext = await resolveSalesActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: options.branchId,
  });

  const product = await getProductRow(supabase, options.productId);
  if (!product) {
    return null;
  }

  if (product.branch_id) {
    await assertSalesActorBranchAccess(supabase, actorContext.actor, product.branch_id);
  }

  if (!actorContext.canEditSensitivePricing && options.payload.purchasePrice !== undefined) {
    throw new SalesProductsDomainError("FORBIDDEN_SENSITIVE_PRICING_FOR_STAFF", {
      actorProfileId: options.actorProfileId,
      role: actorContext.role,
    });
  }

  return updateProductOverviewForAdmin(
    supabase,
    options.actorProfileId,
    options.productId,
    options.payload,
    {
      allowSensitivePricing: actorContext.canEditSensitivePricing,
    }
  );
}

async function fetchRecentIntakedProductIdsForShowroom(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    limit: number;
  }
): Promise<string[]> {
  const targetLimit = Math.max(1, Math.min(60, Math.floor(options.limit)));
  const receiptLookupLimit = Math.min(500, Math.max(80, targetLimit * 20));
  const itemLookupLimit = Math.min(1_500, Math.max(300, targetLimit * 60));

  let receiptQuery = supabase
    .from("procurement_receipts")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(receiptLookupLimit);

  if (options.branchId) {
    receiptQuery = receiptQuery.eq("branch_id", options.branchId);
  }

  const { data: receiptRows, error: receiptError } = await receiptQuery.returns<
    ProcurementReceiptLookupRow[]
  >();
  if (receiptError) throw receiptError;

  const receiptIds = uniqueStringValues((receiptRows ?? []).map((row) => row.id));
  if (receiptIds.length === 0) return [];

  const { data: receiptItems, error: receiptItemsError } = await supabase
    .from("procurement_receipt_items")
    .select("product_id, created_at")
    .in("receipt_id", receiptIds)
    .order("created_at", { ascending: false })
    .limit(itemLookupLimit)
    .returns<ProcurementReceiptItemLookupRow[]>();
  if (receiptItemsError) throw receiptItemsError;

  const recentProductIds: string[] = [];
  const seenProductIds = new Set<string>();

  for (const row of receiptItems ?? []) {
    const productId = sanitizeText(row.product_id);
    if (!productId || seenProductIds.has(productId)) continue;
    seenProductIds.add(productId);
    recentProductIds.push(productId);
    if (recentProductIds.length >= targetLimit) break;
  }

  return recentProductIds;
}

async function resolveRequestedProductIdsForShowroom(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    requestedProductTokens: string[];
  }
): Promise<string[]> {
  const tokens = uniqueStringValues(options.requestedProductTokens);
  if (tokens.length === 0) return [];

  const buildIdentityQuery = () => {
    let query = supabase
      .from("products")
      .select("id, product_code")
      .eq("is_delete", false)
      .eq("is_active", true)
      .eq("is_archived", false);

    if (options.branchId) {
      query = query.or(`branch_id.is.null,branch_id.eq.${options.branchId}`);
    }

    return query;
  };

  const [byIdResult, byCodeResult] = await Promise.all([
    buildIdentityQuery().in("id", tokens).returns<ProductIdentityRow[]>(),
    buildIdentityQuery().in("product_code", tokens).returns<ProductIdentityRow[]>(),
  ]);

  if (byIdResult.error) throw byIdResult.error;
  if (byCodeResult.error) throw byCodeResult.error;

  const idSet = new Set((byIdResult.data ?? []).map((entry) => entry.id));
  const codeToId = new Map<string, string>();
  for (const entry of byCodeResult.data ?? []) {
    const normalizedCode = sanitizeText(entry.product_code)?.toLowerCase();
    if (!normalizedCode || codeToId.has(normalizedCode)) continue;
    codeToId.set(normalizedCode, entry.id);
  }

  const output: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const normalizedToken = sanitizeText(token);
    if (!normalizedToken) continue;

    const resolvedId = idSet.has(normalizedToken)
      ? normalizedToken
      : codeToId.get(normalizedToken.toLowerCase()) ?? null;
    if (!resolvedId || seen.has(resolvedId)) continue;
    seen.add(resolvedId);
    output.push(resolvedId);
  }

  return output;
}

export async function listProductsForShowroom(
  supabase: SupabaseClient,
  options: {
    query: ShowroomProductsQuery;
  }
): Promise<ShowroomProductsResponse> {
  const branchId = await resolvePublicShowroomBranchId(supabase, {
    showroomSlug: options.query.showroomSlug ?? null,
    branchId: options.query.branchId ?? null,
  });
  const productCategoryIds = uniqueStringValues([
    ...(options.query.productCategoryIds ?? []),
    options.query.productCategoryId ?? null,
  ]);
  const tagId = options.query.tagId ?? null;
  const genderFilters = Array.from(
    new Set(
      [options.query.gender ?? null, ...(options.query.genders ?? [])]
        .map((entry) => normalizeProductGender(entry))
        .filter((entry): entry is ProductGender => Boolean(entry))
    )
  );
  const requestedProductTokens = uniqueStringValues(options.query.productIds ?? []);
  const requestedProductIds = await resolveRequestedProductIdsForShowroom(supabase, {
    branchId,
    requestedProductTokens,
  });
  const search = sanitizeSearchTerm(options.query.search);
  const sizeFilters = uniqueStringValues([options.query.size ?? null, ...(options.query.sizes ?? [])]);
  const sizeFilterSet = new Set(sizeFilters);
  const colorFilter = sanitizeText(options.query.color);
  const page = Math.max(1, Number(options.query.page ?? 1));
  const pageSize = Math.min(60, Math.max(1, Number(options.query.pageSize ?? 18)));
  const shouldUseRecentIntakeFallback =
    options.query.preferRecentIntake === true &&
    requestedProductTokens.length === 0 &&
    !search &&
    productCategoryIds.length === 0 &&
    !tagId &&
    genderFilters.length === 0 &&
    sizeFilters.length === 0 &&
    !colorFilter;
  const effectiveRequestedProductIds = shouldUseRecentIntakeFallback
    ? await fetchRecentIntakedProductIdsForShowroom(supabase, {
        branchId,
        limit: Math.max(10, pageSize),
      })
    : requestedProductIds;
  const tagFilteredProductIds = tagId
    ? await fetchProductIdsByTagId(supabase, tagId)
    : null;
  const constrainedProductIds = intersectStringIds(
    effectiveRequestedProductIds.length > 0 ? effectiveRequestedProductIds : null,
    tagFilteredProductIds
  );
  const requiresInMemoryPagination =
    effectiveRequestedProductIds.length > 0 ||
    sizeFilterSet.size > 0 ||
    Boolean(colorFilter);

  const runShowroomProductsQuery = async (params: {
    paged: boolean;
  }): Promise<{ items: ProductRow[]; total: number }> => {
    if (constrainedProductIds && constrainedProductIds.length === 0) {
      return {
        items: [],
        total: 0,
      };
    }

    const runQuery = (selectFields: string) => {
      let query = supabase
        .from("products")
        .select(selectFields, { count: "exact" })
        .eq("is_delete", false)
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("rent_price_per_day", {
          ascending: false,
          nullsFirst: false,
        })
        .order("updated_at", { ascending: false });

      if (params.paged) {
        const offset = (page - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);
      }

      if (branchId) {
        query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,material.ilike.%${search}%`);
      }

      if (productCategoryIds.length === 1) {
        query = query.eq("category_id", productCategoryIds[0]);
      } else if (productCategoryIds.length > 1) {
        query = query.in("category_id", productCategoryIds);
      }

      if (genderFilters.length > 0) {
        query = query.in("gender", genderFilters);
      }

      if (constrainedProductIds && constrainedProductIds.length > 0) {
        query = query.in("id", constrainedProductIds);
      }

      return query.returns<ProductRow[]>();
    };

    const primary = await runQuery(PRODUCT_SELECT_FIELDS);
    if (!primary.error) {
      return {
        items: primary.data ?? [],
        total: primary.count ?? 0,
      };
    }

    if (!shouldFallbackProductSelectLegacy(primary.error)) {
      throw primary.error;
    }

    const fallback = await runQuery(PRODUCT_SELECT_FIELDS_LEGACY);
    if (fallback.error) throw fallback.error;

    return {
      items: fallback.data ?? [],
      total: fallback.count ?? 0,
    };
  };

  const productsPage = await runShowroomProductsQuery({
    paged: !requiresInMemoryPagination,
  });
  const products = productsPage.items;

  const productIds = products.map((entry) => entry.id);
  const [categories, tags, tagAssignmentsByProductId, variantRows] = await Promise.all([
    fetchCategories(supabase, branchId),
    fetchTags(supabase, branchId),
    fetchTagAssignmentsByProductIds(supabase, productIds),
    fetchVariantsByProductIds(supabase, products),
  ]);

  const tagsById = new Map(tags.map((entry) => [entry.id, entry]));
  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));

  const variantRowsByProductId = new Map<string, ProductVariantRow[]>();
  for (const variant of variantRows) {
    const bucket = variantRowsByProductId.get(variant.product_id);
    if (bucket) {
      bucket.push(variant);
    } else {
      variantRowsByProductId.set(variant.product_id, [variant]);
    }
  }

  let cards: ShowroomProductCardDto[] = products.map((product) => {
    const productVariants = variantRowsByProductId.get(product.id) ?? [];
    const preferredVariant = productVariants.find((entry) => entry.is_active) ?? productVariants[0] ?? null;

    const tagIds = tagAssignmentsByProductId.get(product.id) ?? [];
    const productTags = tagIds
      .map((tagValue) => tagsById.get(tagValue))
      .filter((entry): entry is ProductTagDto => Boolean(entry));

    const sizes = uniqueStringValues(productVariants.map((entry) => entry.size));
    const colors = uniqueStringValues(productVariants.map((entry) => entry.color));
    const pricePlan = buildPricePlanFromVariant(preferredVariant);
    const isRentable = product.is_rentable !== false;
    const isSaleable = product.is_saleable === true;

    return {
      id: product.id,
      title: product.name,
      coverImagePath: resolvePrimaryProductImagePath(
        product.cover_image_path,
        product.gallery_image_paths
      ),
      categoryName: product.category_id ? categoryById.get(product.category_id)?.name ?? null : null,
      tags: productTags.map((entry) => entry.name),
      gender: normalizeProductGender(product.gender),
      material: product.material,
      sizes,
      colors,
      rentPricePerDay: isRentable ? parseNumeric(product.rent_price_per_day) : null,
      quickRentPrice: isRentable ? parseNumeric(product.quick_rent_price) : null,
      salePrice: isSaleable ? parseNumeric(product.sale_price) : null,
      isRentable,
      isSaleable,
      successfulRentCount: parseNonNegativeInteger(product.successful_rent_count),
      pricePlan,
      priceLabel: buildPriceLabel(pricePlan),
      depositLabel: buildDepositLabel(pricePlan),
    };
  });

  if (sizeFilterSet.size > 0) {
    cards = cards.filter((card) => card.sizes.some((size) => sizeFilterSet.has(size)));
  }

  if (colorFilter) {
    cards = cards.filter((card) => card.colors.includes(colorFilter));
  }

  if (effectiveRequestedProductIds.length > 0) {
    const orderByProductId = new Map(
      effectiveRequestedProductIds.map((entry, index) => [entry, index])
    );
    cards = cards
      .filter((entry) => orderByProductId.has(entry.id))
      .sort((a, b) => (orderByProductId.get(a.id) ?? 0) - (orderByProductId.get(b.id) ?? 0));
  }

  cards = sortShowroomCardsByRentPriceDesc(cards);

  const total = requiresInMemoryPagination ? cards.length : productsPage.total;
  const items = requiresInMemoryPagination ? paginateItems(cards, page, pageSize) : cards;

  return {
    items,
    total,
    page,
    pageSize,
    categories,
    tags,
  };
}

async function fetchReadyItemStatsForProduct(
  supabase: SupabaseClient,
  options: {
    productId: string;
    branchId: string | null;
  }
): Promise<{
  readyItems: number;
  sizeBreakdown: ShowroomReadyItemSizeDto[];
}> {
  let query = supabase
    .from("items")
    .select("size")
    .eq("product_id", options.productId)
    .eq("status", "READY");

  if (options.branchId) {
    query = query.eq("branch_id", options.branchId);
  }

  const { data, error } = await query.returns<Array<{ size: string | null }>>();
  if (error) throw error;

  const countByNormalizedSize = new Map<string, ShowroomReadyItemSizeDto>();
  for (const row of data ?? []) {
    const normalizedSize = sanitizeText(row.size);
    const mapKey = normalizedSize?.toLowerCase() ?? "__unspecified__";

    const current = countByNormalizedSize.get(mapKey);
    if (current) {
      current.count += 1;
      continue;
    }

    countByNormalizedSize.set(mapKey, {
      size: normalizedSize,
      count: 1,
    });
  }

  const sizeBreakdown = Array.from(countByNormalizedSize.values()).sort((left, right) => {
    if (left.size === right.size) return 0;
    if (left.size === null) return 1;
    if (right.size === null) return -1;
    return left.size.localeCompare(right.size, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return {
    readyItems: data?.length ?? 0,
    sizeBreakdown,
  };
}

export async function getShowroomProductDetail(
  supabase: SupabaseClient,
  options: {
    productId: string;
    query: ShowroomProductDetailQuery;
  }
): Promise<ShowroomProductDetailDto | null> {
  const productId = options.productId.trim();
  if (!productId) return null;

  const requestedBranchId = await resolvePublicShowroomBranchId(supabase, {
    showroomSlug: options.query.showroomSlug ?? null,
    branchId: options.query.branchId ?? null,
  });

  const product = await executeSingleProductQuery((selectFields) => {
    let productQuery = supabase
      .from("products")
      .select(selectFields)
      .eq("id", productId)
      .eq("is_delete", false)
      .eq("is_active", true)
      .eq("is_archived", false);

    if (requestedBranchId) {
      productQuery = productQuery.or(`branch_id.is.null,branch_id.eq.${requestedBranchId}`);
    }

    return productQuery.maybeSingle<ProductRow>();
  });
  if (!product) return null;

  const branchScope = requestedBranchId ?? product.branch_id;

  const [categories, tags, tagAssignmentsByProductId, variantRows, readyItemStats] = await Promise.all([
    fetchCategories(supabase, branchScope),
    fetchTags(supabase, branchScope),
    fetchTagAssignmentsByProductIds(supabase, [product.id]),
    fetchVariantsByProductIds(supabase, [product]),
    fetchReadyItemStatsForProduct(supabase, {
      productId: product.id,
      branchId: branchScope,
    }),
  ]);

  const categoriesById = new Map(categories.map((entry) => [entry.id, entry]));
  const tagsById = new Map(tags.map((entry) => [entry.id, entry]));

  const tagIds = tagAssignmentsByProductId.get(product.id) ?? [];
  const tagNames = tagIds
    .map((tagId) => tagsById.get(tagId)?.name ?? null)
    .filter((entry): entry is string => Boolean(entry));

  const activeVariants = variantRows.filter((entry) => entry.is_active);
  const displayVariants = activeVariants.length > 0 ? activeVariants : variantRows;

  const variants: ShowroomProductVariantDto[] = displayVariants.map((entry) => ({
    id: entry.id,
    name: entry.name,
    size: entry.size,
    color: entry.color,
    isActive: entry.is_active,
    ...buildPricePlanFromVariant(entry),
  }));

  const preferredVariant = displayVariants[0] ?? null;
  const pricePlan = buildPricePlanFromVariant(preferredVariant);
  const isRentable = product.is_rentable !== false;
  const isSaleable = product.is_saleable === true;

  const sizes = readyItemStats.sizeBreakdown
    .map((entry) => entry.size)
    .filter((entry): entry is string => Boolean(entry));
  const colors = uniqueStringValues(displayVariants.map((entry) => entry.color));
  const galleryImagePaths = sanitizeStringArray(product.gallery_image_paths);
  const normalizedGalleryImagePaths =
    galleryImagePaths.length > 0
      ? galleryImagePaths
      : product.cover_image_path
        ? [product.cover_image_path]
        : [];

  return {
    id: product.id,
    title: product.name,
    description: product.description,
    coverImagePath: product.cover_image_path,
    galleryImagePaths: normalizedGalleryImagePaths,
    videoUrls: sanitizeStringArray(product.video_urls),
    categoryName: product.category_id ? categoriesById.get(product.category_id)?.name ?? null : null,
    tags: tagNames,
    gender: normalizeProductGender(product.gender),
    material: product.material,
    sizes,
    colors,
    rentPricePerDay: isRentable ? parseNumeric(product.rent_price_per_day) : null,
    quickRentPrice: isRentable ? parseNumeric(product.quick_rent_price) : null,
    salePrice: isSaleable ? parseNumeric(product.sale_price) : null,
    isRentable,
    isSaleable,
    successfulRentCount: parseNonNegativeInteger(product.successful_rent_count),
    remainingItems: readyItemStats.readyItems,
    readyItemSizeBreakdown: readyItemStats.sizeBreakdown,
    variants,
    pricePlan,
    priceLabel: buildPriceLabel(pricePlan),
    depositLabel: buildDepositLabel(pricePlan),
  };
}
