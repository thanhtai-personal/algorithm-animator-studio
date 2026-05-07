import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProcurementImportIncompleteExportPayload,
  ProcurementImportValidationResponse,
} from '../../types/procurement-module.type';
import { TEMPLATE_COLUMNS } from './procurement.constants';
import { resolveTemplateLocale, sanitizeText } from './procurement.common';
import { resolveProcurementActorContext } from './procurement.actor-context';
import { buildImportValidation } from './procurement.import-validation';
import {
  buildIncompleteWorkbookBuffer,
  buildTemplateWorkbookBuffer,
} from './procurement.export-helpers';
import type {
  ImportValidationResult,
  ProcurementImportServerPayload,
} from './procurement.internal-types';

function toImportValidationResponse(
  result: ImportValidationResult,
): ProcurementImportValidationResponse {
  return {
    branchId: result.branchId,
    sheetName: result.sheetName,
    isValid: result.errors.length === 0,
    summary: {
      totalRows: result.rows.length,
      validRows: result.normalizedRows.length,
      invalidRows: Math.max(
        0,
        result.rows.length - result.normalizedRows.length,
      ),
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
  },
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

export async function exportProcurementTemplateXlsxBuffer(
  locale?: string | null,
): Promise<Uint8Array> {
  return buildTemplateWorkbookBuffer(resolveTemplateLocale(locale));
}

export async function exportProcurementIncompleteRowsXlsxBuffer(
  payload: ProcurementImportIncompleteExportPayload,
): Promise<Uint8Array> {
  return buildIncompleteWorkbookBuffer(payload);
}
