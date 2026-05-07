import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderPaymentMethod } from "@/types/ordersDomain";
import type { ProductGender } from "@/types/productsCatalog";
import type {
  CreateProcurementReceiptPayload,
  ProcurementCategoriesQuery,
  ProcurementCategoriesResponse,
  ProcurementImportCommitResponse,
  ProcurementImportContextInput,
  ProcurementImportErrorCode,
  ProcurementImportIncompleteExportPayload,
  ProcurementImportIncompleteRowDto,
  ProcurementImportNormalizedRowDto,
  ProcurementImportResolvedAction,
  ProcurementImportTemplateColumn,
  ProcurementImportValidationErrorDto,
  ProcurementImportValidationResponse,
  ProcurementIntakeChannel,
  ProcurementListQuery,
  ProcurementListResponse,
  ProcurementProductsQuery,
  ProcurementProductsResponse,
  ProcurementReceiptDetailDto,
  ProcurementReceiptRollbackResultDto,
  ProcurementReceiptLineDto,
  ProcurementReceiptSummaryDto,
  RollbackProcurementReceiptPayload,
} from "@/types/procurement";

const PROCUREMENT_ROLE_SET = new Set<string>([
  "owner_admin",
  "admin",
  "manager",
  "staff",
]);
const PROCUREMENT_ROLLBACK_ROLE_SET = new Set<string>(["owner_admin", "admin", "manager"]);
const PAYMENT_METHOD_SET = new Set<OrderPaymentMethod>(["CASH", "BANK", "MOMO"]);
const INTAKE_CHANNEL_SET = new Set<ProcurementIntakeChannel>(["MANUAL", "EXCEL"]);

const STOCK_COUNTED_ITEM_STATUS_SET = new Set<string>([
  "READY",
  "RESERVED",
  "ON_RENT",
  "LAUNDRY",
  "MAINTENANCE",
  "DAMAGED",
  "LOST",
]);
const PROCUREMENT_ROLLBACK_BLOCKED_ITEM_STATUS_SET = new Set<string>([
  "RESERVED",
  "ON_RENT",
  "SOLD",
]);

const TEMPLATE_COLUMNS: readonly ProcurementImportTemplateColumn[] = [
  "product_code",
  "name",
  "quantity",
  "rent_price_per_day",
  "quick_rent_price",
  "purchase_price",
  "sale_price",
  "category_code",
  "is_rentable",
  "is_saleable",
  "material",
  "gender",
  "description",
  "cover_image_url",
  "item_size",
  "note",
];
const TEMPLATE_REQUIRED_COLUMNS: ReadonlySet<ProcurementImportTemplateColumn> = new Set([
  "quantity",
  "rent_price_per_day",
  "purchase_price",
  "sale_price",
]);
type ProcurementTemplateLocale = "vi" | "en";

const TEMPLATE_HEADER_LABELS: Record<
  ProcurementTemplateLocale,
  Record<ProcurementImportTemplateColumn, string>
> = {
  vi: {
    product_code: "Mã sản phẩm",
    name: "Tên sản phẩm",
    quantity: "Số lượng",
    rent_price_per_day: "Giá thuê",
    quick_rent_price: "Giá thuê nhanh",
    purchase_price: "Giá nhập",
    sale_price: "Giá bán",
    category_code: "Mã danh mục",
    is_rentable: "Cho thuê",
    is_saleable: "Cho bán",
    material: "Chất liệu",
    gender: "Giới tính",
    description: "Mô tả",
    cover_image_url: "URL ảnh bìa",
    item_size: "Kích cỡ item",
    note: "Ghi chú",
  },
  en: {
    product_code: "Product code",
    name: "Product name",
    quantity: "Quantity",
    rent_price_per_day: "Rent price",
    quick_rent_price: "Quick rent price",
    purchase_price: "Purchase price",
    sale_price: "Sale price",
    category_code: "Category code",
    is_rentable: "Is rentable",
    is_saleable: "Is saleable",
    material: "Material",
    gender: "Gender",
    description: "Description",
    cover_image_url: "Cover image URL",
    item_size: "Item size",
    note: "Note",
  },
};

const TEMPLATE_HEADER_ALIASES: Record<ProcurementImportTemplateColumn, readonly string[]> = {
  product_code: ["product_code", "product code", "ma san pham", "mã sản phẩm"],
  name: ["name", "product name", "ten san pham", "tên sản phẩm"],
  quantity: ["quantity", "so luong", "số lượng"],
  rent_price_per_day: [
    "rent_price_per_day",
    "rent price per day",
    "rent/day",
    "rent price",
    "gia thue",
    "giá thuê",
    "gia thue ngay",
    "giá thuê ngày",
    "gia thue/ngay",
    "giá thuê/ngày",
  ],
  quick_rent_price: [
    "quick_rent_price",
    "quick rent price",
    "gia thue nhanh",
    "giá thuê nhanh",
  ],
  purchase_price: ["purchase_price", "purchase price", "gia nhap", "giá nhập"],
  sale_price: ["sale_price", "sale price", "gia ban", "giá bán"],
  category_code: ["category_code", "category code", "ma danh muc", "mã danh mục"],
  is_rentable: ["is_rentable", "is rentable", "cho thue", "cho thuê"],
  is_saleable: ["is_saleable", "is saleable", "cho ban", "cho bán"],
  material: ["material", "chat lieu", "chất liệu"],
  gender: ["gender", "gioi tinh", "giới tính"],
  description: ["description", "mo ta", "mô tả"],
  cover_image_url: [
    "cover_image_url",
    "cover image url",
    "cover_image",
    "cover image",
    "url anh bia",
    "url ảnh bìa",
  ],
  item_size: ["item_size", "item size", "kich co item", "kích cỡ item"],
  note: ["note", "ghi chu", "ghi chú"],
};

const TEMPLATE_HEADER_ALIAS_TO_COLUMN = new Map<string, ProcurementImportTemplateColumn>();

for (const column of TEMPLATE_COLUMNS) {
  TEMPLATE_HEADER_ALIAS_TO_COLUMN.set(column, column);
  for (const alias of TEMPLATE_HEADER_ALIASES[column]) {
    const normalizedAlias = alias
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (normalizedAlias) {
      TEMPLATE_HEADER_ALIAS_TO_COLUMN.set(normalizedAlias, column);
    }
  }
}

const IMPORT_ERROR_EXPORT_COLUMN = "error_reason";
const DEFAULT_IMPORT_SHEET_NAME = "ProcurementImport";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const PROCUREMENT_ROLLBACK_NOTE_META_PREFIX = "##PROCUREMENT_ROLLBACK_META##";

const PROCUREMENT_RECEIPT_SELECT =
  "id, branch_id, receipt_code, intake_channel, intake_source_file_name, supplier_name, supplier_phone, note, total_quantity, total_cost_amount, payment_expense_amount, payment_method, payment_note, paid_at, created_by, created_at, updated_at";

const PROCUREMENT_RECEIPT_ITEMS_SELECT =
  "id, receipt_id, product_id, product_code_snapshot, product_name_snapshot, quantity, unit_cost_amount, line_total_amount, rent_price_per_day, quick_rent_price, purchase_price, sale_price, category_code_snapshot, is_rentable, is_saleable, material, gender, description, cover_image_url, item_size, note, created_at, updated_at";

type ProcurementDomainErrorCode =
  | "FORBIDDEN_PROCUREMENT_ACCESS"
  | "FORBIDDEN_PROCUREMENT_ROLLBACK"
  | "MISSING_BRANCH_CONTEXT"
  | "FORBIDDEN_BRANCH_SCOPE"
  | "INVALID_DATE_RANGE"
  | "INVALID_INTAKE_CHANNEL"
  | "INVALID_PAYMENT_METHOD"
  | "INVALID_PAYMENT_AMOUNT"
  | "INVALID_LINE_PAYLOAD"
  | "PRODUCT_NOT_FOUND"
  | "RECEIPT_NOT_FOUND"
  | "IMPORT_FILE_EMPTY"
  | "IMPORT_FILE_INVALID"
  | "IMPORT_SHEET_MISSING"
  | "IMPORT_TEMPLATE_INVALID"
  | "IMPORT_VALIDATION_FAILED"
  | "CATEGORY_NOT_FOUND"
  | "PROCUREMENT_RECEIPT_IMMUTABLE"
  | "PROCUREMENT_RECEIPT_ALREADY_ROLLED_BACK"
  | "PROCUREMENT_RECEIPT_ROLLBACK_ITEM_COUNT_MISMATCH"
  | "PROCUREMENT_RECEIPT_ROLLBACK_ITEM_STATUS_BLOCKED"
  | "PROCUREMENT_RECEIPT_ROLLBACK_ITEM_IN_USE";

interface ProcurementDomainErrorContext {
  [key: string]: unknown;
}

export class ProcurementDomainError extends Error {
  readonly code: ProcurementDomainErrorCode;
  readonly context: ProcurementDomainErrorContext;

  constructor(code: ProcurementDomainErrorCode, context: ProcurementDomainErrorContext = {}) {
    super(code);
    this.name = "ProcurementDomainError";
    this.code = code;
    this.context = context;
  }
}

interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}

interface ProfileBranchAccessRow {
  branch_id: string;
}

interface ProfileNameRow {
  id: string;
  full_name: string | null;
}

