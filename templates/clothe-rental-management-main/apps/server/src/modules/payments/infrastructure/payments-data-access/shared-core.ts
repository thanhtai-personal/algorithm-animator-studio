import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderPaymentType,
} from '../../../orders/types/orders-domain.type';

const ORDER_PAYMENT_TYPE_SET = new Set<string>([
  'RENT',
  'DEPOSIT',
  'FEE',
  'REFUND',
  'EXPENSE',
]);
const ORDER_PAYMENT_METHOD_SET = new Set<string>(['CASH', 'BANK', 'MOMO']);
const ORDER_PAYMENT_STATUS_SET = new Set<string>(['POSTED', 'VOIDED']);
const MANAGER_PLUS_ROLE_SET = new Set<string>(['owner_admin', 'manager']);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 80;

export const PAYMENT_ROW_SELECT =
  'id, branch_id, order_id, customer_id, type, method, amount, reason, source, is_import_order, is_initial_capital, status, note, reference_code, void_reason, voided_at, created_by, updated_by, created_at, updated_at';

type PaymentsDomainErrorCode =
  | 'INVALID_DATE_RANGE'
  | 'INVALID_PAYMENT_TYPE'
  | 'INVALID_PAYMENT_METHOD'
  | 'INVALID_PAYMENT_STATUS'
  | 'INVALID_PAYMENT_AMOUNT'
  | 'INVALID_PAYMENT_REASON'
  | 'INVALID_PAYMENT_UPDATE_PAYLOAD'
  | 'INVALID_RECEIPT_UPLOAD'
  | 'RECEIPT_UPLOAD_SESSION_NOT_FOUND'
  | 'RECEIPT_UPLOAD_SESSION_EXPIRED'
  | 'PAYMENT_ATTACHMENT_SCHEMA_NOT_READY'
  | 'PAYMENT_NOT_FOUND'
  | 'PAYMENT_EDIT_NOT_ALLOWED'
  | 'PAYMENT_STATUS_TRANSITION_INVALID'
  | 'FORBIDDEN_MANAGER_ACTION'
  | 'FORBIDDEN_PAYMENT_CREATE'
  | 'FORBIDDEN_PAYMENT_UPDATE'
  | 'FORBIDDEN_PAYMENT_STATUS_UPDATE'
  | 'FORBIDDEN_PAYMENT_EXPORT'
  | 'FORBIDDEN_BRANCH_SCOPE'
  | 'MISSING_BRANCH_CONTEXT';

interface PaymentsDomainErrorContext {
  [key: string]: unknown;
}

export class PaymentsDomainError extends Error {
  readonly code: PaymentsDomainErrorCode;
  readonly context: PaymentsDomainErrorContext;

  constructor(
    code: PaymentsDomainErrorCode,
    context: PaymentsDomainErrorContext = {},
  ) {
    super(code);
    this.name = 'PaymentsDomainError';
    this.code = code;
    this.context = context;
  }
}

export interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}

interface ProfileBranchAccessRow {
  branch_id: string;
}

export interface PaymentRow {
  id: string;
  branch_id: string;
  order_id: string | null;
  customer_id: string | null;
  type: string;
  method: string;
  amount: number | string | null;
  reason: string | null;
  source: string | null;
  is_import_order?: boolean | null;
  is_initial_capital?: boolean | null;
  status: string;
  note: string | null;
  reference_code: string | null;
  void_reason: string | null;
  voided_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRefRow {
  id: string;
  order_code: string | null;
}

export interface CustomerRefRow {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export interface ProfileNameRefRow {
  id: string;
  full_name: string | null;
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

export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizePaymentType(
  value: string | null | undefined,
): OrderPaymentType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_TYPE_SET.has(normalized)) return null;
  return normalized as OrderPaymentType;
}

export function normalizePaymentMethod(
  value: string | null | undefined,
): OrderPaymentMethod | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_METHOD_SET.has(normalized)) return null;
  return normalized as OrderPaymentMethod;
}

export function normalizePaymentStatus(
  value: string | null | undefined,
): OrderPaymentStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_STATUS_SET.has(normalized)) return null;
  return normalized as OrderPaymentStatus;
}

export function isOwnerAdminRole(role: string | null | undefined): boolean {
  return role === 'owner_admin';
}

export function isManagerPlusRole(role: string | null | undefined): boolean {
  return role !== null && role !== undefined && MANAGER_PLUS_ROLE_SET.has(role);
}

function isStaffRole(role: string | null | undefined): boolean {
  return role === 'staff';
}

export function normalizePage(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

export function normalizePageSize(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(value)));
}

export function assertValidDateRange(
  startDate: string | null,
  endDate: string | null,
): void {
  if (!startDate || !endDate) return;
  if (startDate > endDate) {
    throw new PaymentsDomainError('INVALID_DATE_RANGE', {
      startDate,
      endDate,
    });
  }
}

export function buildDateFromBoundary(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function buildDateToBoundary(date: string): string {
  return `${date}T23:59:59.999Z`;
}

export function resolveSignedAmount(
  type: OrderPaymentType,
  amount: number,
): number {
  if (type === 'REFUND' || type === 'EXPENSE') {
    return roundMoney(-Math.abs(amount));
  }
  return roundMoney(Math.abs(amount));
}

export async function fetchActorProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, default_branch_id')
    .eq('id', profileId)
    .eq('is_delete', false)
    .eq('is_active', true)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  return data ?? null;
}

export async function fetchActorBranchAccessIds(
  supabase: SupabaseClient,
  actorProfileId: string,
  defaultBranchId: string | null,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('profile_branch_access')
    .select('branch_id')
    .eq('profile_id', actorProfileId)
    .eq('is_delete', false)
    .returns<ProfileBranchAccessRow[]>();

  if (error) throw error;

  const allowed = new Set((data ?? []).map((entry) => entry.branch_id));
  if (defaultBranchId) {
    allowed.add(defaultBranchId);
  }

  return Array.from(allowed);
}

export function resolveBranchScope(options: {
  actor: ProfileActorRow;
  allowedBranchIds: string[];
  requestedBranchId: string | null;
}): string[] {
  const allowedBranchIds = options.allowedBranchIds;
  const requestedBranchId = options.requestedBranchId;

  if (isStaffRole(options.actor.role)) {
    const staffBranchId =
      options.actor.default_branch_id ?? allowedBranchIds[0] ?? null;
    if (!staffBranchId) {
      throw new PaymentsDomainError('MISSING_BRANCH_CONTEXT', {
        reason: 'staff-without-default-branch',
      });
    }

    if (requestedBranchId && requestedBranchId !== staffBranchId) {
      throw new PaymentsDomainError('FORBIDDEN_BRANCH_SCOPE', {
        requestedBranchId,
        role: options.actor.role,
      });
    }

    return [staffBranchId];
  }

  if (requestedBranchId) {
    if (!allowedBranchIds.includes(requestedBranchId)) {
      throw new PaymentsDomainError('FORBIDDEN_BRANCH_SCOPE', {
        requestedBranchId,
        role: options.actor.role,
      });
    }

    return [requestedBranchId];
  }

  if (allowedBranchIds.length > 0) {
    return allowedBranchIds;
  }

  if (options.actor.default_branch_id) {
    return [options.actor.default_branch_id];
  }

  throw new PaymentsDomainError('MISSING_BRANCH_CONTEXT', {
    role: options.actor.role,
  });
}
