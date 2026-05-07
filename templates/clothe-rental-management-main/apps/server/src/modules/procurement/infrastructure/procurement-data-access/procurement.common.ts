import ExcelJS from 'exceljs';
import type { OrderPaymentMethod } from '../../../orders/types/orders-domain.type';
import type { ProductGender } from '../../../products/types/products-catalog.type';
import type {
  ProcurementImportErrorCode,
  ProcurementImportTemplateColumn,
  ProcurementIntakeChannel,
  ProcurementReceiptLineDto,
  ProcurementReceiptSummaryDto,
} from '../../types/procurement-module.type';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  INTAKE_CHANNEL_SET,
  MAX_PAGE_SIZE,
  PAYMENT_METHOD_SET,
  PROCUREMENT_ROLLBACK_NOTE_META_PREFIX,
  STOCK_COUNTED_ITEM_STATUS_SET,
  TEMPLATE_HEADER_ALIAS_TO_COLUMN,
  type ProcurementTemplateLocale,
} from './procurement.constants';
import { ProcurementDomainError } from './procurement.domain-error';
import type {
  ProcurementReceiptItemRow,
  ProcurementReceiptRollbackNoteMeta,
  ProcurementReceiptRow,
  ProductCategoryRow,
  ProcurementRollbackNoteParseResult,
} from './procurement.internal-types';

export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function sanitizeSearchTerm(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const sanitized = value.replace(/[,%]/g, ' ').trim();
  return sanitized.length > 0 ? sanitized : null;
}

export function buildPostgrestInFilter(values: string[]): string | null {
  const escapedValues = values
    .map((value) => sanitizeText(value))
    .filter((value): value is string => Boolean(value))
    .map((value) =>
      value
        .replaceAll('\\', '\\\\')
        .replaceAll('"', '\\"')
        .replace(/[(),]/g, ' ')
        .trim(),
    )
    .filter((value) => value.length > 0);

  if (escapedValues.length === 0) return null;
  return `(${escapedValues.map((value) => `"${value}"`).join(',')})`;
}

export function parseNumeric(
  value: number | string | null | undefined,
): number {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function normalizePage(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE;
  return Math.max(1, Math.floor(value));
}

export function normalizePageSize(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(value)));
}

export function normalizePaymentMethod(
  value: string | null | undefined,
): OrderPaymentMethod | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase() as OrderPaymentMethod;
  if (!PAYMENT_METHOD_SET.has(normalized)) return null;
  return normalized;
}

export function normalizeIntakeChannel(
  value: string | null | undefined,
): ProcurementIntakeChannel | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase() as ProcurementIntakeChannel;
  if (!INTAKE_CHANNEL_SET.has(normalized)) return null;
  return normalized;
}

export function normalizeRole(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function assertDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): void {
  if (!startDate || !endDate) return;
  if (startDate > endDate) {
    throw new ProcurementDomainError('INVALID_DATE_RANGE', {
      startDate,
      endDate,
    });
  }
}