interface ProcurementReceiptRow {
  id: string;
  branch_id: string;
  receipt_code: string;
  intake_channel: string;
  intake_source_file_name: string | null;
  supplier_name: string | null;
  supplier_phone: string | null;
  note: string | null;
  total_quantity: number | string | null;
  total_cost_amount: number | string | null;
  payment_expense_amount: number | string | null;
  payment_method: string | null;
  payment_note: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ProcurementReceiptItemRow {
  id: string;
  receipt_id: string;
  product_id: string | null;
  product_code_snapshot: string | null;
  product_name_snapshot: string | null;
  quantity: number | string | null;
  unit_cost_amount: number | string | null;
  line_total_amount: number | string | null;
  rent_price_per_day: number | string | null;
  quick_rent_price: number | string | null;
  purchase_price: number | string | null;
  sale_price: number | string | null;
  category_code_snapshot: string | null;
  is_rentable: boolean | null;
  is_saleable: boolean | null;
  material: string | null;
  gender: ProductGender | null;
  description: string | null;
  cover_image_url: string | null;
  item_size: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemRollbackCandidateRow {
  id: string;
  product_id: string;
  item_code: string;
  status: string;
  branch_id: string;
}

interface ItemIntakeStatusLogRow {
  item_id: string;
  reason_note: string | null;
}

interface ProcurementPaymentRow {
  id: string;
  status: string;
  note: string | null;
}

interface ItemReferenceRow {
  item_id: string;
}

interface ItemStatusLogHistoryRow {
  item_id: string;
  to_status: string;
}

interface ProcurementReceiptRollbackNoteMeta {
  at: string;
  by: string;
  reason: string | null;
}

interface ProcurementProductRow {
  id: string;
  branch_id: string | null;
  product_code: string;
  name: string;
  category_id: string | null;
  cover_image_path?: string | null;
  gender: string | null;
  material: string | null;
  description: string | null;
  rent_price_per_day: number | string | null;
  sale_price: number | string | null;
  purchase_price: number | string | null;
  is_rentable: boolean;
  is_saleable: boolean;
  is_active: boolean;
  is_archived: boolean;
}

interface ProductCategoryRow {
  id: string;
  branch_id: string | null;
  code: string;
  name: string;
  sort_order?: number | string | null;
  is_active: boolean;
}

interface ItemCountRow {
  product_id: string;
  status: string;
}

interface InsertedProcurementReceiptRow {
  id: string;
  receipt_code: string;
  branch_id: string;
  created_at: string;
}

interface InsertedItemRow {
  id: string;
  item_code: string;
  status: string;
}

interface ProcurementActorContext {
  actor: ProfileActorRow;
  role: string;
  branchId: string;
}

interface ProcurementImportServerPayload {
  branchId?: string | null;
  fileName: string | null;
  fileBuffer: Uint8Array;
  context?: ProcurementImportContextInput | null;
}

interface ProcurementImportCommitServerPayload extends ProcurementImportServerPayload {
  intakeSourceFileName?: string | null;
  supplierName?: string | null;
  supplierPhone?: string | null;
  note?: string | null;
  expensePayment?: CreateProcurementReceiptPayload["expensePayment"];
}

interface ParsedImportRow {
  sheetName: string;
  rowNumber: number;
  productCode: string | null;
  name: string | null;
  quantity: number | null;
  unitCostAmount: number | null;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
  categoryCode: string | null;
  isRentable: boolean | null;
  isSaleable: boolean | null;
  material: string | null;
  gender: ProductGender | null;
  description: string | null;
  coverImageUrl: string | null;
  itemSize: string | null;
  note: string | null;
}

interface ImportValidationRow {
  parsed: ParsedImportRow;
  resolvedAction: ProcurementImportResolvedAction | null;
  matchedProduct: ProcurementProductRow | null;
  errors: ProcurementImportValidationErrorDto[];
}

interface ImportValidationResult {
  branchId: string;
  sheetName: string;
  rows: ImportValidationRow[];
  normalizedRows: ProcurementImportNormalizedRowDto[];
  errors: ProcurementImportValidationErrorDto[];
}

function globalizeText(value: string): string {
  if (value === null || value === undefined || value === "") return "";

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = globalizeText(value.trim());
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSearchToken(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseNumeric(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function normalizePage(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE;
  return Math.max(1, Math.floor(value));
}

function normalizePageSize(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(value)));
}

function normalizePaymentMethod(value: string | null | undefined): OrderPaymentMethod | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase() as OrderPaymentMethod;
  if (!PAYMENT_METHOD_SET.has(normalized)) return null;
  return normalized;
}

function normalizeIntakeChannel(value: string | null | undefined): ProcurementIntakeChannel | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase() as ProcurementIntakeChannel;
  if (!INTAKE_CHANNEL_SET.has(normalized)) return null;
  return normalized;
}

function normalizeRole(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function assertDateRange(startDate: string | null | undefined, endDate: string | null | undefined): void {
  if (!startDate || !endDate) return;
  if (startDate > endDate) {
    throw new ProcurementDomainError("INVALID_DATE_RANGE", {
      startDate,
      endDate,
    });
  }
}

function buildDateFromBoundary(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function buildDateToBoundary(date: string): string {
  return `${date}T23:59:59.999Z`;
}

function isStockCountedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = status.trim().toUpperCase();
  return STOCK_COUNTED_ITEM_STATUS_SET.has(normalized);
}

function normalizeColumnToken(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveTemplateLocale(value: string | null | undefined): ProcurementTemplateLocale {
  if (typeof value !== "string") return "vi";
  const normalized = value.trim().toLowerCase();
  return normalized === "en" ? "en" : "vi";
}

function resolveTemplateColumnFromHeaderToken(
  token: string
): ProcurementImportTemplateColumn | null {
  return TEMPLATE_HEADER_ALIAS_TO_COLUMN.get(token) ?? null;
}

function parseOptionalNumeric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseNumeric(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseExcelCellText(value: ExcelJS.CellValue | null): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    return sanitizeText(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return sanitizeText(value.text);
    }
    if ("result" in value && (typeof value.result === "string" || typeof value.result === "number")) {
      return sanitizeText(String(value.result));
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      const combined = value.richText
        .map((entry) => (typeof entry?.text === "string" ? entry.text : ""))
        .join("");
      return sanitizeText(combined);
    }
    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return sanitizeText(value.hyperlink);
    }
  }

  return sanitizeText(String(value));
}

function parseRequiredInteger(
  value: string | null
): { value: number | null; errorCode: ProcurementImportErrorCode | null } {
  const text = sanitizeText(value);
  if (!text) {
    return { value: null, errorCode: "REQUIRED" };
  }

  const parsed = Number.parseInt(text.replace(/,/g, ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { value: null, errorCode: "INVALID_INTEGER" };
  }

  return { value: parsed, errorCode: null };
}

function parseRequiredNonNegativeNumber(
  value: string | null
): { value: number | null; errorCode: ProcurementImportErrorCode | null } {
  const text = sanitizeText(value);
  if (!text) {
    return { value: null, errorCode: "REQUIRED" };
  }

  const parsed = Number(text.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, errorCode: "INVALID_NUMBER" };
  }

  return { value: roundMoney(parsed), errorCode: null };
}

function parseOptionalBoolean(
  value: string | null
): { value: boolean | null; errorCode: ProcurementImportErrorCode | null } {
  const text = sanitizeText(value);
  if (!text) {
    return { value: null, errorCode: null };
  }

  const normalized = text.toLowerCase();
  if (["1", "true", "yes", "y", "co", "có"].includes(normalized)) {
    return { value: true, errorCode: null };
  }
  if (["0", "false", "no", "n", "khong", "không"].includes(normalized)) {
    return { value: false, errorCode: null };
  }

  return { value: null, errorCode: "INVALID_BOOLEAN" };
}

function parseOptionalGender(
  value: string | null
): { value: ProductGender | null; errorCode: ProcurementImportErrorCode | null } {
  const text = sanitizeText(value);
  if (!text) {
    return { value: null, errorCode: null };
  }
  const normalized = text.toLowerCase();
  // Map common Vietnamese/short forms to canonical DB values
  if (normalized === 'nam' || normalized === 'm') {
    return { value: 'male', errorCode: null };
  }
  if (normalized === 'nu' || normalized === 'nư' || normalized === 'nữ' || normalized === 'f') {
    return { value: 'female', errorCode: null };
  }
  if (normalized === 'female' || normalized === 'male' || normalized === 'unisex' || normalized === 'other') {
    return { value: normalized as ProductGender, errorCode: null };
  }

  return { value: null, errorCode: 'INVALID_ENUM' };
}

function buildReceiptDateCode(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function sanitizeItemCodeToken(value: string | null | undefined, fallback: string): string {
  const source = sanitizeText(value) ?? fallback;
  return source
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 24) || fallback;
}

function hasReceiptTokenMarker(value: string | null | undefined, receiptToken: string): boolean {
  const normalized = (sanitizeText(value) ?? "").toUpperCase();
  if (!normalized) return false;
  return normalized.includes(`-${receiptToken}-`);
}

interface ProcurementRollbackNoteParseResult {
  cleanNote: string | null;
  rollbackMeta: ProcurementReceiptRollbackNoteMeta | null;
}

function parseProcurementRollbackNote(note: string | null | undefined): ProcurementRollbackNoteParseResult {
  const rawNote = typeof note === "string" ? note : "";
  if (!rawNote) {
    return {
      cleanNote: null,
      rollbackMeta: null,
    };
  }

  const markerIndex = rawNote.lastIndexOf(PROCUREMENT_ROLLBACK_NOTE_META_PREFIX);
  if (markerIndex < 0) {
    return {
      cleanNote: sanitizeText(rawNote),
      rollbackMeta: null,
    };
  }

  const cleanNote = sanitizeText(rawNote.slice(0, markerIndex));
  const rawMeta = rawNote
    .slice(markerIndex + PROCUREMENT_ROLLBACK_NOTE_META_PREFIX.length)
    .trim();

  if (!rawMeta) {
    return {
      cleanNote,
      rollbackMeta: null,
    };
  }

  try {
    const parsed = JSON.parse(rawMeta) as Partial<ProcurementReceiptRollbackNoteMeta>;
    const rolledBackAt = sanitizeText(parsed.at);
    const rolledBackBy = sanitizeText(parsed.by);
    const rollbackReason = sanitizeText(parsed.reason ?? null);

    if (!rolledBackAt || !rolledBackBy) {
      return {
        cleanNote,
        rollbackMeta: null,
      };
    }

    return {
      cleanNote,
      rollbackMeta: {
        at: rolledBackAt,
        by: rolledBackBy,
        reason: rollbackReason,
      },
    };
  } catch {
    return {
      cleanNote,
      rollbackMeta: null,
    };
  }
}

function buildProcurementRollbackNote(
  note: string | null | undefined,
  rollbackMeta: ProcurementReceiptRollbackNoteMeta
): string {
  const parsed = parseProcurementRollbackNote(note);
  const chunks: string[] = [];

  if (parsed.cleanNote) {
    chunks.push(parsed.cleanNote);
  }

  chunks.push(`${PROCUREMENT_ROLLBACK_NOTE_META_PREFIX}${JSON.stringify(rollbackMeta)}`);
  return chunks.join("\n\n");
}

function mapReceiptRowToSummary(
  row: ProcurementReceiptRow,
  createdByNameMap: Map<string, string | null>
): ProcurementReceiptSummaryDto {
  const paymentMethod = normalizePaymentMethod(row.payment_method);
  const intakeChannel = normalizeIntakeChannel(row.intake_channel) ?? "MANUAL";
  const parsedNote = parseProcurementRollbackNote(row.note);

  return {
    id: row.id,
    branchId: row.branch_id,
    receiptCode: row.receipt_code,
    intakeChannel,
    intakeSourceFileName: row.intake_source_file_name,
    supplierName: row.supplier_name,
    supplierPhone: row.supplier_phone,
    note: parsedNote.cleanNote,
    totalQuantity: Math.max(0, Math.floor(parseNumeric(row.total_quantity))),
    totalCostAmount: roundMoney(Math.max(0, parseNumeric(row.total_cost_amount))),
    paymentExpenseAmount: roundMoney(Math.max(0, parseNumeric(row.payment_expense_amount))),
    paymentMethod,
    paymentNote: row.payment_note,
    paidAt: row.paid_at,
    isRolledBack: Boolean(parsedNote.rollbackMeta),
    rolledBackAt: parsedNote.rollbackMeta?.at ?? null,
    rollbackReason: parsedNote.rollbackMeta?.reason ?? null,
    createdBy: row.created_by,
    createdByName: row.created_by ? createdByNameMap.get(row.created_by) ?? null : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReceiptItemRowToDto(row: ProcurementReceiptItemRow): ProcurementReceiptLineDto {
  const gender =
    row.gender === "female" ||
    row.gender === "male" ||
    row.gender === "unisex" ||
    row.gender === "other"
      ? row.gender
      : null;

  return {
    id: row.id,
    receiptId: row.receipt_id,
    productId: row.product_id,
    productCodeSnapshot: row.product_code_snapshot,
    productNameSnapshot: row.product_name_snapshot,
    quantity: Math.max(0, Math.floor(parseNumeric(row.quantity))),
    unitCostAmount: roundMoney(Math.max(0, parseNumeric(row.unit_cost_amount))),
    lineTotalAmount: roundMoney(Math.max(0, parseNumeric(row.line_total_amount))),
    rentPricePerDay:
      row.rent_price_per_day === null
        ? null
        : roundMoney(Math.max(0, parseNumeric(row.rent_price_per_day))),
    quickRentPrice:
      row.quick_rent_price === null
        ? null
        : roundMoney(Math.max(0, parseNumeric(row.quick_rent_price))),
    purchasePrice:
      row.purchase_price === null
        ? null
        : roundMoney(Math.max(0, parseNumeric(row.purchase_price))),
    salePrice:
      row.sale_price === null ? null : roundMoney(Math.max(0, parseNumeric(row.sale_price))),
    categoryCodeSnapshot: row.category_code_snapshot,
    isRentable: row.is_rentable,
    isSaleable: row.is_saleable,
    material: row.material,
    gender,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    itemSize: row.item_size,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategoryRowToOption(row: ProductCategoryRow) {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
  };
}

async function fetchActorProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, default_branch_id")
    .eq("id", profileId)
    .eq("is_active", true)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchActorBranchAccessIds(
  supabase: SupabaseClient,
  actorProfileId: string,
  defaultBranchId: string | null
): Promise<string[]> {
  const { data, error } = await supabase
    .from("profile_branch_access")
    .select("branch_id")
    .eq("profile_id", actorProfileId)
    .eq("is_delete", false)
    .returns<ProfileBranchAccessRow[]>();

  if (error) throw error;

  const allowed = new Set((data ?? []).map((entry) => entry.branch_id));
  if (defaultBranchId) {
    allowed.add(defaultBranchId);
  }

  return Array.from(allowed);
}

function resolveSingleBranchScope(options: {
  actor: ProfileActorRow;
  role: string;
  allowedBranchIds: string[];
  requestedBranchId: string | null;
}): string {
  const requestedBranchId = options.requestedBranchId;

  if (options.role === "staff") {
    const staffBranchId = options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
    if (!staffBranchId) {
      throw new ProcurementDomainError("MISSING_BRANCH_CONTEXT", {
        reason: "staff-without-default-branch",
      });
    }

    if (requestedBranchId && requestedBranchId !== staffBranchId) {
      throw new ProcurementDomainError("FORBIDDEN_BRANCH_SCOPE", {
        requestedBranchId,
        role: options.role,
      });
    }

    return staffBranchId;
  }

  if (requestedBranchId) {
    if (!options.allowedBranchIds.includes(requestedBranchId)) {
      throw new ProcurementDomainError("FORBIDDEN_BRANCH_SCOPE", {
        requestedBranchId,
        role: options.role,
      });
    }

    return requestedBranchId;
  }

  const fallback = options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
  if (!fallback) {
    throw new ProcurementDomainError("MISSING_BRANCH_CONTEXT", {
      role: options.role,
    });
  }

  return fallback;
}

async function resolveProcurementActorContext(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    requestedBranchId: string | null;
  }
): Promise<ProcurementActorContext> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new ProcurementDomainError("FORBIDDEN_PROCUREMENT_ACCESS", {
      reason: "missing-profile",
    });
  }

  const role = normalizeRole(actor.role);
  if (!role || !PROCUREMENT_ROLE_SET.has(role)) {
    throw new ProcurementDomainError("FORBIDDEN_PROCUREMENT_ACCESS", {
      role,
    });
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id
  );

  const branchId = resolveSingleBranchScope({
    actor,
    role,
    allowedBranchIds,
    requestedBranchId: options.requestedBranchId,
  });

  return {
    actor,
    role,
    branchId,
  };
}

function assertProcurementRollbackRole(role: string): void {
  if (PROCUREMENT_ROLLBACK_ROLE_SET.has(role)) return;

  throw new ProcurementDomainError("FORBIDDEN_PROCUREMENT_ROLLBACK", {
    role,
  });
}

async function fetchProfileNamesByIds(
  supabase: SupabaseClient,
  profileIds: string[]
): Promise<Map<string, string | null>> {
  const normalizedIds = Array.from(new Set(profileIds.filter(Boolean)));
  if (normalizedIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", normalizedIds)
    .returns<ProfileNameRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, sanitizeText(row.full_name)]));
}

