import type {
  MakeupEventStatus,
  MakeupSessionSlot,
} from '../../types/makeup-module.type';

export const DEFAULT_BRANCH_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const SESSION_SLOT_SET = new Set<MakeupSessionSlot>([
  'MORNING',
  'AFTERNOON',
  'EVENING',
]);
export const EVENT_STATUS_SET = new Set<MakeupEventStatus>([
  'BOOKED',
  'COMPLETED',
  'CANCELLED',
]);
export const DEFAULT_EVENT_DURATION_MINUTES = 80;
export const MANAGER_ROLE_SET = new Set(['owner_admin', 'manager']);
export const OPERATOR_ROLE_SET = new Set([
  'owner_admin',
  'manager',
  'staff',
  'accountant',
  'makeup_artist',
  'customer',
]);
export const PACKAGE_EDITOR_ROLE_SET = new Set([
  'owner_admin',
  'manager',
  'makeup_artist',
]);
export const MAKEUP_ADMIN_ROLE_SET = new Set([
  'owner_admin',
  'manager',
  'staff',
]);

export type MakeupDomainErrorCode =
  | 'MISSING_BRANCH_CONTEXT'
  | 'FORBIDDEN_BRANCH_SCOPE'
  | 'FORBIDDEN_ROLE'
  | 'FORBIDDEN_ARTIST_SCOPE'
  | 'MODULE_DISABLED'
  | 'INVALID_DATE'
  | 'INVALID_DATETIME'
  | 'INVALID_DATE_RANGE'
  | 'INVALID_TIME_RANGE'
  | 'INVALID_SESSION_SLOT'
  | 'INVALID_EVENT_STATUS'
  | 'INVALID_BOOKING_INPUT'
  | 'INVALID_NON_NEGATIVE_NUMBER'
  | 'INVALID_DURATION_MINUTES'
  | 'ARTIST_NOT_FOUND'
  | 'CUSTOMER_NOT_FOUND'
  | 'EVENT_NOT_FOUND'
  | 'PACKAGE_NOT_FOUND'
  | 'PACKAGE_CODE_DUPLICATE'
  | 'PACKAGE_TABLE_UNAVAILABLE'
  | 'INVENTORY_ITEM_NOT_FOUND'
  | 'INVALID_SHOPEE_URL'
  | 'PURCHASE_INVOICE_NOT_FOUND'
  | 'PURCHASE_INVOICE_CODE_DUPLICATE'
  | 'INVALID_PURCHASE_INVOICE_STATUS'
  | 'INVALID_PURCHASE_INVOICE_ITEM'
  | 'CONFLICT_WARNING_REQUIRED';

interface MakeupDomainErrorContext {
  [key: string]: unknown;
}

export class MakeupDomainError extends Error {
  readonly code: MakeupDomainErrorCode;
  readonly context: MakeupDomainErrorContext;

  constructor(
    code: MakeupDomainErrorCode,
    context: MakeupDomainErrorContext = {},
  ) {
    super(code);
    this.name = 'MakeupDomainError';
    this.code = code;
    this.context = context;
  }
}

export interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
  is_active: boolean;
}

export interface MakeupEventRow {
  id: string;
  branch_id: string;
  event_date: string;
  session_slot: string;
  artist_profile_id: string | null;
  customer_id: string | null;
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  guest_count: number | null;
  duration_minutes: number | null;
  start_at: string | null;
  end_at: string | null;
  source_input_mode: string | null;
  source_input_text: string | null;
  package_id: string | null;
  status: string;
  note: string | null;
  price_amount: number | string | null;
  surcharge_amount: number | string | null;
  cost_amount: number | string | null;
  is_conflict_warning: boolean;
  conflict_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileNameRow {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
  default_branch_id?: string | null;
  role?: string | null;
}

export interface CustomerRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  profile_id?: string | null;
}

