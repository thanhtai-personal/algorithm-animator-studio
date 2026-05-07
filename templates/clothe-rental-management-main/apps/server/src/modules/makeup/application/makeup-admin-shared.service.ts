import type { Request } from 'express';
import { readJsonBody as readRequestJsonBody } from '../../../common/http/request-body.util';
import { getAuthenticatedSupabaseClient } from '../../../common/supabase/request-authenticated-client.util';
import { MakeupDomainError } from '../infrastructure/makeup.data-access';
import type {
  MakeupBookingInputMode,
  MakeupEventStatus,
  MakeupPurchaseInvoiceStatus,
  MakeupSessionSlot,
} from '../types/makeup-module.type';

const SESSION_SLOT_SET = new Set<MakeupSessionSlot>([
  'MORNING',
  'AFTERNOON',
  'EVENING',
]);
const EVENT_STATUS_SET = new Set<MakeupEventStatus>([
  'BOOKED',
  'COMPLETED',
  'CANCELLED',
]);
const PURCHASE_INVOICE_STATUS_SET = new Set<MakeupPurchaseInvoiceStatus>([
  'DRAFT',
  'CONFIRMED',
  'PAID',
  'CANCELLED',
]);
const INPUT_MODE_SET = new Set<MakeupBookingInputMode>(['VOICE', 'TEXT']);

export interface MakeupApiResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  isRaw?: boolean;
}

export function jsonResult(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> },
): MakeupApiResult {
  return {
    status: init?.status ?? 200,
    body,
    headers: init?.headers,
  };
}

export function getSearchParams(request: Request): URLSearchParams {
  const sourceUrl =
    (typeof request.originalUrl === 'string' && request.originalUrl) ||
    request.url ||
    '/';
  return new URL(sourceUrl, 'http://localhost').searchParams;
}

export function readJsonBody(request: Request): unknown {
  return readRequestJsonBody(request);
}

export function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDateString(value: unknown): string | null {
  const text = parseString(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

export function parseDateTimeString(value: unknown): string | null {
  const text = parseString(value);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return undefined;
}

export function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseSessionSlot(value: unknown): MakeupSessionSlot | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!SESSION_SLOT_SET.has(normalized as MakeupSessionSlot)) return null;
  return normalized as MakeupSessionSlot;
}

export function parseEventStatus(value: unknown): MakeupEventStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!EVENT_STATUS_SET.has(normalized as MakeupEventStatus)) return null;
  return normalized as MakeupEventStatus;
}

export function parsePurchaseInvoiceStatus(
  value: unknown,
): MakeupPurchaseInvoiceStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (
    !PURCHASE_INVOICE_STATUS_SET.has(normalized as MakeupPurchaseInvoiceStatus)
  ) {
    return null;
  }
  return normalized as MakeupPurchaseInvoiceStatus;
}

export function parseInputMode(value: unknown): MakeupBookingInputMode | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!INPUT_MODE_SET.has(normalized as MakeupBookingInputMode)) return null;
  return normalized as MakeupBookingInputMode;
}

export async function getAuthedClient(request: Request) {
  const { supabase, userId } = await getAuthenticatedSupabaseClient(request);
  return { supabase, profileId: userId };
}

export function unauthorizedResponse(): MakeupApiResult {
  return jsonResult({ error: 'Unauthorized' }, { status: 401 });
}

export function mapMakeupDomainError(error: unknown): MakeupApiResult {
  if (error instanceof MakeupDomainError) {
    const payload =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (
      error.code === 'MISSING_BRANCH_CONTEXT' ||
      error.code === 'MODULE_DISABLED' ||
      error.code === 'PURCHASE_INVOICE_CODE_DUPLICATE'
    ) {
      return jsonResult(payload, { status: 409 });
    }
    if (
      error.code === 'FORBIDDEN_BRANCH_SCOPE' ||
      error.code === 'FORBIDDEN_ROLE' ||
      error.code === 'FORBIDDEN_ARTIST_SCOPE'
    ) {
      return jsonResult(payload, { status: 403 });
    }
    if (
      error.code === 'INVENTORY_ITEM_NOT_FOUND' ||
      error.code === 'PURCHASE_INVOICE_NOT_FOUND' ||
      error.code === 'EVENT_NOT_FOUND'
    ) {
      return jsonResult(payload, { status: 404 });
    }
    return jsonResult(payload, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResult({ error: message }, { status: 500 });
}