async function generateReceiptCode(
  supabase: SupabaseClient,
  branchId: string
): Promise<string> {
  const now = new Date();
  const dateCode = buildReceiptDateCode(now);

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

async function fetchProductsByIds(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<Map<string, ProcurementProductRow>> {
  if (productIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, branch_id, product_code, name, category_id, gender, material, description, rent_price_per_day, sale_price, purchase_price, is_rentable, is_saleable, is_active, is_archived"
    )
    .in("id", productIds)
    .returns<ProcurementProductRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

async function fetchProductsByCodes(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    productCodes: string[];
  }
): Promise<Map<string, ProcurementProductRow>> {
  const normalizedCodes = Array.from(
    new Set(
      options.productCodes
        .map((code) => sanitizeText(code))
        .filter((code): code is string => Boolean(code))
    )
  );

  if (normalizedCodes.length === 0) return new Map();

  const expandedCodes = Array.from(
    new Set(
      normalizedCodes.flatMap((code) => [code, code.toLowerCase(), code.toUpperCase()])
    )
  );

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, branch_id, product_code, name, category_id, gender, material, description, rent_price_per_day, sale_price, purchase_price, is_rentable, is_saleable, is_active, is_archived"
    )
    .eq("branch_id", options.branchId)
    .in("product_code", expandedCodes)
    .returns<ProcurementProductRow[]>();

  if (error) throw error;

  const byCodeLower = new Map<string, ProcurementProductRow>();
  for (const row of data ?? []) {
    byCodeLower.set(row.product_code.toLowerCase(), row);
  }

  return byCodeLower;
}

async function fetchCategoryByCodeMap(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    categoryCodes: string[];
  }
): Promise<Map<string, ProductCategoryRow>> {
  const normalizedCodes = Array.from(
    new Set(
      options.categoryCodes
        .map((code) => sanitizeText(code))
        .filter((code): code is string => Boolean(code))
    )
  );

  if (normalizedCodes.length === 0) return new Map();

  const expandedCodes = Array.from(
    new Set(
      normalizedCodes.flatMap((code) => [code, code.toLowerCase(), code.toUpperCase()])
    )
  );

  const { data, error } = await supabase
    .from("product_categories")
    .select("id, branch_id, code, name, is_active")
    .eq("is_active", true)
    .in("code", expandedCodes)
    .or(`branch_id.is.null,branch_id.eq.${options.branchId}`)
    .returns<ProductCategoryRow[]>();

  if (error) throw error;

  const map = new Map<string, ProductCategoryRow>();
  for (const row of data ?? []) {
    const key = row.code.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      continue;
    }

    // Branch-specific category takes precedence over global.
    if (existing.branch_id === null && row.branch_id === options.branchId) {
      map.set(key, row);
    }
  }

  return map;
}

async function generateUniqueProductCode(
  supabase: SupabaseClient,
  branchId: string
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const nowToken = Date.now().toString(36).toUpperCase();
    const randomToken = Math.random().toString(36).slice(2, 6).toUpperCase();
    const generated = `AUTO-${nowToken}-${randomToken}`;

    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("branch_id", branchId)
      .eq("product_code", generated)
      .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) {
      return generated;
    }
  }

  throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
    reason: "cannot-generate-unique-product-code",
  });
}

async function fetchProductStockCounts(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("items")
    .select("product_id, status")
    .in("product_id", productIds)
    .returns<ItemCountRow[]>();

  if (error) throw error;

  const byProductId = new Map<string, number>();
  for (const row of data ?? []) {
    if (!isStockCountedStatus(row.status)) continue;
    byProductId.set(row.product_id, (byProductId.get(row.product_id) ?? 0) + 1);
  }

  return byProductId;
}

async function getReceiptById(
  supabase: SupabaseClient,
  receiptId: string
): Promise<ProcurementReceiptRow | null> {
  const { data, error } = await supabase
    .from("procurement_receipts")
    .select(PROCUREMENT_RECEIPT_SELECT)
    .eq("id", receiptId)
    .maybeSingle<ProcurementReceiptRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchReceiptItems(
  supabase: SupabaseClient,
  receiptId: string
): Promise<ProcurementReceiptItemRow[]> {
  const { data, error } = await supabase
    .from("procurement_receipt_items")
    .select(PROCUREMENT_RECEIPT_ITEMS_SELECT)
    .eq("receipt_id", receiptId)
    .order("created_at", { ascending: true })
    .returns<ProcurementReceiptItemRow[]>();

  if (error) throw error;
  return data ?? [];
}

function buildExpectedRollbackCountByProduct(
  receiptItems: ProcurementReceiptItemRow[]
): Map<string, number> {
  const expectedByProduct = new Map<string, number>();

  for (const line of receiptItems) {
    if (!line.product_id) continue;
    const quantity = Math.max(0, Math.floor(parseNumeric(line.quantity)));
    if (quantity <= 0) continue;
    expectedByProduct.set(
      line.product_id,
      (expectedByProduct.get(line.product_id) ?? 0) + quantity
    );
  }

  return expectedByProduct;
}

async function fetchRollbackItemCandidates(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    receiptCode: string;
    receiptItems: ProcurementReceiptItemRow[];
  }
): Promise<ItemRollbackCandidateRow[]> {
  const productIds = Array.from(
    new Set(
      options.receiptItems
        .map((row) => row.product_id)
        .filter((productId): productId is string => Boolean(productId))
    )
  );
  if (productIds.length === 0) return [];

  const receiptToken = sanitizeItemCodeToken(options.receiptCode, "PROC");
  const likeToken = `%${receiptToken}%`;

  const [statusLogsResult, itemsByCodeResult] = await Promise.all([
    supabase
      .from("item_status_logs")
      .select("item_id, reason_note")
      .eq("reason_code", "PROCUREMENT_INTAKE_CREATE")
      .ilike("reason_note", likeToken)
      .returns<ItemIntakeStatusLogRow[]>(),
    supabase
      .from("items")
      .select("id, product_id, item_code, status, branch_id")
      .eq("branch_id", options.branchId)
      .in("product_id", productIds)
      .ilike("item_code", likeToken)
      .returns<ItemRollbackCandidateRow[]>(),
  ]);

  if (statusLogsResult.error) throw statusLogsResult.error;
  if (itemsByCodeResult.error) throw itemsByCodeResult.error;

  const candidatesByCode = (itemsByCodeResult.data ?? []).filter((row) =>
    hasReceiptTokenMarker(row.item_code, receiptToken)
  );

  const itemIdsFromLogs = uniqueStringValues(
    (statusLogsResult.data ?? [])
      .filter((row) => hasReceiptTokenMarker(row.reason_note, receiptToken))
      .map((row) => row.item_id)
  );

  if (itemIdsFromLogs.length === 0) {
    return candidatesByCode;
  }

  const { data: itemsByLogs, error: itemsByLogsError } = await supabase
    .from("items")
    .select("id, product_id, item_code, status, branch_id")
    .eq("branch_id", options.branchId)
    .in("product_id", productIds)
    .in("id", itemIdsFromLogs)
    .returns<ItemRollbackCandidateRow[]>();

  if (itemsByLogsError) throw itemsByLogsError;

  if (!itemsByLogs || itemsByLogs.length === 0) {
    return candidatesByCode;
  }

  const mergedCandidates = new Map<string, ItemRollbackCandidateRow>();
  for (const row of candidatesByCode) {
    mergedCandidates.set(row.id, row);
  }
  for (const row of itemsByLogs) {
    mergedCandidates.set(row.id, row);
  }

  return Array.from(mergedCandidates.values());
}

function assertRollbackItemCountMatches(
  options: {
    receiptId: string;
    receiptCode: string;
    receiptItems: ProcurementReceiptItemRow[];
    itemCandidates: ItemRollbackCandidateRow[];
  }
): void {
  const expectedByProduct = buildExpectedRollbackCountByProduct(options.receiptItems);
  const actualByProduct = new Map<string, number>();

  for (const row of options.itemCandidates) {
    actualByProduct.set(row.product_id, (actualByProduct.get(row.product_id) ?? 0) + 1);
  }

  const mismatchedProducts: Array<{
    productId: string;
    expected: number;
    actual: number;
  }> = [];

  for (const [productId, expected] of expectedByProduct.entries()) {
    const actual = actualByProduct.get(productId) ?? 0;
    if (expected !== actual) {
      mismatchedProducts.push({ productId, expected, actual });
    }
  }

  const totalExpected = Array.from(expectedByProduct.values()).reduce((sum, value) => sum + value, 0);
  const allowMissingAllItems = totalExpected > 0 && options.itemCandidates.length === 0;
  if (
    !allowMissingAllItems &&
    (mismatchedProducts.length > 0 || totalExpected !== options.itemCandidates.length)
  ) {
    throw new ProcurementDomainError("PROCUREMENT_RECEIPT_ROLLBACK_ITEM_COUNT_MISMATCH", {
      receiptId: options.receiptId,
      receiptCode: options.receiptCode,
      totalExpected,
      totalActual: options.itemCandidates.length,
      mismatchedProducts,
    });
  }
}

function assertRollbackItemStatuses(itemCandidates: ItemRollbackCandidateRow[]): void {
  const blockedItems = itemCandidates
    .filter((row) =>
      PROCUREMENT_ROLLBACK_BLOCKED_ITEM_STATUS_SET.has(row.status.trim().toUpperCase())
    )
    .slice(0, 12)
    .map((row) => ({
      itemId: row.id,
      itemCode: row.item_code,
      status: row.status,
    }));

  if (blockedItems.length > 0) {
    throw new ProcurementDomainError("PROCUREMENT_RECEIPT_ROLLBACK_ITEM_STATUS_BLOCKED", {
      blockedItems,
    });
  }
}

async function fetchRollbackItemReferences(
  supabase: SupabaseClient,
  itemIds: string[]
): Promise<ItemReferenceRow[]> {
  if (itemIds.length === 0) return [];

  const [rentalRowsResult, reservationRowsResult, maintenanceRowsResult, incidentRowsResult] =
    await Promise.all([
      supabase
        .from("rental_order_items")
        .select("item_id")
        .in("item_id", itemIds)
        .returns<ItemReferenceRow[]>(),
      supabase
        .from("reservation_windows")
        .select("item_id")
        .in("item_id", itemIds)
        .returns<ItemReferenceRow[]>(),
      supabase
        .from("maintenance_tasks")
        .select("item_id")
        .in("item_id", itemIds)
        .returns<ItemReferenceRow[]>(),
      supabase
        .from("incidents")
        .select("item_id")
        .in("item_id", itemIds)
        .returns<ItemReferenceRow[]>(),
    ]);

  if (rentalRowsResult.error) throw rentalRowsResult.error;
  if (reservationRowsResult.error) throw reservationRowsResult.error;
  if (maintenanceRowsResult.error) throw maintenanceRowsResult.error;
  if (incidentRowsResult.error) throw incidentRowsResult.error;

  const uniqueItemIds = new Set<string>();
  for (const row of rentalRowsResult.data ?? []) {
    uniqueItemIds.add(row.item_id);
  }
  for (const row of reservationRowsResult.data ?? []) {
    uniqueItemIds.add(row.item_id);
  }
  for (const row of maintenanceRowsResult.data ?? []) {
    uniqueItemIds.add(row.item_id);
  }
  for (const row of incidentRowsResult.data ?? []) {
    uniqueItemIds.add(row.item_id);
  }

  return Array.from(uniqueItemIds).map((itemId) => ({ item_id: itemId }));
}

