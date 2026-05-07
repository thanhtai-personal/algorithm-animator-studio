import ExcelJS from 'exceljs';
import {
  MAX_IMPORT_ROW_COUNT,
  TEMPLATE_REQUIRED_COLUMNS,
  DEFAULT_IMPORT_SHEET_NAME,
} from './procurement.constants';
import { ProcurementDomainError } from './procurement.domain-error';
import {
  normalizeColumnToken,
  parseExcelCellText,
  parseOptionalBoolean,
  parseOptionalGender,
  parseRequiredInteger,
  parseRequiredNonNegativeNumber,
  resolveTemplateColumnFromHeaderToken,
  sanitizeText,
} from './procurement.common';
import type {
  ImportErrorColumn,
  ParsedImportRow,
  ProcurementImportServerPayload,
} from './procurement.internal-types';
import type {
  ProcurementImportErrorCode,
  ProcurementImportValidationErrorDto,
} from '../../types/procurement-module.type';

export function createImportValidationError(
  row: ParsedImportRow,
  column: ImportErrorColumn,
  code: ProcurementImportErrorCode,
  message: string,
): ProcurementImportValidationErrorDto {
  return {
    sheetName: row.sheetName,
    rowNumber: row.rowNumber,
    column,
    code,
    message,
  };
}

