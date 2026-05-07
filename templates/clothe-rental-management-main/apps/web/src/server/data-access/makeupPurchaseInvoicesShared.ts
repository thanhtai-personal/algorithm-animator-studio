import type {
  CreateMakeupPurchaseInvoicePayload,
  MakeupPurchaseInvoiceDto,
  MakeupPurchaseInvoiceItemDto,
  MakeupPurchaseInvoiceStatus,
} from "@/types/makeupModule";
import { MakeupDomainError, parseNumeric, roundMoney, sanitizeText } from "@/server/data-access/makeupShared";

const PURCHASE_INVOICE_STATUS_SET = new Set<MakeupPurchaseInvoiceStatus>([
  "DRAFT",
  "CONFIRMED",
  "PAID",
  "CANCELLED",
]);

export const INVOICE_SELECT_FIELDS =
  "id, branch_id, invoice_code, invoice_date, status, supplier_name, supplier_phone, note, total_amount, is_active, created_at, updated_at";
export const INVOICE_ITEM_SELECT_FIELDS =
  "id, invoice_id, inventory_item_id, item_name, quantity, unit_cost_amount, line_total_amount, note";

export interface MakeupPurchaseInvoiceRow {
  id: string;
  branch_id: string;
  invoice_code: string;
  invoice_date: string;
  status: string;
  supplier_name: string | null;
  supplier_phone: string | null;
  note: string | null;
  total_amount: number | string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MakeupPurchaseInvoiceItemRow {
  id: string;
  invoice_id: string;
  inventory_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_cost_amount: number | string | null;
  line_total_amount: number | string | null;
  note: string | null;
}

export interface NormalizedPurchaseInvoiceItemInput {
  inventoryItemId: string | null;
  itemName: string;
  quantity: number;
  unitCostAmount: number;
  note: string | null;
}

export function normalizePurchaseInvoiceStatus(
  value: string | null | undefined
): MakeupPurchaseInvoiceStatus {
  const normalized = value?.trim().toUpperCase() ?? "DRAFT";
  if (!PURCHASE_INVOICE_STATUS_SET.has(normalized as MakeupPurchaseInvoiceStatus)) {
    throw new MakeupDomainError("INVALID_PURCHASE_INVOICE_STATUS", { value });
  }
  return normalized as MakeupPurchaseInvoiceStatus;
}

export function mapInvoiceItemRowToDto(row: MakeupPurchaseInvoiceItemRow): MakeupPurchaseInvoiceItemDto {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    inventoryItemId: row.inventory_item_id,
    itemName: row.item_name,
    quantity: row.quantity,
    unitCostAmount: roundMoney(parseNumeric(row.unit_cost_amount)),
    lineTotalAmount: roundMoney(parseNumeric(row.line_total_amount)),
    note: row.note,
  };
}

export function mapInvoiceRowToDto(
  row: MakeupPurchaseInvoiceRow,
  items: MakeupPurchaseInvoiceItemDto[]
): MakeupPurchaseInvoiceDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    invoiceCode: row.invoice_code,
    invoiceDate: row.invoice_date,
    status: normalizePurchaseInvoiceStatus(row.status),
    supplierName: row.supplier_name,
    supplierPhone: row.supplier_phone,
    note: row.note,
    totalAmount: roundMoney(parseNumeric(row.total_amount)),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
  };
}

export function buildInvoiceCode(invoiceDate: string): string {
  const datePart = invoiceDate.replace(/-/g, "");
  const randomPart = Math.floor(Math.random() * 9000 + 1000);
  return `MKP-${datePart}-${randomPart}`;
}

export function normalizeInvoiceItems(
  items: CreateMakeupPurchaseInvoicePayload["items"]
): NormalizedPurchaseInvoiceItemInput[] {
  const rows = items ?? [];
  const normalized: NormalizedPurchaseInvoiceItemInput[] = [];

  for (const row of rows) {
    const itemName = sanitizeText(row.itemName);
    const inventoryItemId = sanitizeText(row.inventoryItemId ?? null);
    const quantity = Math.floor(Number(row.quantity));
    const unitCostAmount = Number(row.unitCostAmount);
    if (
      !itemName ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitCostAmount) ||
      unitCostAmount < 0
    ) {
      throw new MakeupDomainError("INVALID_PURCHASE_INVOICE_ITEM");
    }

    normalized.push({
      inventoryItemId,
      itemName,
      quantity,
      unitCostAmount,
      note: sanitizeText(row.note ?? null),
    });
  }

  return normalized;
}
