import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { readJsonBodyAsRecord } from '../../../common/http/request-body.util';
import { getAuthenticatedSupabaseClient } from '../../../common/supabase/request-authenticated-client.util';

import {
  createManualPaymentForAdmin,
  exportPaymentsCsvForAdmin,
  listPaymentAttachmentsForActor,
  listPaymentsForAdmin,
  PaymentsDomainError,
  preparePaymentReceiptUploadForActor,
  updateManualPaymentForAdmin,
  updatePaymentStatusForAdmin,
} from '../infrastructure/payments.data-access';
import {
  notifyPaymentException,
  runNotificationSideEffect,
} from '../infrastructure/payments.notification-side-effects';
import type {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderPaymentType,
} from '../../orders/types/orders-domain.type';
import type {
  CreatePosManualPaymentPayload,
  PreparePaymentReceiptUploadPayload,
} from '../types/payments-domain.type';
import type { UpdateManualPaymentPayload } from '../types/payments-domain.type';

const ORDER_PAYMENT_TYPE_SET = new Set<string>([
  'RENT',
  'DEPOSIT',
  'FEE',
  'REFUND',
  'EXPENSE',
]);
const ORDER_PAYMENT_METHOD_SET = new Set<string>(['CASH', 'BANK', 'MOMO']);
const ORDER_PAYMENT_STATUS_SET = new Set<string>(['POSTED', 'VOIDED']);
const POS_MANUAL_PAYMENT_TYPE_SET = new Set<string>(['FEE', 'EXPENSE']);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 80;

export interface PaymentsApiResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  isRaw?: boolean;
}

function jsonResult(
  body: unknown,
  init?: { status?: number },
): PaymentsApiResult {
  return {
    status: init?.status ?? 200,
    body,
  };
}

function rawResult(
  body: string | ArrayBuffer,
  init?: { status?: number; headers?: Record<string, string> },
): PaymentsApiResult {
  return {
    status: init?.status ?? 200,
    body,
    headers: init?.headers,
    isRaw: true,
  };
}

function getSearchParams(request: Request): URLSearchParams {
  const sourceUrl =
    (typeof request.originalUrl === 'string' && request.originalUrl) ||
    request.url ||
    '/';
  return new URL(sourceUrl, 'http://localhost').searchParams;
}

function parseString(value: unknown): string | null {
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

function parseInteger(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseOrderPaymentType(value: unknown): OrderPaymentType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_TYPE_SET.has(normalized)) return null;
  return normalized as OrderPaymentType;
}

function parseOrderPaymentMethod(value: unknown): OrderPaymentMethod | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_METHOD_SET.has(normalized)) return null;
  return normalized as OrderPaymentMethod;
}

function parseOrderPaymentStatus(value: unknown): OrderPaymentStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_STATUS_SET.has(normalized)) return null;
  return normalized as OrderPaymentStatus;
}

function parsePosManualPaymentType(
  value: unknown,
): CreatePosManualPaymentPayload['type'] | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!POS_MANUAL_PAYMENT_TYPE_SET.has(normalized)) return null;
  return normalized as CreatePosManualPaymentPayload['type'];
}

function parsePositiveAmount(value: unknown): number | null {
  let parsed: number;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && value.trim()) {
    parsed = Number(value.trim());
  } else {
    return null;
  }

  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseNonEmptyReason(value: unknown): string | null {
  const parsed = parseString(value);
  return parsed ?? null;
}

function parseStringArray(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const parsed = value
    .map((entry) => parseString(entry))
    .filter((entry): entry is string => Boolean(entry));
  return parsed.length === value.length ? parsed : null;
}

function parseCreateReceiptUploadPayload(
  body: Record<string, unknown>,
): PreparePaymentReceiptUploadPayload | null {
  const fileName = parseString(body.fileName);
  const mimeType = parseString(body.mimeType);
  const sizeBytes = parsePositiveAmount(body.sizeBytes);
  if (!fileName || !mimeType || sizeBytes === null) return null;

  return {
    branchId: parseString(body.branchId),
    fileName,
    mimeType,
    sizeBytes,
  };
}

