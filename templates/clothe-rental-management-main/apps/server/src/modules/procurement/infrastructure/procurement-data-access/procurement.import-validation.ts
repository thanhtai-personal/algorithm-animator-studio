import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProcurementImportNormalizedRowDto,
  ProcurementImportValidationErrorDto,
} from '../../types/procurement-module.type';
import { roundMoney, sanitizeText } from './procurement.common';
import { fetchCategoryByCodeMap } from './procurement.product-repo';
import {
  parseImportRowsFromWorkbook,
  createImportValidationError,
} from './procurement.import-parse';
import type {
  ImportValidationResult,
  ImportValidationRow,
  ProcurementActorContext,
  ProcurementImportServerPayload,
  ProcurementProductRow,
} from './procurement.internal-types';

export function buildRowErrorMap(
  errors: ProcurementImportValidationErrorDto[],
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

export async function buildImportValidation(
  supabase: SupabaseClient,
  options: {
    context: ProcurementActorContext;
    payload: ProcurementImportServerPayload;
  },
): Promise<ImportValidationResult> {
  const parsedWorkbook = await parseImportRowsFromWorkbook(options.payload);
  const errors = [...parsedWorkbook.errors];
  const rowErrorMap = buildRowErrorMap(errors);

  const rows = parsedWorkbook.rows;
  const defaultCategoryCode = sanitizeText(
    options.payload.context?.defaultCategoryCode,
  );
  const defaultIsRentable =
    typeof options.payload.context?.defaultIsRentable === 'boolean'
      ? options.payload.context.defaultIsRentable
      : null;
  const defaultIsSaleable =
    typeof options.payload.context?.defaultIsSaleable === 'boolean'
      ? options.payload.context.defaultIsSaleable
      : null;

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
    const matchedProduct: ProcurementProductRow | null = null;
    const resolvedAction = 'CREATE_NEW' as const;

    if (resolvedAction === 'CREATE_NEW' && !row.name) {
      rowErrors.push(
        createImportValidationError(
          row,
          'name',
          'REQUIRED',
          'Thiếu tên sản phẩm cho mã mới.',
        ),
      );
    }

    const effectiveCategoryCode = row.categoryCode ?? defaultCategoryCode;
    if (
      effectiveCategoryCode &&
      !categoryByCodeLower.has(effectiveCategoryCode.toLowerCase())
    ) {
      rowErrors.push(
        createImportValidationError(
          row,
          'category_code',
          'NOT_FOUND',
          `Không tìm thấy category_code: ${effectiveCategoryCode}.`,
        ),
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
      productId: null,
      productCode: row.productCode ?? null,
      willGenerateProductCode: !row.productCode,
      productName: row.name ?? null,
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
