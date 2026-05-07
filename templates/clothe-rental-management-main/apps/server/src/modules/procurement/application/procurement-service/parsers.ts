import type { Request } from 'express';
import type { OrderPaymentMethod } from '../../../orders/types/orders-domain.type';
import type { ProductGender } from '../../../products/types/products-catalog.type';
import type {
  CreateProcurementReceiptPayload,
  ProcurementCategoriesQuery,
  ProcurementImportIncompleteExportPayload,
  ProcurementImportIncompleteRowDto,
  ProcurementIntakeChannel,
  ProcurementListQuery,
  ProcurementProductsQuery,
  RollbackProcurementReceiptPayload,
  UpdateProcurementReceiptPayload,
} from '../../types/procurement-module.type';

const PAYMENT_METHOD_SET = new Set<OrderPaymentMethod>([
  'CASH',
  'BANK',
  'MOMO',
]);
const INTAKE_CHANNEL_SET = new Set<ProcurementIntakeChannel>([
  'MANUAL',
  'EXCEL',
]);

export function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateString(value: unknown): string | null {
  const text = parseString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function parseInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' && typeof value !== 'string') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseNonNegativeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parsePaymentMethod(value: unknown): OrderPaymentMethod | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase() as OrderPaymentMethod;
  if (!PAYMENT_METHOD_SET.has(normalized)) return null;
  return normalized;
}

function parseIntakeChannel(value: unknown): ProcurementIntakeChannel | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase() as ProcurementIntakeChannel;
  if (!INTAKE_CHANNEL_SET.has(normalized)) return null;
  return normalized;
}

function parseOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'co', 'có'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'khong', 'không'].includes(normalized)) {
    return false;
  }
  return null;
}

function parseGender(value: unknown): ProductGender | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'female' ||
    normalized === 'male' ||
    normalized === 'unisex' ||
    normalized === 'other'
  ) {
    return normalized;
  }
  return null;
}

function parseExpensePayment(
  input: unknown,
): CreateProcurementReceiptPayload['expensePayment'] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const amount = parseNonNegativeNumber(record.amount);
  const method = parsePaymentMethod(record.method);
  if (amount === null || !method) return null;

  return {
    amount,
    method,
    note: parseString(record.note),
    reason: parseString(record.reason),
  };
}

export function parseRollbackPayload(
  body: unknown,
): RollbackProcurementReceiptPayload {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {};
  }

  const record = body as Record<string, unknown>;
  return {
    reason: parseString(record.reason),
  };
}

export function parseProcurementListQuery(
  searchParams: URLSearchParams,
): ProcurementListQuery {
  const startDateRaw = searchParams.get('startDate');
  const endDateRaw = searchParams.get('endDate');
  const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
  const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

  if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
    throw new Error('INVALID_DATE_FORMAT');
  }

  const intakeChannelRaw = searchParams.get('intakeChannel');
  const intakeChannel = intakeChannelRaw
    ? parseIntakeChannel(intakeChannelRaw)
    : null;

  if (intakeChannelRaw && !intakeChannel) {
    throw new Error('INVALID_INTAKE_CHANNEL');
  }

  return {
    branchId: parseString(searchParams.get('branchId')),
    search: parseString(searchParams.get('search')),
    intakeChannel,
    startDate,
    endDate,
    page: parseInteger(searchParams.get('page'), 1),
    pageSize: parseInteger(searchParams.get('pageSize'), 20),
  };
}

export function parseProcurementProductsQuery(
  searchParams: URLSearchParams,
): ProcurementProductsQuery {
  return {
    branchId: parseString(searchParams.get('branchId')),
    search: parseString(searchParams.get('search')),
    page: parseInteger(searchParams.get('page'), 1),
    pageSize: parseInteger(searchParams.get('pageSize'), 20),
  };
}

export function parseProcurementCategoriesQuery(
  searchParams: URLSearchParams,
): ProcurementCategoriesQuery {
  return {
    branchId: parseString(searchParams.get('branchId')),
    search: parseString(searchParams.get('search')),
    page: parseInteger(searchParams.get('page'), 1),
    pageSize: parseInteger(searchParams.get('pageSize'), 20),
  };
}