function parseCreatePosManualPaymentPayload(
  body: Record<string, unknown>,
): CreatePosManualPaymentPayload | null {
  const type = parsePosManualPaymentType(body.type);
  const method = parseOrderPaymentMethod(body.method);
  const amount = parsePositiveAmount(body.amount);
  const reason = parseString(body.reason);
  if (!type || !method || amount === null || !reason) {
    return null;
  }
  const receiptUploadSessionIds = parseStringArray(
    body.receiptUploadSessionIds,
  );
  if (!receiptUploadSessionIds) return null;

  return {
    branchId:
      body.branchId === undefined ? undefined : parseString(body.branchId),
    type,
    method,
    amount,
    reason,
    note: body.note === undefined ? undefined : parseString(body.note),
    referenceCode:
      body.referenceCode === undefined
        ? undefined
        : parseString(body.referenceCode),
    isImportOrder: body.isImportOrder === true,
    isInitialCapital: body.isInitialCapital === true,
    receiptUploadSessionIds,
  };
}

function parseUpdateManualPaymentPayload(
  body: Record<string, unknown>,
): UpdateManualPaymentPayload | null {
  const payload: UpdateManualPaymentPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'type')) {
    const type = parsePosManualPaymentType(body.type);
    if (!type) return null;
    payload.type = type;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'method')) {
    const method = parseOrderPaymentMethod(body.method);
    if (!method) return null;
    payload.method = method;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
    const amount = parsePositiveAmount(body.amount);
    if (amount === null) return null;
    payload.amount = amount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'reason')) {
    const reason = parseNonEmptyReason(body.reason);
    if (!reason) return null;
    payload.reason = reason;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'note')) {
    if (body.note === null) {
      payload.note = null;
    } else {
      const note = parseString(body.note);
      if (body.note !== undefined && note === null) return null;
      payload.note = note;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'referenceCode')) {
    if (body.referenceCode === null) {
      payload.referenceCode = null;
    } else {
      const referenceCode = parseString(body.referenceCode);
      if (body.referenceCode !== undefined && referenceCode === null) {
        return null;
      }
      payload.referenceCode = referenceCode;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isInitialCapital')) {
    if (typeof body.isInitialCapital !== 'boolean') return null;
    payload.isInitialCapital = body.isInitialCapital;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'receiptUploadSessionIds')) {
    const receiptUploadSessionIds = parseStringArray(
      body.receiptUploadSessionIds,
    );
    if (!receiptUploadSessionIds) return null;
    payload.receiptUploadSessionIds = receiptUploadSessionIds;
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

async function getAuthedClient(request: Request) {
  const { supabase, userId } = await getAuthenticatedSupabaseClient(request);
  return {
    supabase,
    profileId: userId,
  };
}

function unauthorizedResponse() {
  return jsonResult({ error: 'Unauthorized' }, { status: 401 });
}

function mapDomainError(error: unknown): PaymentsApiResult {
  if (error instanceof PaymentsDomainError) {
    const withContext =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (
      error.code === 'INVALID_DATE_RANGE' ||
      error.code === 'INVALID_PAYMENT_TYPE' ||
      error.code === 'INVALID_PAYMENT_METHOD' ||
      error.code === 'INVALID_PAYMENT_STATUS' ||
      error.code === 'INVALID_PAYMENT_AMOUNT' ||
      error.code === 'INVALID_PAYMENT_REASON' ||
      error.code === 'INVALID_PAYMENT_UPDATE_PAYLOAD' ||
      error.code === 'INVALID_RECEIPT_UPLOAD'
    ) {
      return jsonResult(withContext, { status: 400 });
    }

    if (
      error.code === 'PAYMENT_NOT_FOUND' ||
      error.code === 'RECEIPT_UPLOAD_SESSION_NOT_FOUND'
    ) {
      return jsonResult(withContext, { status: 404 });
    }

    if (
      error.code === 'FORBIDDEN_MANAGER_ACTION' ||
      error.code === 'FORBIDDEN_PAYMENT_CREATE' ||
      error.code === 'FORBIDDEN_PAYMENT_UPDATE' ||
      error.code === 'FORBIDDEN_PAYMENT_STATUS_UPDATE' ||
      error.code === 'FORBIDDEN_PAYMENT_EXPORT' ||
      error.code === 'FORBIDDEN_BRANCH_SCOPE'
    ) {
      return jsonResult(withContext, { status: 403 });
    }

    if (
      error.code === 'PAYMENT_STATUS_TRANSITION_INVALID' ||
      error.code === 'PAYMENT_EDIT_NOT_ALLOWED' ||
      error.code === 'MISSING_BRANCH_CONTEXT' ||
      error.code === 'RECEIPT_UPLOAD_SESSION_EXPIRED'
    ) {
      return jsonResult(withContext, { status: 409 });
    }

    if (error.code === 'PAYMENT_ATTACHMENT_SCHEMA_NOT_READY') {
      return jsonResult(withContext, { status: 503 });
    }

    return jsonResult(withContext, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResult({ error: message }, { status: 500 });
}

export async function handleGetPayments(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const page = parseInteger(searchParams.get('page'), 1);
    const pageSize = Math.min(
      parseInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );

    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
    const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

    if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
      return jsonResult(
        { error: 'startDate/endDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const typeRaw = searchParams.get('type');
    const methodRaw = searchParams.get('method');
    const type = typeRaw ? parseOrderPaymentType(typeRaw) : null;
    const method = methodRaw ? parseOrderPaymentMethod(methodRaw) : null;

    if (typeRaw && !type) {
      return jsonResult(
        { error: 'Invalid payment type filter' },
        { status: 400 },
      );
    }

    if (methodRaw && !method) {
      return jsonResult(
        { error: 'Invalid payment method filter' },
        { status: 400 },
      );
    }

    const result = await listPaymentsForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate,
        endDate,
        type,
        method,
        page,
        pageSize,
      },
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleExportPaymentsCsv(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
    const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

    if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
      return jsonResult(
        { error: 'startDate/endDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const typeRaw = searchParams.get('type');
    const methodRaw = searchParams.get('method');
    const type = typeRaw ? parseOrderPaymentType(typeRaw) : null;
    const method = methodRaw ? parseOrderPaymentMethod(methodRaw) : null;

    if (typeRaw && !type) {
      return jsonResult(
        { error: 'Invalid payment type filter' },
        { status: 400 },
      );
    }

    if (methodRaw && !method) {
      return jsonResult(
        { error: 'Invalid payment method filter' },
        { status: 400 },
      );
    }

    const csv = await exportPaymentsCsvForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate,
        endDate,
        type,
        method,
      },
    });

    const suffix = new Date().toISOString().slice(0, 10);
    return rawResult(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=payments-${suffix}.csv`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchPaymentStatus(
  request: Request,
  paymentId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const status = parseOrderPaymentStatus(body.status);
    if (!status) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await updatePaymentStatusForAdmin(supabase, {
      actorProfileId: profileId,
      paymentId,
      payload: {
        status,
        voidReason:
          body.voidReason === undefined
            ? undefined
            : parseString(body.voidReason),
      },
    });

    await runNotificationSideEffect(async () => {
      await notifyPaymentException({
        item: result,
        actorProfileId: profileId,
      });
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchPayment(request: Request, paymentId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);
    const payload = parseUpdateManualPaymentPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await updateManualPaymentForAdmin(supabase, {
      actorProfileId: profileId,
      paymentId,
      payload,
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePostPaymentReceiptUpload(
  request: Request,
  body: Record<string, unknown>,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const payload = parseCreateReceiptUploadPayload(body);
    if (!payload) {
      return jsonResult(
        { error: 'Invalid receipt upload payload' },
        { status: 400 },
      );
    }

    const result = await preparePaymentReceiptUploadForActor(supabase, {
      actorProfileId: profileId,
      payload,
    });
    return jsonResult(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetPaymentAttachments(
  request: Request,
  paymentId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const result = await listPaymentAttachmentsForActor(supabase, {
      actorProfileId: profileId,
      paymentId,
    });
    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePostManualPayment(
  request: Request,
  body: Record<string, unknown>,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const payload = parseCreatePosManualPaymentPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await createManualPaymentForAdmin(supabase, {
      actorProfileId: profileId,
      payload,
    });
    return jsonResult(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

@Injectable()
export class PaymentsService {
  getPayments(request: Request): Promise<PaymentsApiResult> {
    return handleGetPayments(request);
  }

  postManualPayment(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<PaymentsApiResult> {
    return handlePostManualPayment(request, body);
  }

  postPaymentReceiptUpload(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<PaymentsApiResult> {
    return handlePostPaymentReceiptUpload(request, body);
  }

  getPaymentAttachments(
    request: Request,
    paymentId: string,
  ): Promise<PaymentsApiResult> {
    return handleGetPaymentAttachments(request, paymentId);
  }

  exportPaymentsCsv(request: Request): Promise<PaymentsApiResult> {
    return handleExportPaymentsCsv(request);
  }

  patchPaymentStatus(
    request: Request,
    paymentId: string,
  ): Promise<PaymentsApiResult> {
    return handlePatchPaymentStatus(request, paymentId);
  }

  patchPayment(
    request: Request,
    paymentId: string,
  ): Promise<PaymentsApiResult> {
    return handlePatchPayment(request, paymentId);
  }
}