async function fetchRollbackItemHistoryByStatuses(
  supabase: SupabaseClient,
  itemIds: string[],
  statuses: string[]
): Promise<ItemStatusLogHistoryRow[]> {
  if (itemIds.length === 0 || statuses.length === 0) return [];

  const { data, error } = await supabase
    .from("item_status_logs")
    .select("item_id, to_status")
    .in("item_id", itemIds)
    .in("to_status", statuses)
    .returns<ItemStatusLogHistoryRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchProcurementPaymentsByReceiptId(
  supabase: SupabaseClient,
  receiptId: string
): Promise<ProcurementPaymentRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, status, note")
    .eq("procurement_receipt_id", receiptId)
    .returns<ProcurementPaymentRow[]>();

  if (error) throw error;
  return data ?? [];
}

function buildProcurementIntakeItemInsertRows(options: {
  actorProfileId: string;
  branchId: string;
  receiptCode: string;
  lines: Array<{
    productId: string;
    productCode: string;
    quantity: number;
    itemSize: string | null;
  }>;
}): Array<{
  branch_id: string;
  product_id: string;
  item_code: string;
  size: string | null;
  status: string;
  created_by: string;
  updated_by: string;
}> {
  const receiptToken = sanitizeItemCodeToken(options.receiptCode, "PROC");
  const runningIndexByProductToken = new Map<string, number>();

  const itemInsertRows: Array<{
    branch_id: string;
    product_id: string;
    item_code: string;
    size: string | null;
    status: string;
    created_by: string;
    updated_by: string;
  }> = [];

  for (const line of options.lines) {
    const productToken = sanitizeItemCodeToken(line.productCode, "ITEM");

    for (let index = 0; index < line.quantity; index += 1) {
      const sequenceKey = productToken;
      const current = (runningIndexByProductToken.get(sequenceKey) ?? 0) + 1;
      runningIndexByProductToken.set(sequenceKey, current);
      const itemCode = `${productToken}-${receiptToken}-${String(current).padStart(3, "0")}`;

      itemInsertRows.push({
        branch_id: options.branchId,
        product_id: line.productId,
        item_code: itemCode,
        size: line.itemSize,
        status: "READY",
        created_by: options.actorProfileId,
        updated_by: options.actorProfileId,
      });
    }
  }

  return itemInsertRows;
}

async function assertProcurementItemCodesAvailable(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    itemInsertRows: Array<{
      item_code: string;
    }>;
  }
): Promise<void> {
  const itemCodes = Array.from(new Set(options.itemInsertRows.map((row) => row.item_code)));
  if (itemCodes.length === 0) return;

  const { data, error } = await supabase
    .from("items")
    .select("item_code")
    .eq("branch_id", options.branchId)
    .in("item_code", itemCodes)
    .returns<Array<{ item_code: string }>>();

  if (error) throw error;

  const conflicts = (data ?? [])
    .map((row) => sanitizeText(row.item_code))
    .filter((value): value is string => Boolean(value));

  if (conflicts.length > 0) {
    throw new Error(`Duplicate generated item code: ${conflicts[0]}`);
  }
}

async function deleteCreatedProductsBestEffort(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<void> {
  const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueProductIds.length === 0) return;

  await supabase.from("products").delete().in("id", uniqueProductIds);
}

async function cleanupFailedProcurementReceiptDraft(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    receiptId: string;
    receiptCode: string;
    createdProductIds: string[];
  }
): Promise<void> {
  const receiptToken = sanitizeItemCodeToken(options.receiptCode, "PROC");
  const likeToken = `%${receiptToken}%`;

  const { data: intakeItems } = await supabase
    .from("items")
    .select("id, item_code")
    .eq("branch_id", options.branchId)
    .ilike("item_code", likeToken)
    .returns<Array<{ id: string; item_code: string }>>();

  const itemIds = (intakeItems ?? [])
    .filter((row) => hasReceiptTokenMarker(row.item_code, receiptToken))
    .map((row) => row.id);

  if (itemIds.length > 0) {
    await supabase
      .from("item_status_logs")
      .delete()
      .eq("reason_code", "PROCUREMENT_INTAKE_CREATE")
      .in("item_id", itemIds);
    await supabase.from("items").delete().in("id", itemIds);
  }

  await supabase.from("payments").delete().eq("procurement_receipt_id", options.receiptId);
  await supabase.from("procurement_receipt_items").delete().eq("receipt_id", options.receiptId);
  await supabase.from("procurement_receipts").delete().eq("id", options.receiptId);
  await deleteCreatedProductsBestEffort(supabase, options.createdProductIds);
}

async function insertProcurementItemsAndLogs(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId: string;
    receiptCode: string;
    lines: Array<{
      productId: string;
      productCode: string;
      quantity: number;
      itemSize: string | null;
    }>;
  }
): Promise<void> {
  const itemInsertRows = buildProcurementIntakeItemInsertRows({
    actorProfileId: options.actorProfileId,
    branchId: options.branchId,
    receiptCode: options.receiptCode,
    lines: options.lines,
  });

  if (itemInsertRows.length === 0) return;

  const { data: insertedItems, error: itemInsertError } = await supabase
    .from("items")
    .insert(itemInsertRows)
    .select("id, item_code, status")
    .returns<InsertedItemRow[]>();

  if (itemInsertError) throw itemInsertError;

  const statusLogRows = (insertedItems ?? []).map((row) => ({
    branch_id: options.branchId,
    item_id: row.id,
    from_status: null,
    to_status: row.status,
    reason_code: "PROCUREMENT_INTAKE_CREATE",
    reason_note: `Initial intake for ${row.item_code}`,
    actor_profile_id: options.actorProfileId,
  }));

  if (statusLogRows.length > 0) {
    const { error: statusLogError } = await supabase
      .from("item_status_logs")
      .insert(statusLogRows);
    if (statusLogError) throw statusLogError;
  }
}

async function updateProductPurchasePriceByWeightedAverage(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    productsById: Map<string, ProcurementProductRow>;
    currentStockByProductId: Map<string, number>;
    intakeRows: Array<{
      productId: string;
      quantity: number;
      lineTotalAmount: number;
    }>;
  }
): Promise<void> {
  const intakeByProduct = new Map<string, { quantity: number; totalCost: number }>();

  for (const row of options.intakeRows) {
    const current = intakeByProduct.get(row.productId) ?? { quantity: 0, totalCost: 0 };
    current.quantity += row.quantity;
    current.totalCost = roundMoney(current.totalCost + row.lineTotalAmount);
    intakeByProduct.set(row.productId, current);
  }

  for (const [productId, intake] of intakeByProduct.entries()) {
    const product = options.productsById.get(productId);
    if (!product) continue;

    const currentStock = options.currentStockByProductId.get(productId) ?? 0;
    const oldPurchasePrice = roundMoney(Math.max(0, parseNumeric(product.purchase_price)));

    const nextQuantity = currentStock + intake.quantity;
    const nextPurchasePrice =
      nextQuantity <= 0
        ? oldPurchasePrice
        : roundMoney((oldPurchasePrice * currentStock + intake.totalCost) / nextQuantity);

    const { error: updateError } = await supabase
      .from("products")
      .update({
        purchase_price: nextPurchasePrice,
        updated_by: options.actorProfileId,
      })
      .eq("id", productId);

    if (updateError) throw updateError;
  }
}

function createImportValidationError(
  row: ParsedImportRow,
  column: ProcurementImportTemplateColumn | "sheet" | "unknown",
  code: ProcurementImportErrorCode,
  message: string
): ProcurementImportValidationErrorDto {
  return {
    sheetName: row.sheetName,
    rowNumber: row.rowNumber,
    column,
    code,
    message,
  };
}

async function parseImportRowsFromWorkbook(
  payload: ProcurementImportServerPayload
): Promise<{
  sheetName: string;
  rows: ParsedImportRow[];
  errors: ProcurementImportValidationErrorDto[];
}> {
  if (!payload.fileBuffer || payload.fileBuffer.length === 0) {
    throw new ProcurementDomainError("IMPORT_FILE_EMPTY", {
      reason: "empty-file",
    });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await (
      workbook.xlsx as unknown as { load: (input: unknown) => Promise<unknown> }
    ).load(payload.fileBuffer);
  } catch (error) {
    throw new ProcurementDomainError("IMPORT_FILE_INVALID", {
      reason: "invalid-xlsx",
      detail: error instanceof Error ? error.message : "parse-failed",
    });
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new ProcurementDomainError("IMPORT_SHEET_MISSING", {
      reason: "missing-worksheet",
    });
  }

  const sheetName = sanitizeText(worksheet.name) ?? DEFAULT_IMPORT_SHEET_NAME;
  const headerRow = worksheet.getRow(1);
  const headerMap = new Map<ProcurementImportTemplateColumn, number>();

  for (let columnIndex = 1; columnIndex <= headerRow.cellCount; columnIndex += 1) {
    const token = normalizeColumnToken(
      parseExcelCellText(headerRow.getCell(columnIndex).value ?? null)
    );
    const resolvedColumn = resolveTemplateColumnFromHeaderToken(token);
    if (!resolvedColumn) continue;
    if (!headerMap.has(resolvedColumn)) {
      headerMap.set(resolvedColumn, columnIndex);
    }
  }

  const errors: ProcurementImportValidationErrorDto[] = [];
  const missingColumns = Array.from(TEMPLATE_REQUIRED_COLUMNS).filter(
    (column) => !headerMap.has(column)
  );

  if (missingColumns.length > 0) {
    const headerStub: ParsedImportRow = {
      sheetName,
      rowNumber: 1,
      productCode: null,
      name: null,
      quantity: null,
      unitCostAmount: null,
      rentPricePerDay: null,
      quickRentPrice: null,
      purchasePrice: null,
      salePrice: null,
      categoryCode: null,
      isRentable: null,
      isSaleable: null,
      material: null,
      gender: null,
      description: null,
      coverImageUrl: null,
      itemSize: null,
      note: null,
    };

    for (const missingColumn of missingColumns) {
      errors.push(
        createImportValidationError(
          headerStub,
          missingColumn,
          "REQUIRED",
          `Thiếu cột bắt buộc: ${missingColumn}.`
        )
      );
    }

    return {
      sheetName,
      rows: [],
      errors,
    };
  }

  const rows: ParsedImportRow[] = [];

  const readColumn = (row: ExcelJS.Row, column: ProcurementImportTemplateColumn): string | null => {
    const columnIndex = headerMap.get(column);
    if (!columnIndex) return null;
    return parseExcelCellText(row.getCell(columnIndex).value ?? null);
  };

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const productCodeRaw = readColumn(row, "product_code");
    const nameRaw = readColumn(row, "name");
    const quantityRaw = readColumn(row, "quantity");
    const rentPricePerDayRaw = readColumn(row, "rent_price_per_day");
    const quickRentPriceRaw = readColumn(row, "quick_rent_price");
    const purchasePriceRaw = readColumn(row, "purchase_price");
    const salePriceRaw = readColumn(row, "sale_price");
    const categoryCodeRaw = readColumn(row, "category_code");
    const isRentableRaw = readColumn(row, "is_rentable");
    const isSaleableRaw = readColumn(row, "is_saleable");
    const materialRaw = readColumn(row, "material");
    const genderRaw = readColumn(row, "gender");
    const descriptionRaw = readColumn(row, "description");
    const coverImageUrlRaw = readColumn(row, "cover_image_url");
    const itemSizeRaw = readColumn(row, "item_size");
    const noteRaw = readColumn(row, "note");

    const allEmpty =
      !sanitizeText(productCodeRaw) &&
      !sanitizeText(nameRaw) &&
      !sanitizeText(quantityRaw) &&
      !sanitizeText(rentPricePerDayRaw) &&
      !sanitizeText(quickRentPriceRaw) &&
      !sanitizeText(purchasePriceRaw) &&
      !sanitizeText(salePriceRaw) &&
      !sanitizeText(categoryCodeRaw) &&
      !sanitizeText(isRentableRaw) &&
      !sanitizeText(isSaleableRaw) &&
      !sanitizeText(materialRaw) &&
      !sanitizeText(genderRaw) &&
      !sanitizeText(descriptionRaw) &&
      !sanitizeText(coverImageUrlRaw) &&
      !sanitizeText(itemSizeRaw) &&
      !sanitizeText(noteRaw);

    if (allEmpty) {
      continue;
    }

    const parsedRow: ParsedImportRow = {
      sheetName,
      rowNumber,
      productCode: sanitizeText(productCodeRaw),
      name: sanitizeText(nameRaw),
      quantity: null,
      unitCostAmount: null,
      rentPricePerDay: null,
      quickRentPrice: null,
      purchasePrice: null,
      salePrice: null,
      categoryCode: sanitizeText(categoryCodeRaw),
      isRentable: null,
      isSaleable: null,
      material: sanitizeText(materialRaw),
      gender: null,
      description: sanitizeText(descriptionRaw),
      coverImageUrl: sanitizeText(coverImageUrlRaw),
      itemSize: sanitizeText(itemSizeRaw),
      note: sanitizeText(noteRaw),
    };

    const quantityResult = parseRequiredInteger(quantityRaw);
    if (quantityResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          "quantity",
          quantityResult.errorCode,
          quantityResult.errorCode === "REQUIRED"
            ? "Thiếu số lượng."
            : "Số lượng phải là số nguyên dương."
        )
      );
    } else {
      parsedRow.quantity = quantityResult.value;
    }

    const rentPricePerDayResult = parseRequiredNonNegativeNumber(rentPricePerDayRaw);
    if (rentPricePerDayResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          "rent_price_per_day",
          rentPricePerDayResult.errorCode,
          rentPricePerDayResult.errorCode === "REQUIRED"
            ? "Thiếu giá thuê."
            : "Giá thuê phải >= 0."
        )
      );
    } else {
      parsedRow.rentPricePerDay = rentPricePerDayResult.value;
    }

    const quickRentPriceText = sanitizeText(quickRentPriceRaw);
    if (quickRentPriceText) {
      const quickRentPriceResult = parseRequiredNonNegativeNumber(
        quickRentPriceRaw
      );
      if (quickRentPriceResult.errorCode) {
        errors.push(
          createImportValidationError(
            parsedRow,
            "quick_rent_price",
            quickRentPriceResult.errorCode,
            "Giá thuê nhanh phải >= 0."
          )
        );
      } else {
        parsedRow.quickRentPrice = quickRentPriceResult.value;
      }
    }

    const purchasePriceResult = parseRequiredNonNegativeNumber(purchasePriceRaw);
    if (purchasePriceResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          "purchase_price",
          purchasePriceResult.errorCode,
          purchasePriceResult.errorCode === "REQUIRED"
            ? "Thiếu giá nhập."
            : "Giá nhập phải >= 0."
        )
      );
    } else {
      parsedRow.purchasePrice = purchasePriceResult.value;
      parsedRow.unitCostAmount = purchasePriceResult.value;
    }

    const salePriceResult = parseRequiredNonNegativeNumber(salePriceRaw);
    if (salePriceResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          "sale_price",
          salePriceResult.errorCode,
          salePriceResult.errorCode === "REQUIRED"
            ? "Thiếu giá bán."
            : "Giá bán phải >= 0."
        )
      );
    } else {
      parsedRow.salePrice = salePriceResult.value;
    }

    const isRentableResult = parseOptionalBoolean(isRentableRaw);
    if (isRentableResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          "is_rentable",
          isRentableResult.errorCode,
          "is_rentable chỉ nhận true/false hoặc 1/0."
        )
      );
    } else {
      parsedRow.isRentable = isRentableResult.value;
    }

    const isSaleableResult = parseOptionalBoolean(isSaleableRaw);
    if (isSaleableResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          "is_saleable",
          isSaleableResult.errorCode,
          "is_saleable chỉ nhận true/false hoặc 1/0."
        )
      );
    } else {
      parsedRow.isSaleable = isSaleableResult.value;
    }

    const genderResult = parseOptionalGender(genderRaw);
    if (genderResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          "gender",
          genderResult.errorCode,
          "gender chỉ nhận female/male/unisex/nam/nu/other."
        )
      );
    } else {
      parsedRow.gender = genderResult.value;
    }

    rows.push(parsedRow);
  }

  return {
    sheetName,
    rows,
    errors,
  };
}

