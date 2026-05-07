import { randomBytes } from 'node:crypto';
import { validatePhoneNumber } from '../domain/phone.validation';
import {
  ORDER_STATUS_SET,
  SPENT_STATUS_SET,
} from '../constants/customers-data-access.constants';
import type {
  CustomerOrderRow,
  CustomerRow,
  CustomerSummaryInput,
  CustomerTagAssignmentRow,
  CustomerTagRow,
  IncidentRow,
  NormalizedOrderStatus,
} from '../types/customers-data-access.type';
import { CustomersDomainError } from '../types/customers-data-access.type';
import type {
  CustomerIncidentsSummaryDto,
  CustomerListItemDto,
  CustomerTagDto,
} from '../types/customers-crm.type';

export function parseNumeric(
  value: number | string | null | undefined,
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function sanitizeSearchTerm(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const sanitized = value.replace(/[,%]/g, ' ').trim();
  return sanitized.length > 0 ? sanitized : null;
}

export function sanitizeEmailToken(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function buildCustomerAccountEmail(options: {
  branchId: string;
  phoneNormalized: string;
}): string {
  const branchPart =
    sanitizeEmailToken(options.branchId).slice(0, 12) || 'branch';
  const phonePart =
    sanitizeEmailToken(options.phoneNormalized).slice(-12) ||
    randomBytes(4).toString('hex');
  const suffix = randomBytes(4).toString('hex');
  return `customer-${branchPart}-${phonePart}-${suffix}@customer.local`;
}

export function buildTemporaryPassword(): string {
  const randomPart = randomBytes(18).toString('base64url');
  return `${randomPart}Aa1!`;
}

export function uniqueStringValues(
  values: Array<string | null | undefined>,
): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

export function normalizeOrderStatus(status: string): NormalizedOrderStatus {
  if (ORDER_STATUS_SET.has(status)) {
    return status as NormalizedOrderStatus;
  }
  return 'DRAFT';
}

export function mapCustomerTagRow(row: CustomerTagRow): CustomerTagDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    color: row.color,
    isSystem: row.is_system,
    warnOnOrderCreate: row.warn_on_order_create,
    blockOrderCreate: row.block_order_create,
    isActive: row.is_active,
  };
}

export function buildCustomerTagsMap(
  assignments: CustomerTagAssignmentRow[],
  tagById: Map<string, CustomerTagDto>,
): Map<string, CustomerTagDto[]> {
  const map = new Map<string, CustomerTagDto[]>();
  for (const assignment of assignments) {
    const tag = tagById.get(assignment.tag_id);
    if (!tag) continue;
    const bucket = map.get(assignment.customer_id);
    if (bucket) {
      bucket.push(tag);
    } else {
      map.set(assignment.customer_id, [tag]);
    }
  }

  for (const [customerId, tags] of map.entries()) {
    tags.sort((a, b) => a.name.localeCompare(b.name));
    map.set(customerId, tags);
  }
  return map;
}

export function buildOrderStatsByCustomerId(
  orders: CustomerOrderRow[],
): Map<
  string,
  { totalOrders: number; totalSpent: number; lastOrderDate: string | null }
> {
  const map = new Map<
    string,
    { totalOrders: number; totalSpent: number; lastOrderDate: string | null }
  >();

  for (const order of orders) {
    const current = map.get(order.customer_id) ?? {
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
    };

    current.totalOrders += 1;
    const normalizedStatus = normalizeOrderStatus(order.status);
    if (SPENT_STATUS_SET.has(normalizedStatus)) {
      current.totalSpent += parseNumeric(order.total_amount);
    }
    if (!current.lastOrderDate || order.end_date > current.lastOrderDate) {
      current.lastOrderDate = order.end_date;
    }
    map.set(order.customer_id, current);
  }
  return map;
}

export function mapCustomerSummary(
  options: CustomerSummaryInput,
): CustomerListItemDto {
  return {
    id: options.row.id,
    branchId: options.row.branch_id,
    customerCode: options.row.customer_code,
    fullName: options.row.full_name,
    phone: options.row.phone,
    phoneNormalized: options.row.phone_normalized,
    socialLink: options.row.social_link,
    address: options.row.address,
    note: options.row.note,
    isActive: options.row.is_active,
    tags: options.tags,
    totalOrders: options.stats?.totalOrders ?? 0,
    totalSpent: options.stats?.totalSpent ?? 0,
    lastOrderDate: options.stats?.lastOrderDate ?? null,
    updatedAt: options.row.updated_at,
  };
}

export function buildPhonePersistence(rawPhone: string): {
  phone: string;
  phoneNormalized: string;
} {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    throw new CustomersDomainError('PHONE_REQUIRED');
  }

  const validation = validatePhoneNumber(trimmed, { allowEmpty: false });
  if (!validation.isValid || !validation.normalized) {
    throw new CustomersDomainError('INVALID_PHONE');
  }

  return {
    phone: trimmed,
    phoneNormalized: validation.normalized,
  };
}

export function buildIncidentsSummary(
  rows: IncidentRow[],
): CustomerIncidentsSummaryDto {
  const summary: CustomerIncidentsSummaryDto = {
    totalCount: rows.length,
    openCount: 0,
    lateCount: 0,
    damageCount: 0,
    lostCount: 0,
    cleaningCount: 0,
    totalAmount: 0,
  };

  for (const row of rows) {
    if (row.status === 'OPEN') {
      summary.openCount += 1;
    }
    if (row.type === 'LATE') summary.lateCount += 1;
    if (row.type === 'DAMAGE') summary.damageCount += 1;
    if (row.type === 'LOST') summary.lostCount += 1;
    if (row.type === 'CLEANING') summary.cleaningCount += 1;
    summary.totalAmount += parseNumeric(row.amount);
  }
  return summary;
}

export function scoreTypeaheadRow(row: CustomerRow, search: string): number {
  const normalizedSearch = search.toLowerCase();
  const normalizedName = row.full_name.toLowerCase();
  const normalizedPhone = row.phone_normalized?.toLowerCase() ?? '';
  const rawPhone = row.phone?.toLowerCase() ?? '';

  const searchPhoneDigits = search.replace(/[^0-9+]/g, '');
  const normalizedSearchPhone = validatePhoneNumber(searchPhoneDigits, {
    allowEmpty: true,
  }).normalized;

  if (
    normalizedSearchPhone &&
    normalizedPhone === normalizedSearchPhone.toLowerCase()
  ) {
    return 0;
  }
  if (rawPhone === normalizedSearch || normalizedPhone === normalizedSearch) {
    return 1;
  }
  if (normalizedName.startsWith(normalizedSearch)) {
    return 2;
  }
  if (
    rawPhone.startsWith(normalizedSearch) ||
    normalizedPhone.startsWith(normalizedSearch)
  ) {
    return 3;
  }
  if (normalizedName.includes(normalizedSearch)) {
    return 4;
  }
  return 5;
}
