import type {
  OrderIncidentStatus,
  OrderIncidentType,
} from '../../../orders/types/orders-domain.type';

export const SUPPORTED_ROLE_SET = new Set([
  'owner_admin',
  'manager',
  'staff',
  'accountant',
]);
export const MANAGER_PLUS_ROLE_SET = new Set(['owner_admin', 'manager']);

const ORDER_INCIDENT_TYPE_SET = new Set<string>([
  'LATE',
  'DAMAGE',
  'LOST',
  'CLEANING',
]);
const ORDER_INCIDENT_STATUS_SET = new Set<string>([
  'OPEN',
  'SETTLED',
  'WAIVED',
]);

export const TOP_RENTALS_LIMIT = 10;
export const DEFAULT_BRANCH_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DEFAULT_CURRENCY_CODE = 'VND';
export const DEFAULT_REPORT_RANGE_DAYS = 30;
export const MAX_REPORT_RANGE_DAYS = 370;

type ReportsDomainErrorCode =
  | 'MISSING_BRANCH_CONTEXT'
  | 'FORBIDDEN_BRANCH_SCOPE'
  | 'FORBIDDEN_MANAGER_ACTION'
  | 'FORBIDDEN_REPORT_EXPORT'
  | 'INVALID_DATE_RANGE'
  | 'DATE_RANGE_TOO_LARGE'
  | 'INVALID_INCIDENT_TYPE';

interface ReportsDomainErrorContext {
  [key: string]: unknown;
}

export class ReportsDomainError extends Error {
  readonly code: ReportsDomainErrorCode;
  readonly context: ReportsDomainErrorContext;

  constructor(
    code: ReportsDomainErrorCode,
    context: ReportsDomainErrorContext = {},
  ) {
    super(code);
    this.name = 'ReportsDomainError';
    this.code = code;
    this.context = context;
  }
}

export interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}

export interface ProfileBranchAccessRow {
  branch_id: string;
}

export interface BranchRow {
  id: string;
  timezone: string | null;
  currency_code: string | null;
}

export interface ProductRow {
  id: string;
  name: string | null;
  category_id: string | null;
}

export interface CategoryRow {
  id: string;
  name: string | null;
}

export interface ItemRow {
  id: string;
  item_code: string;
}

export interface ReportsContext {
  actor: ProfileActorRow;
  branchId: string;
  timezone: string;
  currencyCode: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateRangeBoundaries {
  startIso: string;
  endExclusiveIso: string;
}

export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZoneOrDefault(
  value: string | null | undefined,
  fallback = DEFAULT_BRANCH_TIMEZONE,
): string {
  const sanitized = sanitizeText(value);
  if (!sanitized) return fallback;
  return isValidTimeZone(sanitized) ? sanitized : fallback;
}

export function isMissingOptionalPaymentColumnsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const row = error as Record<string, unknown>;

  const code = typeof row.code === 'string' ? row.code : '';
  const message = typeof row.message === 'string' ? row.message : '';
  const details = typeof row.details === 'string' ? row.details : '';
  const hint = typeof row.hint === 'string' ? row.hint : '';
  const combined = `${message} ${details} ${hint}`.toLowerCase();
  const missingOptionalColumns =
    combined.includes('payments.source') ||
    combined.includes('payments.reason') ||
    combined.includes('payments.is_initial_capital') ||
    combined.includes('column source') ||
    combined.includes('column reason') ||
    combined.includes('column is_initial_capital');

  if (!missingOptionalColumns) return false;
  if (code === '42703' || code === 'PGRST204') return true;

  return (
    combined.includes('does not exist') ||
    combined.includes('schema cache') ||
    combined.includes('could not find')
  );
}

export function parseNumeric(
  value: number | string | null | undefined,
): number {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function roundRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function computeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return roundRate((numerator / denominator) * 100);
}

export function normalizeIncidentType(
  value: string | null | undefined,
): OrderIncidentType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_INCIDENT_TYPE_SET.has(normalized)) return null;
  return normalized as OrderIncidentType;
}

export function normalizeIncidentStatus(
  value: string | null | undefined,
): OrderIncidentStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_INCIDENT_STATUS_SET.has(normalized)) return null;
  return normalized as OrderIncidentStatus;
}

export function isManagerPlusRole(role: string | null | undefined): boolean {
  return role !== null && role !== undefined && MANAGER_PLUS_ROLE_SET.has(role);
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'staff';
}

export function ensureRoleSupported(actor: ProfileActorRow): void {
  if (!actor.role) {
    throw new ReportsDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-role',
    });
  }

  if (!SUPPORTED_ROLE_SET.has(actor.role)) {
    throw new ReportsDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'unsupported-role',
      role: actor.role,
    });
  }
}
