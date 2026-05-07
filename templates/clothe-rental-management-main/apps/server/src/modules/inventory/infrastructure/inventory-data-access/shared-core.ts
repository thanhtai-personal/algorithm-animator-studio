import { ITEM_STATUS_VALUES } from '../../../shared/domain/domain-primitives.constants';
import { MANAGER_ONLY_ITEM_TARGET_STATUSES } from '../../../shared/domain/domain-primitives.constants';
import type { ItemStatus } from '../../../shared/domain/types/domain-primitives.type';
import type { InventoryStatusLogDto } from '../../types/inventory-items.type';
import type { ProductCategoryDto } from '../../../products/types/products-catalog.type';

export const ITEM_STATUS_SET = new Set<string>(ITEM_STATUS_VALUES);
export const MANAGER_PLUS_ROLE_SET = new Set<string>([
  'owner_admin',
  'manager',
]);
export const MANAGER_ONLY_TARGET_STATUS_SET = new Set<ItemStatus>(
  MANAGER_ONLY_ITEM_TARGET_STATUSES,
);

export interface ItemRow {
  id: string;
  branch_id: string;
  product_id: string;
  item_code: string;
  size: string | null;
  qr_code: string | null;
  status: string;
  retired_at: string | null;
  retired_reason: string | null;
}

export interface ProductRow {
  id: string;
  branch_id: string | null;
  product_code: string;
  name: string;
  category_id: string | null;
  cover_image_path: string | null;
  material: string | null;
  description: string | null;
  rent_price_per_day: number | string | null;
  quick_rent_price: number | string | null;
  rent_deposit_amount: number | string | null;
}

export interface CategoryRow {
  id: string;
  branch_id: string | null;
  code: string;
  name: string;
  is_active: boolean;
}

export interface RentalOrderItemRow {
  item_id: string;
  order_id: string;
  rent_price: number | string | null;
  created_at: string;
}

export interface RentalOrderRow {
  id: string;
  order_code: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface ItemStatusLogRow {
  id: string;
  item_id: string;
  order_id: string | null;
  from_status: string | null;
  to_status: string;
  reason_code: string | null;
  reason_note: string | null;
  actor_profile_id: string | null;
  happened_at: string;
}

export interface ProfileRoleRow {
  role: string | null;
}

export interface ReservationWindowRow {
  id: string;
}

export interface ReservationWindowItemRow {
  item_id: string;
}

export interface ProductRowWithMatchedItems extends ProductRow {
  items?: Array<{ id: string }>;
}

export function parseNumeric(
  value: number | string | null | undefined,
): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function sanitizeSearchTerm(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.replace(/[,%]/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function sanitizeReasonNote(
  value: string | null | undefined,
): string | null {
  return sanitizeText(value);
}

export function normalizeItemStatus(
  value: string | null | undefined,
): ItemStatus {
  if (!value) return 'READY';
  if (ITEM_STATUS_SET.has(value)) {
    return value as ItemStatus;
  }
  return 'READY';
}

export function mapCategoryRow(row: CategoryRow): ProductCategoryDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    isActive: row.is_active,
  };
}

export function mapStatusLogRow(row: ItemStatusLogRow): InventoryStatusLogDto {
  return {
    id: row.id,
    itemId: row.item_id,
    orderId: row.order_id,
    fromStatus: row.from_status ? normalizeItemStatus(row.from_status) : null,
    toStatus: normalizeItemStatus(row.to_status),
    reasonCode: row.reason_code,
    reasonNote: row.reason_note,
    actorProfileId: row.actor_profile_id,
    happenedAt: row.happened_at,
  };
}