export function parseCreatePayload(
  body: unknown,
): CreateProcurementReceiptPayload | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;

  const rawLines = Array.isArray(record.lines) ? record.lines : null;
  if (!rawLines) return null;

  const lines = rawLines
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const quantity = parseInteger(row.quantity, 0);
      const unitCostAmount = parseNonNegativeNumber(row.unitCostAmount);
      const rentPricePerDay = parseNonNegativeNumber(row.rentPricePerDay);
      const quickRentPrice = parseNonNegativeNumber(row.quickRentPrice);
      const purchasePrice = parseNonNegativeNumber(row.purchasePrice);
      const salePrice = parseNonNegativeNumber(row.salePrice);
      if (
        quantity <= 0 ||
        unitCostAmount === null ||
        rentPricePerDay === null ||
        purchasePrice === null ||
        salePrice === null
      ) {
        return null;
      }

      return {
        productId: parseString(row.productId),
        productCode: parseString(row.productCode),
        name: parseString(row.name),
        categoryCode: parseString(row.categoryCode),
        rentPricePerDay,
        quickRentPrice,
        purchasePrice,
        salePrice,
        isRentable: parseOptionalBoolean(row.isRentable),
        isSaleable: parseOptionalBoolean(row.isSaleable),
        material: parseString(row.material),
        gender: parseGender(row.gender),
        description: parseString(row.description),
        coverImageUrl: parseString(row.coverImageUrl),
        quantity,
        unitCostAmount,
        itemSize: parseString(row.itemSize),
        note: parseString(row.note),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (lines.length === 0) return null;

  let expensePayment: CreateProcurementReceiptPayload['expensePayment'] = null;
  if (
    record.expensePayment &&
    typeof record.expensePayment === 'object' &&
    !Array.isArray(record.expensePayment)
  ) {
    expensePayment = parseExpensePayment(record.expensePayment);
  }

  return {
    branchId: parseString(record.branchId),
    intakeChannel: parseIntakeChannel(record.intakeChannel) ?? undefined,
    intakeSourceFileName: parseString(record.intakeSourceFileName),
    supplierName: parseString(record.supplierName),
    supplierPhone: parseString(record.supplierPhone),
    note: parseString(record.note),
    lines,
    expensePayment,
  };
}

export function parseUpdatePayload(
  body: unknown,
): UpdateProcurementReceiptPayload | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;

  const rawLines = Array.isArray(record.lines) ? record.lines : null;
  if (!rawLines) return null;

  const lines = rawLines
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const quantity = parseInteger(row.quantity, 0);
      const unitCostAmount = parseNonNegativeNumber(row.unitCostAmount);
      const rentPricePerDay = parseNonNegativeNumber(row.rentPricePerDay);
      const quickRentPrice = parseNonNegativeNumber(row.quickRentPrice);
      const purchasePrice = parseNonNegativeNumber(row.purchasePrice);
      const salePrice = parseNonNegativeNumber(row.salePrice);
      if (
        quantity <= 0 ||
        unitCostAmount === null ||
        rentPricePerDay === null ||
        purchasePrice === null ||
        salePrice === null
      ) {
        return null;
      }

      return {
        productId: parseString(row.productId),
        productCode: parseString(row.productCode),
        name: parseString(row.name),
        categoryCode: parseString(row.categoryCode),
        rentPricePerDay,
        quickRentPrice,
        purchasePrice,
        salePrice,
        isRentable: parseOptionalBoolean(row.isRentable),
        isSaleable: parseOptionalBoolean(row.isSaleable),
        material: parseString(row.material),
        gender: parseGender(row.gender),
        description: parseString(row.description),
        coverImageUrl: parseString(row.coverImageUrl),
        quantity,
        unitCostAmount,
        itemSize: parseString(row.itemSize),
        note: parseString(row.note),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (lines.length === 0) return null;

  let expensePayment: UpdateProcurementReceiptPayload['expensePayment'] = null;
  if (
    record.expensePayment &&
    typeof record.expensePayment === 'object' &&
    !Array.isArray(record.expensePayment)
  ) {
    expensePayment = parseExpensePayment(record.expensePayment);
  }

  return {
    supplierName: parseString(record.supplierName),
    supplierPhone: parseString(record.supplierPhone),
    note: parseString(record.note),
    lines,
    expensePayment,
  };
}