export async function parseImportRowsFromWorkbook(
  payload: ProcurementImportServerPayload,
): Promise<{
  sheetName: string;
  rows: ParsedImportRow[];
  errors: ProcurementImportValidationErrorDto[];
}> {
  if (!payload.fileBuffer || payload.fileBuffer.length === 0) {
    throw new ProcurementDomainError('IMPORT_FILE_EMPTY', {
      reason: 'empty-file',
    });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await (
      workbook.xlsx as unknown as { load: (input: unknown) => Promise<unknown> }
    ).load(payload.fileBuffer);
  } catch (error) {
    throw new ProcurementDomainError('IMPORT_FILE_INVALID', {
      reason: 'invalid-xlsx',
      detail: error instanceof Error ? error.message : 'parse-failed',
    });
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new ProcurementDomainError('IMPORT_SHEET_MISSING', {
      reason: 'missing-worksheet',
    });
  }

  if (worksheet.rowCount - 1 > MAX_IMPORT_ROW_COUNT) {
    throw new ProcurementDomainError('IMPORT_FILE_INVALID', {
      reason: 'row-limit-exceeded',
      maxRows: MAX_IMPORT_ROW_COUNT,
      rowCount: Math.max(worksheet.rowCount - 1, 0),
    });
  }

  const sheetName = sanitizeText(worksheet.name) ?? DEFAULT_IMPORT_SHEET_NAME;
  const headerRow = worksheet.getRow(1);
  const headerMap = new Map<string, number>();

  for (
    let columnIndex = 1;
    columnIndex <= headerRow.cellCount;
    columnIndex += 1
  ) {
    const token = normalizeColumnToken(
      parseExcelCellText(headerRow.getCell(columnIndex).value ?? null),
    );
    const resolvedColumn = resolveTemplateColumnFromHeaderToken(token);
    if (!resolvedColumn) continue;
    if (!headerMap.has(resolvedColumn)) {
      headerMap.set(resolvedColumn, columnIndex);
    }
  }

  const errors: ProcurementImportValidationErrorDto[] = [];
  const missingColumns = Array.from(TEMPLATE_REQUIRED_COLUMNS).filter(
    (column) => !headerMap.has(column),
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
          'REQUIRED',
          `Thiếu cột bắt buộc: ${missingColumn}.`,
        ),
      );
    }

    return {
      sheetName,
      rows: [],
      errors,
    };
  }

  const rows: ParsedImportRow[] = [];

  const readColumn = (row: ExcelJS.Row, column: string): string | null => {
    const columnIndex = headerMap.get(column);
    if (!columnIndex) return null;
    return parseExcelCellText(row.getCell(columnIndex).value ?? null);
  };

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const productCodeRaw = readColumn(row, 'product_code');
    const nameRaw = readColumn(row, 'name');
    const quantityRaw = readColumn(row, 'quantity');
    const rentPricePerDayRaw = readColumn(row, 'rent_price_per_day');
    const quickRentPriceRaw = readColumn(row, 'quick_rent_price');
    const purchasePriceRaw = readColumn(row, 'purchase_price');
    const salePriceRaw = readColumn(row, 'sale_price');
    const categoryCodeRaw = readColumn(row, 'category_code');
    const isRentableRaw = readColumn(row, 'is_rentable');
    const isSaleableRaw = readColumn(row, 'is_saleable');
    const materialRaw = readColumn(row, 'material');
    const genderRaw = readColumn(row, 'gender');
    const descriptionRaw = readColumn(row, 'description');
    const coverImageUrlRaw = readColumn(row, 'cover_image_url');
    const itemSizeRaw = readColumn(row, 'item_size');
    const noteRaw = readColumn(row, 'note');

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

    // Ignore incomplete lines without product name in Excel import.
    // Business request: rows missing name should be skipped entirely.
    if (!sanitizeText(nameRaw)) {
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
          'quantity',
          quantityResult.errorCode,
          quantityResult.errorCode === 'REQUIRED'
            ? 'Thiếu số lượng.'
            : 'Số lượng phải là số nguyên dương.',
        ),
      );
    } else {
      parsedRow.quantity = quantityResult.value;
    }

    const rentPricePerDayResult =
      parseRequiredNonNegativeNumber(rentPricePerDayRaw);
    if (rentPricePerDayResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          'rent_price_per_day',
          rentPricePerDayResult.errorCode,
          rentPricePerDayResult.errorCode === 'REQUIRED'
            ? 'Thiếu giá thuê.'
            : 'Giá thuê phải >= 0.',
        ),
      );
    } else {
      parsedRow.rentPricePerDay = rentPricePerDayResult.value;
    }

    const quickRentPriceText = sanitizeText(quickRentPriceRaw);
    if (quickRentPriceText) {
      const quickRentPriceResult =
        parseRequiredNonNegativeNumber(quickRentPriceRaw);
      if (quickRentPriceResult.errorCode) {
        errors.push(
          createImportValidationError(
            parsedRow,
            'quick_rent_price',
            quickRentPriceResult.errorCode,
            'Giá thuê nhanh phải >= 0.',
          ),
        );
      } else {
        parsedRow.quickRentPrice = quickRentPriceResult.value;
      }
    }

    const purchasePriceResult =
      parseRequiredNonNegativeNumber(purchasePriceRaw);
    if (purchasePriceResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          'purchase_price',
          purchasePriceResult.errorCode,
          purchasePriceResult.errorCode === 'REQUIRED'
            ? 'Thiếu giá nhập.'
            : 'Giá nhập phải >= 0.',
        ),
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
          'sale_price',
          salePriceResult.errorCode,
          salePriceResult.errorCode === 'REQUIRED'
            ? 'Thiếu giá bán.'
            : 'Giá bán phải >= 0.',
        ),
      );
    } else {
      parsedRow.salePrice = salePriceResult.value;
    }

    const isRentableResult = parseOptionalBoolean(isRentableRaw);
    if (isRentableResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          'is_rentable',
          isRentableResult.errorCode,
          'is_rentable chỉ nhận true/false hoặc 1/0.',
        ),
      );
    } else {
      parsedRow.isRentable = isRentableResult.value;
    }

    const isSaleableResult = parseOptionalBoolean(isSaleableRaw);
    if (isSaleableResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          'is_saleable',
          isSaleableResult.errorCode,
          'is_saleable chỉ nhận true/false hoặc 1/0.',
        ),
      );
    } else {
      parsedRow.isSaleable = isSaleableResult.value;
    }

    const genderResult = parseOptionalGender(genderRaw);
    if (genderResult.errorCode) {
      errors.push(
        createImportValidationError(
          parsedRow,
          'gender',
          genderResult.errorCode,
          'gender chỉ nhận female/male/unisex/nam/nu/other.',
        ),
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