function buildRowErrorMap(
  errors: ProcurementImportValidationErrorDto[]
): Map<string, ProcurementImportValidationErrorDto[]> {
  const map = new Map<string, ProcurementImportValidationErrorDto[]>();
  for (const error of errors) {
    const key = `${error.sheetName}::${error.rowNumber}`;
    const current = map.get(key);
    if (current) {
      current.push(error);
    } else {
      map.set(key, [error]);
    }
  }
  return map;
}

async function buildImportValidation(
  supabase: SupabaseClient,
  options: {
    context: ProcurementActorContext;
    payload: ProcurementImportServerPayload;
  }
): Promise<ImportValidationResult> {
  const parsedWorkbook = await parseImportRowsFromWorkbook(options.payload);
  const errors = [...parsedWorkbook.errors];
  const rowErrorMap = buildRowErrorMap(errors);

  const rows = parsedWorkbook.rows;
  const defaultCategoryCode = sanitizeText(options.payload.context?.defaultCategoryCode);
  const defaultIsRentable =
    typeof options.payload.context?.defaultIsRentable === "boolean"
      ? options.payload.context.defaultIsRentable
      : null;
  const defaultIsSaleable =
    typeof options.payload.context?.defaultIsSaleable === "boolean"
      ? options.payload.context.defaultIsSaleable
      : null;

  const candidateProductCodes = rows
    .map((row) => row.productCode)
    .filter((value): value is string => Boolean(value));
  const productByCodeLower = await fetchProductsByCodes(supabase, {
    branchId: options.context.branchId,
    productCodes: candidateProductCodes,
  });

  const candidateCategoryCodes = rows
    .map((row) => row.categoryCode ?? defaultCategoryCode)
    .filter((value): value is string => Boolean(value));
  const categoryByCodeLower = await fetchCategoryByCodeMap(supabase, {
    branchId: options.context.branchId,
    categoryCodes: candidateCategoryCodes,
  });

  const validationRows: ImportValidationRow[] = [];
  const normalizedRows: ProcurementImportNormalizedRowDto[] = [];

  for (const row of rows) {
    const rowKey = `${row.sheetName}::${row.rowNumber}`;
    const rowErrors = [...(rowErrorMap.get(rowKey) ?? [])];
    const productCodeLower = row.productCode?.toLowerCase() ?? null;
    const matchedProduct = productCodeLower ? productByCodeLower.get(productCodeLower) ?? null : null;
    const resolvedAction: ProcurementImportResolvedAction =
      matchedProduct ? "UPDATE_EXISTING" : "CREATE_NEW";

    if (resolvedAction === "CREATE_NEW" && !row.name) {
      rowErrors.push(
        createImportValidationError(row, "name", "REQUIRED", "Thiếu tên sản phẩm cho mã mới.")
      );
    }

    const effectiveCategoryCode = row.categoryCode ?? defaultCategoryCode;
    if (effectiveCategoryCode && !categoryByCodeLower.has(effectiveCategoryCode.toLowerCase())) {
      rowErrors.push(
        createImportValidationError(
          row,
          "category_code",
          "NOT_FOUND",
          `Không tìm thấy category_code: ${effectiveCategoryCode}.`
        )
      );
    }

    if (matchedProduct && (!matchedProduct.is_active || matchedProduct.is_archived)) {
      rowErrors.push(
        createImportValidationError(
          row,
          "product_code",
          "INVALID_VALUE",
          `Sản phẩm ${matchedProduct.product_code} đang không khả dụng để cập nhật.`
        )
      );
    }

    if (rowErrors.length > 0) {
      rowErrorMap.set(rowKey, rowErrors);
    }

    validationRows.push({
      parsed: row,
      resolvedAction,
      matchedProduct,
      errors: rowErrors,
    });

    if (
      rowErrors.length > 0 ||
      !row.quantity ||
      row.unitCostAmount === null ||
      row.rentPricePerDay === null ||
      row.purchasePrice === null ||
      row.salePrice === null
    ) {
      continue;
    }

    normalizedRows.push({
      sheetName: row.sheetName,
      rowNumber: row.rowNumber,
      resolvedAction,
      productId: matchedProduct?.id ?? null,
      productCode: matchedProduct?.product_code ?? row.productCode ?? null,
      willGenerateProductCode: resolvedAction === "CREATE_NEW" && !row.productCode,
      productName: matchedProduct?.name ?? row.name ?? null,
      quantity: row.quantity,
      unitCostAmount: row.unitCostAmount,
      rentPricePerDay: row.rentPricePerDay,
      quickRentPrice: row.quickRentPrice,
      purchasePrice: row.purchasePrice,
      salePrice: row.salePrice,
      categoryCode: effectiveCategoryCode,
      isRentable: row.isRentable ?? defaultIsRentable,
      isSaleable: row.isSaleable ?? defaultIsSaleable,
      material: row.material,
      gender: row.gender,
      description: row.description,
      coverImageUrl: row.coverImageUrl,
      itemSize: row.itemSize,
      note: row.note,
      lineTotalAmount: roundMoney(row.quantity * row.unitCostAmount),
    });
  }

  const normalizedErrors = Array.from(rowErrorMap.values()).flat();

  return {
    branchId: options.context.branchId,
    sheetName: parsedWorkbook.sheetName,
    rows: validationRows,
    normalizedRows,
    errors: normalizedErrors,
  };
}

async function buildTemplateWorkbookBuffer(
  locale: ProcurementTemplateLocale
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(
    locale === "vi" ? "NhapHangMau" : DEFAULT_IMPORT_SHEET_NAME
  );
  const header = TEMPLATE_COLUMNS.map((column) => TEMPLATE_HEADER_LABELS[locale][column]);
  sheet.addRow(header);
  if (locale === "vi") {
    sheet.addRow([
      "SP001",
      "Áo dài lụa",
      2,
      120000,
      120000,
      350000,
      890000,
      "",
      "true",
      "true",
      "Lụa",
      "female",
      "Lô nhập mới",
      "https://images.example.com/sp001.jpg",
      "M",
      "Nhập lô đầu tiên",
    ]);
    sheet.addRow([
      "",
      "Vest nam đen",
      1,
      150000,
      150000,
      420000,
      990000,
      "",
      "true",
      "true",
      "Polyester",
      "male",
      "",
      "",
      "L",
      "Không có mã, hệ thống tự tạo",
    ]);
  } else {
    sheet.addRow([
      "SP001",
      "Silk ao dai",
      2,
      120000,
      120000,
      350000,
      890000,
      "",
      "true",
      "true",
      "Silk",
      "female",
      "New intake lot",
      "https://images.example.com/sp001.jpg",
      "M",
      "First procurement lot",
    ]);
    sheet.addRow([
      "",
      "Black men suit",
      1,
      150000,
      150000,
      420000,
      990000,
      "",
      "true",
      "true",
      "Polyester",
      "male",
      "",
      "",
      "L",
      "No product code, system will generate one",
    ]);
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];
  for (let index = 0; index < header.length; index += 1) {
    sheet.getColumn(index + 1).width = 18;
  }
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const bytes = await workbook.xlsx.writeBuffer();
  return new Uint8Array(bytes);
}

async function buildIncompleteWorkbookBuffer(
  payload: ProcurementImportIncompleteExportPayload
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("IncompleteRows");
  sheet.addRow([...TEMPLATE_COLUMNS, IMPORT_ERROR_EXPORT_COLUMN]);

  for (const row of payload.rows) {
    sheet.addRow([
      row.generatedProductCode ?? row.productCode ?? "",
      row.productName ?? "",
      row.quantity ?? "",
      row.rentPricePerDay ?? "",
      row.quickRentPrice ?? "",
      row.purchasePrice ?? "",
      row.salePrice ?? "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      row.itemSize ?? "",
      row.note ?? "",
      row.reason,
    ]);
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];
  for (let index = 0; index <= TEMPLATE_COLUMNS.length; index += 1) {
    sheet.getColumn(index + 1).width = 20;
  }
  sheet.getRow(1).font = { bold: true };

  const bytes = await workbook.xlsx.writeBuffer();
  return new Uint8Array(bytes);
}

export async function listProcurementReceiptsForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: ProcurementListQuery;
  }
): Promise<ProcurementListResponse> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  const page = normalizePage(options.query.page);
  const pageSize = normalizePageSize(options.query.pageSize);
  const search = sanitizeText(options.query.search ?? null);
  const intakeChannel = normalizeIntakeChannel(options.query.intakeChannel ?? null);
  const startDate = sanitizeText(options.query.startDate ?? null);
  const endDate = sanitizeText(options.query.endDate ?? null);

  assertDateRange(startDate, endDate);

  let query = supabase
    .from("procurement_receipts")
    .select(PROCUREMENT_RECEIPT_SELECT, { count: "exact" })
    .eq("branch_id", context.branchId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`receipt_code.ilike.%${search}%,supplier_name.ilike.%${search}%`);
  }

  if (intakeChannel) {
    query = query.eq("intake_channel", intakeChannel);
  }

  if (startDate) {
    query = query.gte("created_at", buildDateFromBoundary(startDate));
  }

  if (endDate) {
    query = query.lte("created_at", buildDateToBoundary(endDate));
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .range(from, to)
    .returns<ProcurementReceiptRow[]>();

  if (error) throw error;

  const rows = data ?? [];
  const creatorIds = Array.from(
    new Set(rows.map((row) => row.created_by).filter((value): value is string => Boolean(value)))
  );
  const createdByNameMap = await fetchProfileNamesByIds(supabase, creatorIds);

  return {
    items: rows.map((row) => mapReceiptRowToSummary(row, createdByNameMap)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getProcurementReceiptDetailForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    receiptId: string;
  }
): Promise<ProcurementReceiptDetailDto | null> {
  const row = await getReceiptById(supabase, options.receiptId);
  if (!row) return null;

  await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: row.branch_id,
  });

  const creatorMap = await fetchProfileNamesByIds(
    supabase,
    row.created_by ? [row.created_by] : []
  );

  const items = await fetchReceiptItems(supabase, row.id);

  return {
    summary: mapReceiptRowToSummary(row, creatorMap),
    lines: items.map((entry) => mapReceiptItemRowToDto(entry)),
  };
}

export async function assertProcurementReceiptImmutableForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    receiptId: string;
  }
): Promise<never> {
  const receipt = await getReceiptById(supabase, options.receiptId);
  if (!receipt) {
    throw new ProcurementDomainError("RECEIPT_NOT_FOUND", {
      receiptId: options.receiptId,
    });
  }

  await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: receipt.branch_id,
  });

  const parsedRollbackNote = parseProcurementRollbackNote(receipt.note);
  if (parsedRollbackNote.rollbackMeta) {
    throw new ProcurementDomainError("PROCUREMENT_RECEIPT_ALREADY_ROLLED_BACK", {
      receiptId: receipt.id,
      receiptCode: receipt.receipt_code,
      rolledBackAt: parsedRollbackNote.rollbackMeta.at,
    });
  }

  throw new ProcurementDomainError("PROCUREMENT_RECEIPT_IMMUTABLE", {
    receiptId: receipt.id,
    receiptCode: receipt.receipt_code,
    immutableFields: [
      "quantity",
      "unit_cost_amount",
      "purchase_price",
      "sale_price",
      "rent_price_per_day",
    ],
    correctionFlow: "ROLLBACK_AND_RECREATE",
  });
}

export async function rollbackProcurementReceiptForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    receiptId: string;
    payload?: RollbackProcurementReceiptPayload | null;
  }
): Promise<ProcurementReceiptRollbackResultDto> {
  const receipt = await getReceiptById(supabase, options.receiptId);
  if (!receipt) {
    throw new ProcurementDomainError("RECEIPT_NOT_FOUND", {
      receiptId: options.receiptId,
    });
  }

  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: receipt.branch_id,
  });
  assertProcurementRollbackRole(context.role);

  const parsedRollbackNote = parseProcurementRollbackNote(receipt.note);
  if (parsedRollbackNote.rollbackMeta) {
    throw new ProcurementDomainError("PROCUREMENT_RECEIPT_ALREADY_ROLLED_BACK", {
      receiptId: receipt.id,
      receiptCode: receipt.receipt_code,
      rolledBackAt: parsedRollbackNote.rollbackMeta.at,
    });
  }

  const receiptItems = await fetchReceiptItems(supabase, receipt.id);
  const itemCandidates = await fetchRollbackItemCandidates(supabase, {
    branchId: receipt.branch_id,
    receiptCode: receipt.receipt_code,
    receiptItems,
  });

  assertRollbackItemCountMatches({
    receiptId: receipt.id,
    receiptCode: receipt.receipt_code,
    receiptItems,
    itemCandidates,
  });
  assertRollbackItemStatuses(itemCandidates);

  const itemIds = itemCandidates.map((row) => row.id);
  const soldOrRentedHistoryRows = await fetchRollbackItemHistoryByStatuses(
    supabase,
    itemIds,
    ["SOLD", "ON_RENT"]
  );
  if (soldOrRentedHistoryRows.length > 0) {
    const statusByItemId = new Map<string, Set<string>>();
    for (const row of soldOrRentedHistoryRows) {
      const normalizedStatus = row.to_status.trim().toUpperCase();
      if (normalizedStatus !== "SOLD" && normalizedStatus !== "ON_RENT") continue;
      const current = statusByItemId.get(row.item_id) ?? new Set<string>();
      current.add(normalizedStatus);
      statusByItemId.set(row.item_id, current);
    }

    if (statusByItemId.size > 0) {
      const itemById = new Map(itemCandidates.map((row) => [row.id, row]));
      const blockedItems = Array.from(statusByItemId.entries())
        .slice(0, 20)
        .map(([itemId, statusSet]) => {
          const item = itemById.get(itemId);
          return {
            itemId,
            itemCode: item?.item_code ?? null,
            historyStatuses: Array.from(statusSet.values()),
          };
        });

      throw new ProcurementDomainError("PROCUREMENT_RECEIPT_ROLLBACK_ITEM_IN_USE", {
        receiptId: receipt.id,
        receiptCode: receipt.receipt_code,
        blockedReason: "ITEM_WAS_RENTED_OR_SOLD",
        referencedItemCount: statusByItemId.size,
        referencedItemIds: Array.from(statusByItemId.keys()).slice(0, 20),
        blockedItems,
      });
    }
  }

  const itemReferences = await fetchRollbackItemReferences(supabase, itemIds);
  if (itemReferences.length > 0) {
    throw new ProcurementDomainError("PROCUREMENT_RECEIPT_ROLLBACK_ITEM_IN_USE", {
      receiptId: receipt.id,
      receiptCode: receipt.receipt_code,
      referencedItemCount: itemReferences.length,
      referencedItemIds: itemReferences.slice(0, 20).map((row) => row.item_id),
    });
  }

  const rollbackReason = sanitizeText(options.payload?.reason ?? null);
  const nowIso = new Date().toISOString();
  const rollbackMeta: ProcurementReceiptRollbackNoteMeta = {
    at: nowIso,
    by: context.actor.id,
    reason: rollbackReason,
  };

  const itemsToRetire = itemCandidates.filter(
    (row) => row.status.trim().toUpperCase() !== "RETIRED"
  );

  if (itemsToRetire.length > 0) {
    const { error: updateItemError } = await supabase
      .from("items")
      .update({
        status: "RETIRED",
        updated_by: context.actor.id,
      })
      .in(
        "id",
        itemsToRetire.map((row) => row.id)
      );

    if (updateItemError) throw updateItemError;

    const { error: statusLogError } = await supabase
      .from("item_status_logs")
      .insert(
        itemsToRetire.map((row) => ({
          branch_id: row.branch_id,
          item_id: row.id,
          from_status: row.status,
          to_status: "RETIRED",
          reason_code: "PROCUREMENT_RECEIPT_ROLLBACK",
          reason_note: rollbackReason
            ? `Rollback receipt ${receipt.receipt_code}: ${rollbackReason}`
            : `Rollback receipt ${receipt.receipt_code}`,
          actor_profile_id: context.actor.id,
        }))
      );

    if (statusLogError) throw statusLogError;
  }

  const linkedPayments = await fetchProcurementPaymentsByReceiptId(supabase, receipt.id);
  const paymentIdsToVoid = linkedPayments
    .filter((row) => row.status.trim().toUpperCase() !== "VOIDED")
    .map((row) => row.id);

  if (paymentIdsToVoid.length > 0) {
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "VOIDED",
        void_reason: rollbackReason
          ? `PROCUREMENT_RECEIPT_ROLLBACK: ${rollbackReason}`
          : "PROCUREMENT_RECEIPT_ROLLBACK",
        voided_at: nowIso,
        updated_by: context.actor.id,
      })
      .in("id", paymentIdsToVoid);

    if (paymentUpdateError) throw paymentUpdateError;
  }

  const { error: receiptUpdateError } = await supabase
    .from("procurement_receipts")
    .update({
      note: buildProcurementRollbackNote(receipt.note, rollbackMeta),
      updated_by: context.actor.id,
    })
    .eq("id", receipt.id);

  if (receiptUpdateError) throw receiptUpdateError;

  await supabase.from("audit_events").insert({
    branch_id: receipt.branch_id,
    actor_profile_id: context.actor.id,
    entity_type: "PROCUREMENT_RECEIPT",
    entity_id: receipt.id,
    action: "PROCUREMENT_RECEIPT_ROLLED_BACK",
    reason: rollbackReason,
    before_data: {
      receiptCode: receipt.receipt_code,
      isRolledBack: false,
    },
    after_data: {
      receiptCode: receipt.receipt_code,
      isRolledBack: true,
      rolledBackAt: nowIso,
      retiredItemCount: itemsToRetire.length,
      voidedPaymentCount: paymentIdsToVoid.length,
    },
    meta: {
      reason: rollbackReason,
      actorRole: context.role,
      correctionFlow: "ROLLBACK_AND_RECREATE",
    },
  });

  return {
    receiptId: receipt.id,
    receiptCode: receipt.receipt_code,
    rolledBackAt: nowIso,
    retiredItemCount: itemsToRetire.length,
    voidedPaymentCount: paymentIdsToVoid.length,
  };
}

