import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MakeupEventDto,
  MakeupPackageDto,
} from '../../types/makeup-module.type';
import {
  buildFallbackEventDateTimeRange,
  DEFAULT_EVENT_DURATION_MINUTES,
  isMissingColumnOrTableError,
  MakeupDomainError,
  normalizeEventStatus,
  normalizeSessionSlot,
  parseNumeric,
  resolveSessionSlotByStartAt,
  roundMoney,
  sanitizeText,
  type CustomerRow,
  type MakeupEventRow,
  type MakeupPackageRow,
  type ProfileNameRow,
} from './core';

export async function fetchProfileNamesByIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, ProfileNameRow>> {
  if (profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, default_branch_id, role')
    .in('id', profileIds)
    .eq('is_delete', false)
    .returns<ProfileNameRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function fetchCustomersByIds(
  supabase: SupabaseClient,
  customerIds: string[],
): Promise<Map<string, CustomerRow>> {
  if (customerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .in('id', customerIds)
    .eq('is_delete', false)
    .returns<CustomerRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function fetchPackagesByIds(
  supabase: SupabaseClient,
  packageIds: string[],
): Promise<Map<string, MakeupPackageRow>> {
  if (packageIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('makeup_packages')
    .select(
      'id, branch_id, code, name, description, duration_minutes, price_amount, cost_amount, is_active, created_by, updated_by, updated_at',
    )
    .in('id', packageIds)
    .eq('is_delete', false)
    .returns<MakeupPackageRow[]>();

  if (error) {
    if (isMissingColumnOrTableError(error)) return new Map();
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function ensurePackageBelongsToBranch(
  supabase: SupabaseClient,
  options: { packageId: string; branchId: string },
): Promise<void> {
  const { data, error } = await supabase
    .from('makeup_packages')
    .select('id, branch_id')
    .eq('id', options.packageId)
    .eq('is_delete', false)
    .maybeSingle<{ id: string; branch_id: string }>();

  if (error) {
    if (isMissingColumnOrTableError(error)) {
      throw new MakeupDomainError('PACKAGE_TABLE_UNAVAILABLE');
    }
    throw error;
  }

  if (!data) {
    throw new MakeupDomainError('PACKAGE_NOT_FOUND', {
      packageId: options.packageId,
    });
  }

  if (data.branch_id !== options.branchId) {
    throw new MakeupDomainError('FORBIDDEN_BRANCH_SCOPE', {
      packageId: options.packageId,
      branchId: options.branchId,
      reason: 'package-out-of-branch-scope',
    });
  }
}

export function mapEventRowToDto(options: {
  row: MakeupEventRow;
  artistById: Map<string, ProfileNameRow>;
  customerById: Map<string, CustomerRow>;
  packageById: Map<string, MakeupPackageRow>;
  timeZone?: string;
}): MakeupEventDto {
  const durationMinutes = Math.max(
    1,
    Math.floor(
      parseNumeric(
        options.row.duration_minutes ?? DEFAULT_EVENT_DURATION_MINUTES,
      ),
    ),
  );
  const guestCount = Math.max(
    1,
    Math.floor(parseNumeric(options.row.guest_count ?? 1)),
  );
  const fallbackRange = buildFallbackEventDateTimeRange({
    eventDate: options.row.event_date,
    sessionSlot: normalizeSessionSlot(options.row.session_slot) ?? 'MORNING',
    durationMinutes,
  });
  const startAt = sanitizeText(options.row.start_at) ?? fallbackRange.startAt;
  const endAt = sanitizeText(options.row.end_at) ?? fallbackRange.endAt;
  const slot =
    normalizeSessionSlot(options.row.session_slot) ??
    resolveSessionSlotByStartAt(startAt, options.timeZone);
  const artistProfileId = sanitizeText(options.row.artist_profile_id) ?? '';
  const artist = artistProfileId
    ? options.artistById.get(artistProfileId)
    : undefined;
  const customer = options.row.customer_id
    ? options.customerById.get(options.row.customer_id)
    : null;
  const makeupPackage = options.row.package_id
    ? options.packageById.get(options.row.package_id)
    : null;

  return {
    id: options.row.id,
    branchId: options.row.branch_id,
    eventDate: options.row.event_date,
    sessionSlot: slot,
    artistProfileId,
    artistName: artist?.full_name ?? null,
    customerId: options.row.customer_id,
    customerName: customer?.full_name ?? options.row.customer_name_snapshot,
    customerPhone: customer?.phone ?? options.row.customer_phone_snapshot,
    packageId: options.row.package_id,
    packageCode: makeupPackage?.code ?? null,
    packageName: makeupPackage?.name ?? null,
    guestCount,
    durationMinutes,
    startAt,
    endAt,
    status: normalizeEventStatus(options.row.status),
    note: options.row.note,
    priceAmount: roundMoney(parseNumeric(options.row.price_amount)),
    surchargeAmount: roundMoney(parseNumeric(options.row.surcharge_amount)),
    costAmount: roundMoney(parseNumeric(options.row.cost_amount)),
    isConflictWarning: Boolean(options.row.is_conflict_warning),
    conflictNote: options.row.conflict_note,
    createdAt: options.row.created_at,
    updatedAt: options.row.updated_at,
  };
}

export function mapPackageRowToDto(row: MakeupPackageRow): MakeupPackageDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceAmount: roundMoney(parseNumeric(row.price_amount)),
    costAmount: roundMoney(parseNumeric(row.cost_amount)),
    isActive: row.is_active,
    createdByProfileId: row.created_by,
    updatedByProfileId: row.updated_by,
    updatedAt: row.updated_at,
  };
}
