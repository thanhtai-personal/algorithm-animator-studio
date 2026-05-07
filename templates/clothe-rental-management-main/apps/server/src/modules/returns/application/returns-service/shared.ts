import type { Request } from 'express';
import { getAuthenticatedSupabaseClient } from '../../../../common/supabase/request-authenticated-client.util';
import { OrdersDomainError } from '../../../orders/infrastructure/orders.data-access';
import { ReturnOrdersDomainError } from '../../infrastructure/return-orders.data-access';
import type { SettleReturnOrderPayload } from '../../types/return-orders.type';

const ORDER_PAYMENT_METHOD_SET = new Set(['CASH', 'BANK', 'MOMO']);

export interface ReturnsApiResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  isRaw?: boolean;
}

export function jsonResult(
  body: unknown,
  init?: { status?: number },
): ReturnsApiResult {
  return {
    status: init?.status ?? 200,
    body,
  };
}

export function getSearchParams(request: Request): URLSearchParams {
  const sourceUrl =
    (typeof request.originalUrl === 'string' && request.originalUrl) ||
    request.url ||
    '/';
  return new URL(sourceUrl, 'http://localhost').searchParams;
}

export function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDateString(value: unknown): string | null {
  const text = parseString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

export function parseNumeric(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseOrderPaymentMethod(
  value: unknown,
): SettleReturnOrderPayload['additionalCollectionMethod'] | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_METHOD_SET.has(normalized)) return null;
  return normalized as SettleReturnOrderPayload['additionalCollectionMethod'];
}

export function parseInteger(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function unauthorizedResponse(): ReturnsApiResult {
  return jsonResult({ error: 'Unauthorized' }, { status: 401 });
}

export function mapDomainError(error: unknown): ReturnsApiResult {
  if (error instanceof ReturnOrdersDomainError) {
    const withContext =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (
      error.code === 'RETURN_ORDER_SOURCE_REQUIRED' ||
      error.code === 'RETURN_ORDER_STATUS_INVALID' ||
      error.code === 'RETURN_ORDER_ACTUAL_DATE_REQUIRED' ||
      error.code === 'RETURN_ORDER_SETTLE_INVALID'
    ) {
      return jsonResult(withContext, { status: 400 });
    }

    if (error.code === 'RETURN_ORDER_NOT_FOUND') {
      return jsonResult(withContext, { status: 404 });
    }

    if (
      error.code === 'RETURN_ORDER_ALREADY_ACTIVE' ||
      error.code === 'RETURN_ORDER_SOURCE_NOT_ALLOWED' ||
      error.code === 'RETURN_ORDER_STATUS_TRANSITION_INVALID' ||
      error.code === 'RETURN_ORDER_DEPOSIT_REFUND_PENDING'
    ) {
      return jsonResult(withContext, { status: 409 });
    }

    return jsonResult(withContext, { status: 400 });
  }

  if (error instanceof OrdersDomainError) {
    const withContext =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (error.code === 'ORDER_NOT_FOUND') {
      return jsonResult(withContext, { status: 404 });
    }

    if (
      error.code === 'ORDER_STATUS_TRANSITION_INVALID' ||
      error.code === 'RETURN_NOT_ALLOWED' ||
      error.code === 'PICKUP_NOT_ALLOWED' ||
      error.code === 'COMPLETE_NOT_ALLOWED'
    ) {
      return jsonResult(withContext, { status: 409 });
    }

    if (
      error.code === 'PAYMENT_AMOUNT_INVALID' ||
      error.code === 'PAYMENT_REFUND_EXCEEDS_LIMIT' ||
      error.code === 'RETURN_ITEMS_REQUIRED' ||
      error.code === 'RETURN_ITEM_NOT_IN_ORDER' ||
      error.code === 'RETURN_LOST_REQUIRES_INCIDENT' ||
      error.code === 'INVALID_PAYMENT_METHOD' ||
      error.code === 'INVALID_DATE_RANGE'
    ) {
      return jsonResult(withContext, { status: 400 });
    }

    if (error.code === 'FORBIDDEN_MANAGER_ACTION') {
      return jsonResult(withContext, { status: 403 });
    }

    return jsonResult(withContext, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResult({ error: message }, { status: 500 });
}

export async function getAuthedClient(request: Request): Promise<{
  supabase: Awaited<
    ReturnType<typeof getAuthenticatedSupabaseClient>
  >['supabase'];
  profileId: string;
}> {
  const { supabase, userId } = await getAuthenticatedSupabaseClient(request);
  return {
    supabase,
    profileId: userId,
  };
}