export function buildDateFromBoundary(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function buildDateToBoundary(date: string): string {
  return `${date}T23:59:59.999Z`;
}

export function isStockCountedStatus(
  status: string | null | undefined,
): boolean {
  if (!status) return false;
  const normalized = status.trim().toUpperCase();
  return STOCK_COUNTED_ITEM_STATUS_SET.has(normalized);
}

export function normalizeColumnToken(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function resolveTemplateLocale(
  value: string | null | undefined,
): ProcurementTemplateLocale {
  if (typeof value !== 'string') return 'vi';
  const normalized = value.trim().toLowerCase();
  return normalized === 'en' ? 'en' : 'vi';
}

export function resolveTemplateColumnFromHeaderToken(
  token: string,
): ProcurementImportTemplateColumn | null {
  return TEMPLATE_HEADER_ALIAS_TO_COLUMN.get(token) ?? null;
}

export function parseOptionalNumeric(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseNumeric(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseExcelCellText(
  value: ExcelJS.CellValue | null,
): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    return sanitizeText(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') {
      return sanitizeText(value.text);
    }
    if (
      'result' in value &&
      (typeof value.result === 'string' || typeof value.result === 'number')
    ) {
      return sanitizeText(String(value.result));
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      const combined = value.richText
        .map((entry: { text?: unknown }) =>
          typeof entry?.text === 'string' ? entry.text : '',
        )
        .join('');
      return sanitizeText(combined);
    }
    if ('hyperlink' in value && typeof value.hyperlink === 'string') {
      return sanitizeText(value.hyperlink);
    }
  }

  if (typeof value === 'object') {
    try {
      return sanitizeText(JSON.stringify(value));
    } catch {
      return null;
    }
  }

  return sanitizeText(String(value));
}

export function parseRequiredInteger(value: string | null): {
  value: number | null;
  errorCode: ProcurementImportErrorCode | null;
} {
  const text = sanitizeText(value);
  if (!text) {
    return { value: null, errorCode: 'REQUIRED' };
  }

  const parsed = Number.parseInt(text.replace(/,/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { value: null, errorCode: 'INVALID_INTEGER' };
  }

  return { value: parsed, errorCode: null };
}

export function parseRequiredNonNegativeNumber(value: string | null): {
  value: number | null;
  errorCode: ProcurementImportErrorCode | null;
} {
  const text = sanitizeText(value);
  if (!text) {
    return { value: null, errorCode: 'REQUIRED' };
  }

  const parsed = Number(text.replace(/,/g, ''));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, errorCode: 'INVALID_NUMBER' };
  }

  return { value: roundMoney(parsed), errorCode: null };
}

export function parseOptionalBoolean(value: string | null): {
  value: boolean | null;
  errorCode: ProcurementImportErrorCode | null;
} {
  const text = sanitizeText(value);
  if (!text) {
    return { value: null, errorCode: null };
  }

  const normalized = text.toLowerCase();
  if (['1', 'true', 'yes', 'y', 'co', 'có'].includes(normalized)) {
    return { value: true, errorCode: null };
  }
  if (['0', 'false', 'no', 'n', 'khong', 'không'].includes(normalized)) {
    return { value: false, errorCode: null };
  }

  return { value: null, errorCode: 'INVALID_BOOLEAN' };
}

export function parseOptionalGender(value: string | null): {
  value: ProductGender | null;
  errorCode: ProcurementImportErrorCode | null;
} {
  const text = sanitizeText(value);
  if (!text) {
    return { value: null, errorCode: null };
  }
  const normalized = text.toLowerCase();
  if (normalized === 'nam' || normalized === 'm') {
    return { value: 'male', errorCode: null };
  }
  if (
    normalized === 'nu' ||
    normalized === 'nư' ||
    normalized === 'nữ' ||
    normalized === 'f'
  ) {
    return { value: 'female', errorCode: null };
  }
  if (
    normalized === 'female' ||
    normalized === 'male' ||
    normalized === 'unisex' ||
    normalized === 'other'
  ) {
    return { value: normalized as ProductGender, errorCode: null };
  }

  return { value: null, errorCode: 'INVALID_ENUM' };
}

export function buildReceiptDateCode(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function sanitizeItemCodeToken(
  value: string | null | undefined,
  fallback: string,
): string {
  const source = sanitizeText(value) ?? fallback;
  return (
    source
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 24) || fallback
  );
}

export function parseProcurementRollbackNote(
  note: string | null | undefined,
): ProcurementRollbackNoteParseResult {
  const rawNote = typeof note === 'string' ? note : '';
  if (!rawNote) {
    return {
      cleanNote: null,
      rollbackMeta: null,
    };
  }

  const markerIndex = rawNote.lastIndexOf(
    PROCUREMENT_ROLLBACK_NOTE_META_PREFIX,
  );
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
    const parsed = JSON.parse(
      rawMeta,
    ) as Partial<ProcurementReceiptRollbackNoteMeta>;
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

export function buildProcurementRollbackNote(
  note: string | null | undefined,
  rollbackMeta: ProcurementReceiptRollbackNoteMeta,
): string {
  const parsed = parseProcurementRollbackNote(note);
  const chunks: string[] = [];

  if (parsed.cleanNote) {
    chunks.push(parsed.cleanNote);
  }

  chunks.push(
    `${PROCUREMENT_ROLLBACK_NOTE_META_PREFIX}${JSON.stringify(rollbackMeta)}`,
  );
  return chunks.join('\n\n');
}

export function mapReceiptRowToSummary(
  row: ProcurementReceiptRow,
  createdByNameMap: Map<string, string | null>,
): ProcurementReceiptSummaryDto {
  const paymentMethod = normalizePaymentMethod(row.payment_method);
  const intakeChannel = normalizeIntakeChannel(row.intake_channel) ?? 'MANUAL';
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
    totalCostAmount: roundMoney(
      Math.max(0, parseNumeric(row.total_cost_amount)),
    ),
    paymentExpenseAmount: roundMoney(
      Math.max(0, parseNumeric(row.payment_expense_amount)),
    ),
    paymentMethod,
    paymentNote: row.payment_note,
    paidAt: row.paid_at,
    isRolledBack: Boolean(parsedNote.rollbackMeta),
    rolledBackAt: parsedNote.rollbackMeta?.at ?? null,
    rollbackReason: parsedNote.rollbackMeta?.reason ?? null,
    createdBy: row.created_by,
    createdByName: row.created_by
      ? (createdByNameMap.get(row.created_by) ?? null)
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReceiptItemRowToDto(
  row: ProcurementReceiptItemRow,
): ProcurementReceiptLineDto {
  const gender =
    row.gender === 'female' ||
    row.gender === 'male' ||
    row.gender === 'unisex' ||
    row.gender === 'other'
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
    lineTotalAmount: roundMoney(
      Math.max(0, parseNumeric(row.line_total_amount)),
    ),
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
      row.sale_price === null
        ? null
        : roundMoney(Math.max(0, parseNumeric(row.sale_price))),
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

export function mapCategoryRowToOption(row: ProductCategoryRow) {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
  };
}