export interface MakeupPackageRow {
  id: string;
  branch_id: string;
  code: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number | string | null;
  cost_amount: number | string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface ActorContext {
  actor: ProfileActorRow;
  role: string | null;
  branchId: string;
  timeZone: string;
}

export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseNumeric(
  value: number | string | null | undefined,
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function normalizeRole(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!normalized) return null;
  if (normalized === 'admin') return 'owner_admin';
  return normalized;
}

export function normalizeSessionSlot(
  value: string | null | undefined,
): MakeupSessionSlot | null {
  const normalized = value?.trim().toUpperCase() ?? '';
  if (!SESSION_SLOT_SET.has(normalized as MakeupSessionSlot)) {
    return null;
  }
  return normalized as MakeupSessionSlot;
}

export function normalizeEventStatus(
  value: string | null | undefined,
): MakeupEventStatus {
  const normalized = value?.trim().toUpperCase() ?? 'BOOKED';
  if (!EVENT_STATUS_SET.has(normalized as MakeupEventStatus)) {
    return 'BOOKED';
  }
  return normalized as MakeupEventStatus;
}

export function assertIsoDate(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new MakeupDomainError('INVALID_DATE', { value });
  }
  return value;
}

export function assertIsoDateTime(value: string | null | undefined): string {
  if (!value) {
    throw new MakeupDomainError('INVALID_DATETIME', { value });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new MakeupDomainError('INVALID_DATETIME', { value });
  }

  return parsed.toISOString();
}

function resolveDefaultStartTimeFromSessionSlot(
  sessionSlot: MakeupSessionSlot,
): string {
  if (sessionSlot === 'MORNING') return '08:00:00';
  if (sessionSlot === 'AFTERNOON') return '13:00:00';
  return '18:00:00';
}

export function resolveSessionSlotByStartAt(
  startAt: string,
  timeZone = DEFAULT_BRANCH_TIMEZONE,
): MakeupSessionSlot {
  const parsed = new Date(startAt);
  if (Number.isNaN(parsed.getTime())) return 'MORNING';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hourCycle: 'h23',
  });

  const hourRaw = formatter
    .formatToParts(parsed)
    .find((part) => part.type === 'hour')?.value;
  const hour = Number.parseInt(hourRaw ?? '8', 10);
  if (!Number.isFinite(hour)) return 'MORNING';

  if (hour < 12) return 'MORNING';
  if (hour < 17) return 'AFTERNOON';
  return 'EVENING';
}

export function buildFallbackEventDateTimeRange(options: {
  eventDate: string;
  sessionSlot: MakeupSessionSlot;
  durationMinutes: number;
}): { startAt: string; endAt: string } {
  const startTime = resolveDefaultStartTimeFromSessionSlot(options.sessionSlot);
  const startAt = new Date(`${options.eventDate}T${startTime}+07:00`);
  const normalizedStart = Number.isNaN(startAt.getTime())
    ? new Date(`${options.eventDate}T08:00:00+07:00`)
    : startAt;

  const endAt = new Date(
    normalizedStart.getTime() + Math.max(1, options.durationMinutes) * 60_000,
  );
  return {
    startAt: normalizedStart.toISOString(),
    endAt: endAt.toISOString(),
  };
}

export function isMissingColumnOrTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const row = error as Record<string, unknown>;
  const code = typeof row.code === 'string' ? row.code.toUpperCase() : '';
  if (code === '42703' || code === '42P01' || code === 'PGRST204') {
    return true;
  }

  const toText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  };

  const message =
    `${toText(row.message)} ${toText(row.details)} ${toText(row.hint)}`.toLowerCase();
  return message.includes('does not exist') || message.includes('schema cache');
}

export function validateNonNegativeNumber(
  value: number | null | undefined,
  field: string,
): number {
  const parsed = roundMoney(parseNumeric(value));
  if (parsed < 0) {
    throw new MakeupDomainError('INVALID_NON_NEGATIVE_NUMBER', {
      field,
      value,
    });
  }

  return parsed;
}