export async function listProcurementProductsForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: ProcurementProductsQuery;
  }
): Promise<ProcurementProductsResponse> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  const page = normalizePage(options.query.page);
  const pageSize = normalizePageSize(options.query.pageSize);
  const search = sanitizeText(options.query.search ?? null);

  let query = supabase
    .from("products")
    .select(
      "id, branch_id, product_code, name, category_id, gender, material, description, rent_price_per_day, sale_price, purchase_price, is_rentable, is_saleable, is_active, is_archived",
      {
      count: "exact",
      }
    )
    .eq("branch_id", context.branchId)
    .eq("is_archived", false)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.or(`product_code.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to).returns<ProcurementProductRow[]>();
  if (error) throw error;

  const rows = data ?? [];
  const productIds = rows.map((row) => row.id);
  const stockCountsByProductId = await fetchProductStockCounts(supabase, productIds);

  return {
    items: rows.map((row) => ({
      id: row.id,
      productCode: row.product_code,
      name: row.name,
      rentPricePerDay:
        row.rent_price_per_day === null ? null : roundMoney(parseNumeric(row.rent_price_per_day)),
      salePrice: row.sale_price === null ? null : roundMoney(parseNumeric(row.sale_price)),
      purchasePrice: row.purchase_price === null ? null : roundMoney(parseNumeric(row.purchase_price)),
      stockTotal: stockCountsByProductId.get(row.id) ?? 0,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function listProcurementCategoriesForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: ProcurementCategoriesQuery;
  }
): Promise<ProcurementCategoriesResponse> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  const searchToken = normalizeSearchToken(options.query.search ?? null);
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, branch_id, code, name, sort_order, is_active")
    .eq("is_active", true)
    .or(`branch_id.is.null,branch_id.eq.${context.branchId}`)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .returns<ProductCategoryRow[]>();

  if (error) throw error;

  const rows = data ?? [];
  const categoryByCodeLower = new Map<string, ProductCategoryRow>();
  for (const row of rows) {
    const key = row.code.toLowerCase();
    const existing = categoryByCodeLower.get(key);
    if (!existing) {
      categoryByCodeLower.set(key, row);
      continue;
    }

    if (existing.branch_id === null && row.branch_id === context.branchId) {
      categoryByCodeLower.set(key, row);
    }
  }

  const filtered = Array.from(categoryByCodeLower.values())
    .filter((row) => {
      if (!searchToken) return true;
      const codeToken = normalizeSearchToken(row.code);
      const nameToken = normalizeSearchToken(row.name);
      return codeToken.includes(searchToken) || nameToken.includes(searchToken);
    })
    .sort((a, b) => {
      const orderDelta = parseNumeric(a.sort_order) - parseNumeric(b.sort_order);
      if (orderDelta !== 0) return orderDelta;
      return a.name.localeCompare(b.name, "vi");
    });

  return {
    items: filtered.map((row) => mapCategoryRowToOption(row)),
  };
}

function toImportValidationResponse(result: ImportValidationResult): ProcurementImportValidationResponse {
  return {
    branchId: result.branchId,
    sheetName: result.sheetName,
    isValid: result.errors.length === 0,
    summary: {
      totalRows: result.rows.length,
      validRows: result.normalizedRows.length,
      invalidRows: Math.max(0, result.rows.length - result.normalizedRows.length),
    },
    normalizedRows: result.normalizedRows,
    errors: result.errors,
    templateColumns: TEMPLATE_COLUMNS,
  };
}

export async function validateProcurementImportXlsxForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: ProcurementImportServerPayload;
  }
): Promise<ProcurementImportValidationResponse> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
  });

  const result = await buildImportValidation(supabase, {
    context,
    payload: {
      ...options.payload,
      branchId: context.branchId,
    },
  });

  return toImportValidationResponse(result);
}

interface NormalizedProcurementLineInput {
  sheetName: string;
  rowNumber: number;
  productId: string | null;
  productCode: string | null;
  name: string | null;
  categoryCode: string | null;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
  isRentable: boolean | null;
  isSaleable: boolean | null;
  material: string | null;
  gender: ProductGender | null;
  description: string | null;
  coverImageUrl: string | null;
  quantity: number;
  unitCostAmount: number;
  itemSize: string | null;
  note: string | null;
}

interface ResolvedProcurementLine {
  sheetName: string;
  rowNumber: number;
  resolvedAction: ProcurementImportResolvedAction;
  generatedProductCode: string | null;
  productId: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  quantity: number;
  unitCostAmount: number;
  lineTotalAmount: number;
  rentPricePerDay: number;
  quickRentPrice: number | null;
  purchasePrice: number;
  salePrice: number;
  itemSize: string | null;
  note: string | null;
}

function normalizeLineGender(value: unknown): ProductGender | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "female" ||
    normalized === "male" ||
    normalized === "unisex" ||
    normalized === "other"
  ) {
    return normalized;
  }
  return null;
}

function normalizeLineBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function normalizeProcurementLineInput(
  line: CreateProcurementReceiptPayload["lines"][number],
  index: number
): NormalizedProcurementLineInput {
  const quantity = Math.floor(Number(line.quantity));
  const unitCostAmount = roundMoney(Number(line.unitCostAmount));
  const rentPricePerDay = parseOptionalNumeric(line.rentPricePerDay);
  const quickRentPrice = parseOptionalNumeric(line.quickRentPrice);
  const purchasePrice = parseOptionalNumeric(line.purchasePrice);
  const salePrice = parseOptionalNumeric(line.salePrice);

  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCostAmount) || unitCostAmount < 0) {
    throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
      line,
      rowNumber: index + 1,
    });
  }

  if (rentPricePerDay === null || purchasePrice === null || salePrice === null) {
    throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
      line,
      rowNumber: index + 1,
      reason: "missing-required-prices",
    });
  }

  return {
    sheetName: DEFAULT_IMPORT_SHEET_NAME,
    rowNumber: index + 1,
    productId: sanitizeText(line.productId),
    productCode: sanitizeText(line.productCode),
    name: sanitizeText(line.name),
    categoryCode: sanitizeText(line.categoryCode),
    rentPricePerDay,
    quickRentPrice,
    purchasePrice,
    salePrice,
    isRentable: normalizeLineBoolean(line.isRentable),
    isSaleable: normalizeLineBoolean(line.isSaleable),
    material: sanitizeText(line.material),
    gender: normalizeLineGender(line.gender),
    description: sanitizeText(line.description),
    coverImageUrl: sanitizeText(line.coverImageUrl),
    quantity,
    unitCostAmount,
    itemSize: sanitizeText(line.itemSize),
    note: sanitizeText(line.note),
  };
}

async function resolveProcurementLinesWithProductUpsert(
  supabase: SupabaseClient,
  options: {
    context: ProcurementActorContext;
    lines: NormalizedProcurementLineInput[];
  }
): Promise<ResolvedProcurementLine[]> {
  const productIdCandidates = options.lines
    .map((line) => line.productId)
    .filter((value): value is string => Boolean(value));
  const productCodeCandidates = options.lines
    .map((line) => line.productCode)
    .filter((value): value is string => Boolean(value));
  const categoryCodeCandidates = options.lines
    .map((line) => line.categoryCode)
    .filter((value): value is string => Boolean(value));

  const [productsById, productsByCodeLower, categoriesByCodeLower] = await Promise.all([
    fetchProductsByIds(supabase, Array.from(new Set(productIdCandidates))),
    fetchProductsByCodes(supabase, {
      branchId: options.context.branchId,
      productCodes: Array.from(new Set(productCodeCandidates)),
    }),
    fetchCategoryByCodeMap(supabase, {
      branchId: options.context.branchId,
      categoryCodes: Array.from(new Set(categoryCodeCandidates)),
    }),
  ]);

  const resolvedLines: ResolvedProcurementLine[] = [];

  for (const line of options.lines) {
    if (line.rentPricePerDay === null || line.purchasePrice === null || line.salePrice === null) {
      throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
        rowNumber: line.rowNumber,
        reason: "missing-required-prices",
      });
    }

    let product: ProcurementProductRow | null = null;
    if (line.productId) {
      product = productsById.get(line.productId) ?? null;
    }
    if (!product && line.productCode) {
      product = productsByCodeLower.get(line.productCode.toLowerCase()) ?? null;
    }

    if (product) {
      if (!product.is_active || product.is_archived) {
        throw new ProcurementDomainError("PRODUCT_NOT_FOUND", {
          productId: product.id,
          rowNumber: line.rowNumber,
        });
      }

      const productBranchId = sanitizeText(product.branch_id);
      if (productBranchId && productBranchId !== options.context.branchId) {
        throw new ProcurementDomainError("FORBIDDEN_BRANCH_SCOPE", {
          rowNumber: line.rowNumber,
          productId: product.id,
          productBranchId,
          branchId: options.context.branchId,
        });
      }

      const updatePayload: Record<string, unknown> = {
        updated_by: options.context.actor.id,
      };
      if (line.name) updatePayload.name = line.name;
      if (line.categoryCode) {
        const category = categoriesByCodeLower.get(line.categoryCode.toLowerCase()) ?? null;
        if (!category) {
          throw new ProcurementDomainError("CATEGORY_NOT_FOUND", {
            categoryCode: line.categoryCode,
            rowNumber: line.rowNumber,
          });
        }
        updatePayload.category_id = category.id;
      }
      if (line.rentPricePerDay !== null) updatePayload.rent_price_per_day = line.rentPricePerDay;
      if (line.purchasePrice !== null) updatePayload.purchase_price = line.purchasePrice;
      if (line.salePrice !== null) updatePayload.sale_price = line.salePrice;
      if (line.isRentable !== null) updatePayload.is_rentable = line.isRentable;
      if (line.isSaleable !== null) updatePayload.is_saleable = line.isSaleable;
      if (line.material) updatePayload.material = line.material;
      if (line.gender) updatePayload.gender = line.gender;
      if (line.description) updatePayload.description = line.description;
      if (line.coverImageUrl) updatePayload.cover_image_path = line.coverImageUrl;

      const patchKeys = Object.keys(updatePayload).filter((key) => key !== "updated_by");
      if (patchKeys.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", product.id);
        if (updateError) throw updateError;
      }

      resolvedLines.push({
        sheetName: line.sheetName,
        rowNumber: line.rowNumber,
        resolvedAction: "UPDATE_EXISTING",
        generatedProductCode: null,
        productId: product.id,
        productCodeSnapshot: product.product_code,
        productNameSnapshot: line.name ?? product.name,
        quantity: line.quantity,
        unitCostAmount: line.unitCostAmount,
        lineTotalAmount: roundMoney(line.quantity * line.unitCostAmount),
        rentPricePerDay: line.rentPricePerDay,
        quickRentPrice: line.quickRentPrice,
        purchasePrice: line.purchasePrice,
        salePrice: line.salePrice,
        itemSize: line.itemSize,
        note: line.note,
      });
      continue;
    }

    if (!line.name) {
      throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
        rowNumber: line.rowNumber,
        reason: "missing-name-for-new-product",
      });
    }

    const nextProductCode = line.productCode ?? (await generateUniqueProductCode(supabase, options.context.branchId));
    const categoryId =
      line.categoryCode && categoriesByCodeLower.has(line.categoryCode.toLowerCase())
        ? categoriesByCodeLower.get(line.categoryCode.toLowerCase())?.id ?? null
        : null;

    if (line.categoryCode && !categoryId) {
      throw new ProcurementDomainError("CATEGORY_NOT_FOUND", {
        categoryCode: line.categoryCode,
        rowNumber: line.rowNumber,
      });
    }

    const insertPayload = {
      branch_id: options.context.branchId,
      product_code: nextProductCode,
      name: line.name,
      category_id: categoryId,
      cover_image_path: line.coverImageUrl,
      gender: line.gender,
      material: line.material,
      description: line.description,
      rent_price_per_day: line.rentPricePerDay,
      sale_price: line.salePrice,
      purchase_price: line.purchasePrice,
      is_rentable: line.isRentable ?? true,
      is_saleable: line.isSaleable ?? false,
      is_active: true,
      is_archived: false,
      created_by: options.context.actor.id,
      updated_by: options.context.actor.id,
    };

    const { data: createdProduct, error: createError } = await supabase
      .from("products")
      .insert(insertPayload)
      .select(
        "id, branch_id, product_code, name, category_id, gender, material, description, rent_price_per_day, sale_price, purchase_price, is_rentable, is_saleable, is_active, is_archived"
      )
      .maybeSingle<ProcurementProductRow>();

    if (createError) throw createError;
    if (!createdProduct) {
      throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
        rowNumber: line.rowNumber,
        reason: "cannot-create-product",
      });
    }

    productsById.set(createdProduct.id, createdProduct);
    productsByCodeLower.set(createdProduct.product_code.toLowerCase(), createdProduct);

    resolvedLines.push({
      sheetName: line.sheetName,
      rowNumber: line.rowNumber,
      resolvedAction: "CREATE_NEW",
      generatedProductCode: line.productCode ? null : createdProduct.product_code,
      productId: createdProduct.id,
      productCodeSnapshot: createdProduct.product_code,
      productNameSnapshot: createdProduct.name,
      quantity: line.quantity,
      unitCostAmount: line.unitCostAmount,
      lineTotalAmount: roundMoney(line.quantity * line.unitCostAmount),
      rentPricePerDay: line.rentPricePerDay,
      quickRentPrice: line.quickRentPrice,
      purchasePrice: line.purchasePrice,
      salePrice: line.salePrice,
      itemSize: line.itemSize,
      note: line.note,
    });
  }

  return resolvedLines;
}

export async function createProcurementReceiptForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateProcurementReceiptPayload;
  }
): Promise<ProcurementReceiptDetailDto> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
  });

  const intakeChannel =
    normalizeIntakeChannel(options.payload.intakeChannel ?? null) ?? "MANUAL";

  if (!INTAKE_CHANNEL_SET.has(intakeChannel)) {
    throw new ProcurementDomainError("INVALID_INTAKE_CHANNEL", {
      intakeChannel: options.payload.intakeChannel,
    });
  }

  const lines = Array.isArray(options.payload.lines) ? options.payload.lines : [];
  if (lines.length === 0) {
    throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
      reason: "empty-lines",
    });
  }

  const normalizedLineInputs = lines.map((line, index) =>
    normalizeProcurementLineInput(line, index)
  );
  const normalizedLines = await resolveProcurementLinesWithProductUpsert(supabase, {
    context,
    lines: normalizedLineInputs,
  });
  const createdProductIds = Array.from(
    new Set(
      normalizedLines
        .filter((line) => line.resolvedAction === "CREATE_NEW")
        .map((line) => line.productId)
    )
  );

  const productIds = Array.from(
    new Set(normalizedLines.map((line) => line.productId).filter(Boolean))
  );
  const productsById = await fetchProductsByIds(supabase, productIds);

  const totalQuantity = normalizedLines.reduce((sum, line) => sum + line.quantity, 0);
  const totalCostAmount = roundMoney(
    normalizedLines.reduce((sum, line) => sum + line.lineTotalAmount, 0)
  );

  const expensePayment = options.payload.expensePayment;
  // Completion contract: a finished procurement receipt always records a posted expense payment.
  const expenseAmount = totalCostAmount;
  let expenseMethod: OrderPaymentMethod | null = "CASH";
  let expenseReason: string | null = null;
  let expenseNote: string | null = null;

  if (expensePayment) {
    const requestedAmount = roundMoney(Number(expensePayment.amount));
    const normalizedMethod = normalizePaymentMethod(expensePayment.method);
    expenseReason = sanitizeText(expensePayment.reason) ?? "PROCUREMENT_INTAKE_EXPENSE";
    expenseNote = sanitizeText(expensePayment.note);

    if (!Number.isFinite(requestedAmount) || requestedAmount < 0) {
      throw new ProcurementDomainError("INVALID_PAYMENT_AMOUNT", {
        amount: expensePayment.amount,
      });
    }

    if (!normalizedMethod) {
      throw new ProcurementDomainError("INVALID_PAYMENT_METHOD", {
        method: expensePayment.method,
      });
    }

    expenseMethod = normalizedMethod;
  } else {
    expenseReason = "PROCUREMENT_INTAKE_EXPENSE";
  }

  const receiptCode = await generateReceiptCode(supabase, context.branchId);
  const itemInsertRows = buildProcurementIntakeItemInsertRows({
    actorProfileId: context.actor.id,
    branchId: context.branchId,
    receiptCode,
    lines: normalizedLines.map((line) => ({
      productId: line.productId,
      productCode: line.productCodeSnapshot,
      quantity: line.quantity,
      itemSize: line.itemSize,
    })),
  });

  let insertedReceipt: InsertedProcurementReceiptRow | null = null;

  try {
    await assertProcurementItemCodesAvailable(supabase, {
      branchId: context.branchId,
      itemInsertRows,
    });

    const { data: nextReceipt, error: receiptInsertError } = await supabase
      .from("procurement_receipts")
      .insert({
        branch_id: context.branchId,
        receipt_code: receiptCode,
        intake_channel: intakeChannel,
        intake_source_file_name: sanitizeText(options.payload.intakeSourceFileName),
        supplier_name: sanitizeText(options.payload.supplierName),
        supplier_phone: sanitizeText(options.payload.supplierPhone),
        note: sanitizeText(options.payload.note),
        total_quantity: totalQuantity,
        total_cost_amount: totalCostAmount,
        payment_expense_amount: totalCostAmount > 0 ? expenseAmount : 0,
        payment_method: totalCostAmount > 0 ? expenseMethod : null,
        payment_note: expenseAmount > 0 ? expenseNote : null,
        paid_at: totalCostAmount > 0 ? new Date().toISOString() : null,
        created_by: context.actor.id,
        updated_by: context.actor.id,
      })
      .select("id, receipt_code, branch_id, created_at")
      .maybeSingle<InsertedProcurementReceiptRow>();

    if (receiptInsertError) throw receiptInsertError;
    if (!nextReceipt) {
      throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
        reason: "insert-receipt-failed",
      });
    }
    insertedReceipt = nextReceipt;
    const insertedReceiptRow = insertedReceipt;
    if (!insertedReceiptRow) {
      throw new ProcurementDomainError("INVALID_LINE_PAYLOAD", {
        reason: "insert-receipt-failed",
      });
    }

    if (totalCostAmount > 0 && expenseMethod) {
      const { error: paymentInsertError } = await supabase.from("payments").insert({
        branch_id: context.branchId,
        order_id: null,
        procurement_receipt_id: insertedReceiptRow.id,
        customer_id: null,
        type: "EXPENSE",
        method: expenseMethod,
        amount: expenseAmount,
        currency_code: "VND",
        reason: expenseReason,
        source: "PROCUREMENT_INTAKE",
        status: "POSTED",
        note: expenseNote,
        created_by: context.actor.id,
        updated_by: context.actor.id,
      });

      if (paymentInsertError) throw paymentInsertError;
    }

    const { error: receiptItemsInsertError } = await supabase
      .from("procurement_receipt_items")
      .insert(
        normalizedLines.map((line) => ({
          receipt_id: insertedReceiptRow.id,
          branch_id: context.branchId,
          product_id: line.productId,
          product_code_snapshot: line.productCodeSnapshot,
          product_name_snapshot: line.productNameSnapshot,
          quantity: line.quantity,
          unit_cost_amount: line.unitCostAmount,
          line_total_amount: line.lineTotalAmount,
          item_size: line.itemSize,
          note: line.note,
        }))
      );

    if (receiptItemsInsertError) throw receiptItemsInsertError;

    const currentStockByProductId = await fetchProductStockCounts(supabase, productIds);

    await insertProcurementItemsAndLogs(supabase, {
      actorProfileId: context.actor.id,
      branchId: context.branchId,
      receiptCode: insertedReceiptRow.receipt_code,
      lines: normalizedLines.map((line) => ({
        productId: line.productId,
        productCode: line.productCodeSnapshot,
        quantity: line.quantity,
        itemSize: line.itemSize,
      })),
    });

    await updateProductPurchasePriceByWeightedAverage(supabase, {
      actorProfileId: context.actor.id,
      productsById,
      currentStockByProductId,
      intakeRows: normalizedLines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        lineTotalAmount: line.lineTotalAmount,
      })),
    });

    await supabase.from("audit_events").insert({
      branch_id: context.branchId,
      actor_profile_id: context.actor.id,
      entity_type: "PROCUREMENT_RECEIPT",
      entity_id: insertedReceiptRow.id,
      action: "PROCUREMENT_RECEIPT_CREATED",
      after_data: {
        receiptCode: insertedReceiptRow.receipt_code,
        intakeChannel,
        totalQuantity,
        totalCostAmount,
        paymentExpenseAmount: expenseAmount,
        lineCount: normalizedLines.length,
      },
      meta: {
        source: intakeChannel,
        intakeSourceFileName: sanitizeText(options.payload.intakeSourceFileName),
      },
    });

    const detail = await getProcurementReceiptDetailForActor(supabase, {
      actorProfileId: context.actor.id,
      receiptId: insertedReceiptRow.id,
    });

    if (!detail) {
      throw new ProcurementDomainError("RECEIPT_NOT_FOUND", {
        receiptId: insertedReceiptRow.id,
      });
    }

    return detail;
  } catch (error) {
    try {
      if (insertedReceipt) {
        await cleanupFailedProcurementReceiptDraft(supabase, {
          branchId: context.branchId,
          receiptId: insertedReceipt.id,
          receiptCode: insertedReceipt.receipt_code,
          createdProductIds,
        });
      } else {
        await deleteCreatedProductsBestEffort(supabase, createdProductIds);
      }
    } catch (cleanupError) {
      console.error("Procurement cleanup failed (web)", {
        error: cleanupError,
        receiptId: insertedReceipt?.id ?? null,
      });
    }
    throw error;
  }
}

function mapValidationRowToIncompleteRow(
  row: ImportValidationRow
): ProcurementImportIncompleteRowDto {
  const reason =
    row.errors.length > 0
      ? row.errors.map((error) => error.message).join(" | ")
      : "Row is incomplete.";

  return {
    sheetName: row.parsed.sheetName,
    rowNumber: row.parsed.rowNumber,
    resolvedAction: row.resolvedAction,
    productCode: row.parsed.productCode,
    generatedProductCode: null,
    productName: row.parsed.name ?? row.matchedProduct?.name ?? null,
    quantity: row.parsed.quantity,
    unitCostAmount: row.parsed.unitCostAmount,
    rentPricePerDay: row.parsed.rentPricePerDay,
    quickRentPrice: row.parsed.quickRentPrice,
    purchasePrice: row.parsed.purchasePrice,
    salePrice: row.parsed.salePrice,
    itemSize: row.parsed.itemSize,
    note: row.parsed.note,
    reason,
    errors: row.errors,
  };
}

function mapRuntimeFailureToIncompleteRow(
  row: ProcurementImportNormalizedRowDto,
  reason: string
): ProcurementImportIncompleteRowDto {
  return {
    sheetName: row.sheetName,
    rowNumber: row.rowNumber,
    resolvedAction: row.resolvedAction,
    productCode: row.productCode,
    generatedProductCode: null,
    productName: row.productName,
    quantity: row.quantity,
    unitCostAmount: row.unitCostAmount,
    rentPricePerDay: row.rentPricePerDay,
    quickRentPrice: row.quickRentPrice,
    purchasePrice: row.purchasePrice,
    salePrice: row.salePrice,
    itemSize: row.itemSize,
    note: row.note,
    reason,
    errors: [],
  };
}

export async function commitProcurementImportXlsxForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: ProcurementImportCommitServerPayload;
  }
): Promise<ProcurementImportCommitResponse> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
  });

  const validationResult = await buildImportValidation(supabase, {
    context,
    payload: {
      ...options.payload,
      branchId: context.branchId,
    },
  });

  const normalizedRowsByKey = new Map<string, ProcurementImportNormalizedRowDto>(
    validationResult.normalizedRows.map((row) => [`${row.sheetName}::${row.rowNumber}`, row])
  );
  const incompleteRows: ProcurementImportIncompleteRowDto[] = [];
  const normalizedCommitRows: ProcurementImportNormalizedRowDto[] = [];

  for (const row of validationResult.rows) {
    if (row.errors.length > 0) {
      incompleteRows.push(mapValidationRowToIncompleteRow(row));
      continue;
    }

    const normalized = normalizedRowsByKey.get(`${row.parsed.sheetName}::${row.parsed.rowNumber}`);
    if (!normalized) {
      incompleteRows.push(mapValidationRowToIncompleteRow(row));
      continue;
    }
    normalizedCommitRows.push(normalized);
  }

  if (incompleteRows.length > 0) {
    const rowKeySet = new Set(incompleteRows.map((row) => `${row.sheetName}::${row.rowNumber}`));
    for (const row of normalizedCommitRows) {
      const key = `${row.sheetName}::${row.rowNumber}`;
      if (rowKeySet.has(key)) continue;
      incompleteRows.push(
        mapRuntimeFailureToIncompleteRow(
          row,
          "Import chỉ được xác nhận khi tất cả dòng hợp lệ."
        )
      );
    }

    return {
      branchId: context.branchId,
      receipt: null,
      summary: {
        totalRows: validationResult.rows.length,
        successRows: 0,
        incompleteRows: incompleteRows.length,
      },
      successRows: [],
      incompleteRows,
    };
  }

  let receipt: ProcurementReceiptDetailDto | null = null;
  if (normalizedCommitRows.length > 0) {
    try {
      receipt = await createProcurementReceiptForActor(supabase, {
        actorProfileId: options.actorProfileId,
        payload: {
          branchId: context.branchId,
          intakeChannel: "EXCEL",
          intakeSourceFileName:
            sanitizeText(options.payload.intakeSourceFileName) ??
            sanitizeText(options.payload.fileName),
          supplierName: sanitizeText(options.payload.supplierName),
          supplierPhone: sanitizeText(options.payload.supplierPhone),
          note: sanitizeText(options.payload.note),
          lines: normalizedCommitRows.map((row) => ({
            productId: row.productId,
            productCode: row.productCode,
            name: row.productName,
            categoryCode: row.categoryCode,
            rentPricePerDay: row.rentPricePerDay,
            quickRentPrice: row.quickRentPrice,
            purchasePrice: row.purchasePrice,
            salePrice: row.salePrice,
            isRentable: row.isRentable,
            isSaleable: row.isSaleable,
            material: row.material,
            gender: row.gender,
            description: row.description,
            coverImageUrl: row.coverImageUrl,
            quantity: row.quantity,
            unitCostAmount: row.unitCostAmount,
            itemSize: row.itemSize,
            note: row.note,
          })),
          expensePayment: options.payload.expensePayment ?? null,
        },
      });
    } catch (error) {
      const errorRecord =
        error && typeof error === "object"
          ? (error as { code?: unknown; message?: unknown })
          : null;
      let reason = error instanceof ProcurementDomainError
        ? error.code
        : error instanceof Error
          ? error.message
          : "IMPORT_COMMIT_FAILED";

      if (
        errorRecord &&
        (errorRecord.code === "23514" || errorRecord.code === 23514) &&
        typeof errorRecord.message === "string" &&
        errorRecord.message.includes("products_gender_check")
      ) {
        reason = 'Invalid product gender value (allowed: female, male, unisex, other)';
      }
      for (const row of normalizedCommitRows) {
        incompleteRows.push(mapRuntimeFailureToIncompleteRow(row, reason));
      }
      receipt = null;
    }
  }

  const successRows =
    receipt === null
      ? []
      : normalizedCommitRows.map((row, index) => {
          const line = receipt?.lines[index];
          return {
            sheetName: row.sheetName,
            rowNumber: row.rowNumber,
            resolvedAction: row.resolvedAction,
            productId: line?.productId ?? row.productId ?? "",
            productCode: line?.productCodeSnapshot ?? row.productCode ?? "",
            productName: line?.productNameSnapshot ?? row.productName ?? "",
            quantity: line?.quantity ?? row.quantity ?? 0,
            unitCostAmount: line?.unitCostAmount ?? row.unitCostAmount ?? 0,
            lineTotalAmount:
              line?.lineTotalAmount ??
              roundMoney((row.quantity ?? 0) * (row.unitCostAmount ?? 0)),
            generatedProductCode:
              row.productCode === null &&
              Boolean(line?.productCodeSnapshot),
          };
        });

  return {
    branchId: context.branchId,
    receipt,
    summary: {
      totalRows: validationResult.rows.length,
      successRows: successRows.length,
      incompleteRows: incompleteRows.length,
    },
    successRows,
    incompleteRows,
  };
}

export async function exportProcurementTemplateXlsxBuffer(
  locale?: string | null
): Promise<Uint8Array> {
  return buildTemplateWorkbookBuffer(resolveTemplateLocale(locale));
}

export async function exportProcurementIncompleteRowsXlsxBuffer(
  payload: ProcurementImportIncompleteExportPayload
): Promise<Uint8Array> {
  return buildIncompleteWorkbookBuffer(payload);
}