export function parseImportFormData(
  request: Request,
  options?: { includeCommitFields?: boolean },
): {
  branchId: string | null;
  fileName: string | null;
  fileBuffer: Uint8Array;
  context: {
    defaultCategoryCode?: string | null;
    defaultIsRentable?: boolean | null;
    defaultIsSaleable?: boolean | null;
  };
  intakeSourceFileName?: string | null;
  supplierName?: string | null;
  supplierPhone?: string | null;
  note?: string | null;
  expensePayment?: CreateProcurementReceiptPayload['expensePayment'];
} | null {
  const reqWithFile = request as Request & {
    file?: {
      buffer?: Buffer;
      originalname?: string;
    };
  };
  const fileEntry = reqWithFile.file;
  if (!fileEntry?.buffer || fileEntry.buffer.length === 0) {
    return null;
  }

  const fileBuffer = new Uint8Array(fileEntry.buffer);
  const body = ((request.body ?? {}) as Record<string, unknown>) ?? {};
  const bodyValue = (key: string): unknown => {
    const value = body[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
  };

  const payload = {
    branchId: parseString(bodyValue('branchId')),
    fileName: parseString(fileEntry.originalname),
    fileBuffer,
    context: {
      defaultCategoryCode: parseString(bodyValue('defaultCategoryCode')),
      defaultIsRentable: parseOptionalBoolean(bodyValue('defaultIsRentable')),
      defaultIsSaleable: parseOptionalBoolean(bodyValue('defaultIsSaleable')),
    },
  };

  if (!options?.includeCommitFields) {
    return payload;
  }

  const expensePaymentRaw = parseString(bodyValue('expensePayment'));
  let expensePayment: CreateProcurementReceiptPayload['expensePayment'] = null;
  if (expensePaymentRaw) {
    try {
      expensePayment = parseExpensePayment(
        JSON.parse(expensePaymentRaw) as unknown,
      );
    } catch {
      return null;
    }
  }

  return {
    ...payload,
    intakeSourceFileName:
      parseString(bodyValue('intakeSourceFileName')) ??
      parseString(fileEntry.originalname),
    supplierName: parseString(bodyValue('supplierName')),
    supplierPhone: parseString(bodyValue('supplierPhone')),
    note: parseString(bodyValue('note')),
    expensePayment,
  };
}

export function parseIncompleteExportPayload(
  body: unknown,
): ProcurementImportIncompleteExportPayload | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  if (!Array.isArray(record.rows)) return null;

  const rows = record.rows
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
      }
      const row = entry as Record<string, unknown>;

      const sheetName = parseString(row.sheetName);
      const rowNumber = parseInteger(row.rowNumber, 0);
      const reason = parseString(row.reason);

      if (!sheetName || rowNumber <= 0 || !reason) return null;

      return {
        sheetName,
        rowNumber,
        resolvedAction:
          row.resolvedAction === 'UPDATE_EXISTING' ||
          row.resolvedAction === 'CREATE_NEW'
            ? (row.resolvedAction as ProcurementImportIncompleteRowDto['resolvedAction'])
            : null,
        productCode: parseString(row.productCode),
        generatedProductCode: parseString(row.generatedProductCode),
        productName: parseString(row.productName),
        quantity: parseNonNegativeNumber(row.quantity),
        unitCostAmount: parseNonNegativeNumber(row.unitCostAmount),
        rentPricePerDay: parseNonNegativeNumber(row.rentPricePerDay),
        quickRentPrice: parseNonNegativeNumber(row.quickRentPrice),
        purchasePrice: parseNonNegativeNumber(row.purchasePrice),
        salePrice: parseNonNegativeNumber(row.salePrice),
        itemSize: parseString(row.itemSize),
        note: parseString(row.note),
        reason,
        errors: [],
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return {
    rows,
  };
}
