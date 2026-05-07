import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProcurementImportCommitResponse,
  ProcurementImportIncompleteRowDto,
  ProcurementImportNormalizedRowDto,
} from '../../types/procurement-module.type';
import { roundMoney, sanitizeText } from './procurement.common';
import {
  getErrorMessage,
  ProcurementDomainError,
  toErrorRecord,
} from './procurement.domain-error';
import { resolveProcurementActorContext } from './procurement.actor-context';
import { buildImportValidation } from './procurement.import-validation';
import { createProcurementReceiptForActor } from './procurement.create-receipt';
import type {
  ImportValidationRow,
  ProcurementImportCommitServerPayload,
} from './procurement.internal-types';

function mapValidationRowToIncompleteRow(
  row: ImportValidationRow,
): ProcurementImportIncompleteRowDto {
  const reason =
    row.errors.length > 0
      ? row.errors.map((error) => error.message).join(' | ')
      : 'Row is incomplete.';

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
  reason: string,
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
  },
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

  const normalizedRowsByKey = new Map<
    string,
    ProcurementImportNormalizedRowDto
  >(
    validationResult.normalizedRows.map((row) => [
      `${row.sheetName}::${row.rowNumber}`,
      row,
    ]),
  );
  const incompleteRows: ProcurementImportIncompleteRowDto[] = [];
  const normalizedCommitRows: ProcurementImportNormalizedRowDto[] = [];

  for (const row of validationResult.rows) {
    if (row.errors.length > 0) {
      incompleteRows.push(mapValidationRowToIncompleteRow(row));
      continue;
    }

    const normalized = normalizedRowsByKey.get(
      `${row.parsed.sheetName}::${row.parsed.rowNumber}`,
    );
    if (!normalized) {
      incompleteRows.push(mapValidationRowToIncompleteRow(row));
      continue;
    }
    normalizedCommitRows.push(normalized);
  }

  if (incompleteRows.length > 0) {
    const rowKeySet = new Set(
      incompleteRows.map((row) => `${row.sheetName}::${row.rowNumber}`),
    );
    for (const row of normalizedCommitRows) {
      const key = `${row.sheetName}::${row.rowNumber}`;
      if (rowKeySet.has(key)) continue;
      incompleteRows.push(
        mapRuntimeFailureToIncompleteRow(
          row,
          'Import chỉ được xác nhận khi tất cả dòng hợp lệ.',
        ),
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

  let receipt = null;
  if (normalizedCommitRows.length > 0) {
    try {
      receipt = await createProcurementReceiptForActor(supabase, {
        actorProfileId: options.actorProfileId,
        payload: {
          branchId: context.branchId,
          intakeChannel: 'EXCEL',
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
      let reason =
        error instanceof ProcurementDomainError
          ? error.code
          : (getErrorMessage(error) ?? 'IMPORT_COMMIT_FAILED');

      const errorRecord = toErrorRecord(error);
      if (
        errorRecord &&
        (errorRecord.code === '23514' || errorRecord.code === 23514) &&
        typeof errorRecord.message === 'string' &&
        errorRecord.message.includes('products_gender_check')
      ) {
        reason =
          'Invalid product gender value (allowed: female, male, unisex, other)';
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
            productId: line?.productId ?? row.productId ?? null,
            productCode: line?.productCodeSnapshot ?? row.productCode ?? null,
            productName: line?.productNameSnapshot ?? row.productName ?? null,
            quantity: line?.quantity ?? row.quantity ?? 0,
            unitCostAmount: line?.unitCostAmount ?? row.unitCostAmount ?? 0,
            lineTotalAmount:
              line?.lineTotalAmount ??
              roundMoney((row.quantity ?? 0) * (row.unitCostAmount ?? 0)),
            generatedProductCode:
              row.productCode === null && Boolean(line?.productCodeSnapshot),
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
