import type { Request } from 'express';
import { getAuthenticatedSupabaseClient } from '../../../../common/supabase/request-authenticated-client.util';
import { ProcurementDomainError } from '../../infrastructure/procurement.data-access';
import type { ProcurementApiResult } from './types';

export function jsonResult(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> },
): ProcurementApiResult {
  return {
    status: init?.status ?? 200,
    body,
    headers: init?.headers,
  };
}

function rawResult(
  body: string | ArrayBuffer | Buffer | Uint8Array,
  init?: { status?: number; headers?: Record<string, string> },
): ProcurementApiResult {
  return {
    status: init?.status ?? 200,
    body,
    headers: init?.headers,
    isRaw: true,
  };
}

export function getSearchParams(request: Request): URLSearchParams {
  const sourceUrl =
    (typeof request.originalUrl === 'string' && request.originalUrl) ||
    request.url ||
    '/';
  return new URL(sourceUrl, 'http://localhost').searchParams;
}

export async function getAuthedClient(request: Request) {
  const { supabase, userId } = await getAuthenticatedSupabaseClient(request);
  return {
    supabase,
    profileId: userId,
  };
}

export function unauthorizedResponse() {
  return jsonResult({ error: 'Unauthorized' }, { status: 401 });
}

export function mapDomainError(error: unknown): ProcurementApiResult {
  if (error instanceof ProcurementDomainError) {
    const withContext =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (
      error.code === 'INVALID_DATE_RANGE' ||
      error.code === 'INVALID_INTAKE_CHANNEL' ||
      error.code === 'INVALID_PAYMENT_METHOD' ||
      error.code === 'INVALID_PAYMENT_AMOUNT' ||
      error.code === 'INVALID_LINE_PAYLOAD' ||
      error.code === 'IMPORT_FILE_EMPTY' ||
      error.code === 'IMPORT_FILE_INVALID' ||
      error.code === 'IMPORT_TEMPLATE_INVALID'
    ) {
      return jsonResult(withContext, { status: 400 });
    }

    if (
      error.code === 'RECEIPT_NOT_FOUND' ||
      error.code === 'PRODUCT_NOT_FOUND' ||
      error.code === 'CATEGORY_NOT_FOUND'
    ) {
      return jsonResult(withContext, { status: 404 });
    }

    if (
      error.code === 'FORBIDDEN_PROCUREMENT_ACCESS' ||
      error.code === 'FORBIDDEN_BRANCH_SCOPE' ||
      error.code === 'FORBIDDEN_PROCUREMENT_ROLLBACK'
    ) {
      return jsonResult(withContext, { status: 403 });
    }

    if (
      error.code === 'MISSING_BRANCH_CONTEXT' ||
      error.code === 'IMPORT_VALIDATION_FAILED' ||
      error.code === 'IMPORT_SHEET_MISSING' ||
      error.code === 'PROCUREMENT_RECEIPT_IMMUTABLE' ||
      error.code === 'PROCUREMENT_RECEIPT_ALREADY_ROLLED_BACK' ||
      error.code === 'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_COUNT_MISMATCH' ||
      error.code === 'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_STATUS_BLOCKED' ||
      error.code === 'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_IN_USE'
    ) {
      return jsonResult(withContext, { status: 409 });
    }

    return jsonResult(withContext, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResult({ error: message }, { status: 500 });
}

export function buildXlsxResponse(
  buffer: Uint8Array,
  fileName: string,
): ProcurementApiResult {
  return rawResult(buffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=${fileName}`,
    },
  });
}
