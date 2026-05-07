import type { SupabaseClient } from '@supabase/supabase-js';
import type { MakeupEventConflictDto } from '../../types/makeup-module.type';
import {
  assertIsoDateTime,
  DEFAULT_BRANCH_TIMEZONE,
  DEFAULT_EVENT_DURATION_MINUTES,
  fetchCustomersByIds,
  fetchPackagesByIds,
  fetchProfileNamesByIds,
  isMissingColumnOrTableError,
  mapEventRowToDto,
  MakeupDomainError,
  type MakeupEventRow,
  normalizeSessionSlot,
  resolveSessionSlotByStartAt,
  parseNumeric,
  sanitizeText,
} from '../makeupShared';

export const MAKEUP_EVENT_SELECT_FIELDS =
  'id, branch_id, event_date, session_slot, artist_profile_id, customer_id, customer_name_snapshot, customer_phone_snapshot, guest_count, duration_minutes, start_at, end_at, source_input_mode, source_input_text, package_id, status, note, price_amount, surcharge_amount, cost_amount, is_conflict_warning, conflict_note, created_at, updated_at';

export function toIsoDateInTimeZone(value: string, timeZone: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(parsed);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function ensureEventDateNotInPast(
  eventDate: string,
  timeZone: string,
): void {
  const today = toIsoDateInTimeZone(new Date().toISOString(), timeZone);
  if (eventDate < today) {
    throw new MakeupDomainError('INVALID_DATE_RANGE', {
      eventDate,
      minEventDate: today,
      reason: 'past-event-date',
    });
  }
}

export function toPositiveInteger(
  value: number | null | undefined,
  fallback: number,
): number {
  const parsed = Math.floor(parseNumeric(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function resolveBranchTimeZone(
  supabase: SupabaseClient,
  branchId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, timezone')
    .eq('id', branchId)
    .eq('is_delete', false)
    .maybeSingle<{ id: string; timezone: string | null }>();

  if (error) throw error;
  if (!data) {
    throw new MakeupDomainError('MISSING_BRANCH_CONTEXT', {
      branchId,
      reason: 'branch-not-found',
    });
  }

  return sanitizeText(data.timezone) ?? DEFAULT_BRANCH_TIMEZONE;
}

export async function resolvePublicMakeupBranchId(
  supabase: SupabaseClient,
  requestedBranchId: string | null | undefined,
): Promise<string | null> {
  const normalizedBranchId = sanitizeText(requestedBranchId);
  if (normalizedBranchId) return normalizedBranchId;

  const defaultShowroomResult = await supabase
    .from('showrooms')
    .select('branch_id')
    .eq('is_delete', false)
    .eq('is_default', true)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle<{ branch_id: string }>();
  if (!defaultShowroomResult.error) {
    const branchId = sanitizeText(defaultShowroomResult.data?.branch_id);
    if (branchId) return branchId;
  } else if (!isMissingColumnOrTableError(defaultShowroomResult.error)) {
    throw defaultShowroomResult.error;
  }

  const fallbackShowroomResult = await supabase
    .from('showrooms')
    .select('branch_id')
    .eq('is_delete', false)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ branch_id: string }>();
  if (!fallbackShowroomResult.error) {
    const branchId = sanitizeText(fallbackShowroomResult.data?.branch_id);
    if (branchId) return branchId;
  } else if (!isMissingColumnOrTableError(fallbackShowroomResult.error)) {
    throw fallbackShowroomResult.error;
  }

  const branchResult = await supabase
    .from('branches')
    .select('id')
    .eq('is_delete', false)
    .eq('is_active', true)
    .order('code', { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (branchResult.error) throw branchResult.error;

  return sanitizeText(branchResult.data?.id);
}

export function normalizeSourceInputMode(
  value: string | null | undefined,
): 'VOICE' | 'TEXT' | null {
  const normalized = sanitizeText(value)?.toUpperCase() ?? '';
  if (!normalized) return null;
  if (normalized === 'VOICE' || normalized === 'TEXT') return normalized;
  return null;
}

export async function detectConflicts(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    eventDate: string;
    sessionSlot: 'MORNING' | 'AFTERNOON' | 'EVENING';
    startAt: string;
    endAt: string;
    artistProfileId: string | null;
    customerId: string | null;
    customerPhone: string | null;
    excludeEventId?: string | null;
  },
): Promise<MakeupEventConflictDto[]> {
  const parsedStartAt = assertIsoDateTime(options.startAt);
  const parsedEndAt = assertIsoDateTime(options.endAt);
  if (parsedEndAt <= parsedStartAt) {
    throw new MakeupDomainError('INVALID_TIME_RANGE', {
      startAt: parsedStartAt,
      endAt: parsedEndAt,
    });
  }

  type ConflictRow = Pick<
    MakeupEventRow,
    | 'id'
    | 'event_date'
    | 'session_slot'
    | 'artist_profile_id'
    | 'customer_id'
    | 'customer_phone_snapshot'
    | 'start_at'
    | 'end_at'
  >;

  const queryOverlapRows = async (filters: {
    artistProfileId?: string;
    customerId?: string;
    customerPhone?: string;
  }): Promise<ConflictRow[]> => {
    let query = supabase
      .from('makeup_events')
      .select(
        'id, event_date, session_slot, artist_profile_id, customer_id, customer_phone_snapshot, start_at, end_at',
      )
      .eq('branch_id', options.branchId)
      .eq('is_delete', false)
      .neq('status', 'CANCELLED')
      .lt('start_at', parsedEndAt)
      .gt('end_at', parsedStartAt)
      .order('start_at', { ascending: true });

    if (filters.artistProfileId)
      query = query.eq('artist_profile_id', filters.artistProfileId);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.customerPhone)
      query = query.eq('customer_phone_snapshot', filters.customerPhone);
    if (options.excludeEventId) query = query.neq('id', options.excludeEventId);

    const { data, error } = await query.returns<ConflictRow[]>();
    if (!error) return data ?? [];
    if (!isMissingColumnOrTableError(error)) {
      throw error;
    }

    // Legacy fallback for environments that have not applied time-range columns yet.
    let legacyQuery = supabase
      .from('makeup_events')
      .select('id, event_date, session_slot, artist_profile_id, customer_id')
      .eq('branch_id', options.branchId)
      .eq('is_delete', false)
      .eq('event_date', options.eventDate)
      .eq('session_slot', options.sessionSlot)
      .neq('status', 'CANCELLED')
      .order('created_at', { ascending: true });

    if (filters.artistProfileId)
      legacyQuery = legacyQuery.eq(
        'artist_profile_id',
        filters.artistProfileId,
      );
    if (filters.customerId)
      legacyQuery = legacyQuery.eq('customer_id', filters.customerId);
    if (options.excludeEventId)
      legacyQuery = legacyQuery.neq('id', options.excludeEventId);

    const { data: legacyRows, error: legacyError } =
      await legacyQuery.returns<
        Array<
          Pick<
            MakeupEventRow,
            | 'id'
            | 'event_date'
            | 'session_slot'
            | 'artist_profile_id'
            | 'customer_id'
          >
        >
      >();
    if (legacyError) throw legacyError;

    return (legacyRows ?? []).map((row) => ({
      ...row,
      customer_phone_snapshot: null,
      start_at: null,
      end_at: null,
    }));
  };

  const [artistRows, customerIdRows, customerPhoneRows] = await Promise.all([
    options.artistProfileId
      ? queryOverlapRows({ artistProfileId: options.artistProfileId })
      : Promise.resolve([]),
    options.customerId
      ? queryOverlapRows({ customerId: options.customerId })
      : Promise.resolve([]),
    options.customerPhone
      ? queryOverlapRows({ customerPhone: options.customerPhone })
      : Promise.resolve([]),
  ]);

  const allRowsById = new Map<string, ConflictRow>();
  for (const row of [...artistRows, ...customerIdRows, ...customerPhoneRows]) {
    allRowsById.set(row.id, row);
  }
  const rows = Array.from(allRowsById.values());
  if (rows.length === 0) return [];

  const artistIds = Array.from(
    new Set(
      rows
        .map((row) => sanitizeText(row.artist_profile_id))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const customerIds = Array.from(
    new Set(
      rows
        .map((row) => sanitizeText(row.customer_id))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [artistMap, customerMap] = await Promise.all([
    fetchProfileNamesByIds(supabase, artistIds),
    fetchCustomersByIds(supabase, customerIds),
  ]);

  const conflicts: MakeupEventConflictDto[] = [];
  const pushed = new Set<string>();

  for (const row of rows) {
    const slot =
      normalizeSessionSlot(row.session_slot) ??
      (row.start_at
        ? resolveSessionSlotByStartAt(row.start_at)
        : options.sessionSlot);
    const customerName = row.customer_id
      ? (customerMap.get(row.customer_id)?.full_name ?? null)
      : null;

    if (
      options.artistProfileId &&
      row.artist_profile_id === options.artistProfileId
    ) {
      const key = `${row.id}:ARTIST_SLOT_CONFLICT`;
      if (!pushed.has(key)) {
        pushed.add(key);
        const artistProfileId = sanitizeText(row.artist_profile_id) ?? '';
        conflicts.push({
          eventId: row.id,
          eventDate: row.event_date,
          sessionSlot: slot,
          artistProfileId,
          artistName: artistProfileId
            ? (artistMap.get(artistProfileId)?.full_name ?? null)
            : null,
          customerId: row.customer_id,
          customerName,
          reason: 'ARTIST_SLOT_CONFLICT',
        });
      }
    }

    const matchedCustomerById = Boolean(
      options.customerId && row.customer_id === options.customerId,
    );
    const matchedCustomerByPhone = Boolean(
      options.customerPhone &&
      sanitizeText(row.customer_phone_snapshot)?.replace(/\s+/g, '') ===
        options.customerPhone.replace(/\s+/g, ''),
    );

    if (matchedCustomerById || matchedCustomerByPhone) {
      const key = `${row.id}:CUSTOMER_SLOT_CONFLICT`;
      if (!pushed.has(key)) {
        pushed.add(key);
        const artistProfileId = sanitizeText(row.artist_profile_id) ?? '';
        conflicts.push({
          eventId: row.id,
          eventDate: row.event_date,
          sessionSlot: slot,
          artistProfileId,
          artistName: artistProfileId
            ? (artistMap.get(artistProfileId)?.full_name ?? null)
            : null,
          customerId: row.customer_id,
          customerName,
          reason: 'CUSTOMER_SLOT_CONFLICT',
        });
      }
    }
  }

  return conflicts;
}

export async function fetchEventById(
  supabase: SupabaseClient,
  options: { eventId: string; branchId: string },
): Promise<MakeupEventRow | null> {
  const result = await supabase
    .from('makeup_events')
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .eq('id', options.eventId)
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .maybeSingle<MakeupEventRow>();

  if (!result.error) {
    return result.data ?? null;
  }

  if (!isMissingColumnOrTableError(result.error)) {
    throw result.error;
  }

  const legacySelectFields =
    'id, branch_id, event_date, session_slot, artist_profile_id, customer_id, package_id, status, note, price_amount, cost_amount, is_conflict_warning, conflict_note, created_at, updated_at';
  const { data: legacyData, error: legacyError } = await supabase
    .from('makeup_events')
    .select(legacySelectFields)
    .eq('id', options.eventId)
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .maybeSingle<
      Pick<
        MakeupEventRow,
        | 'id'
        | 'branch_id'
        | 'event_date'
        | 'session_slot'
        | 'artist_profile_id'
        | 'customer_id'
        | 'package_id'
        | 'status'
        | 'note'
        | 'price_amount'
        | 'cost_amount'
        | 'is_conflict_warning'
        | 'conflict_note'
        | 'created_at'
        | 'updated_at'
      >
    >();
  if (legacyError) throw legacyError;
  if (!legacyData) return null;

  return {
    ...legacyData,
    customer_name_snapshot: null,
    customer_phone_snapshot: null,
    guest_count: 1,
    duration_minutes: DEFAULT_EVENT_DURATION_MINUTES,
    start_at: null,
    end_at: null,
    source_input_mode: null,
    source_input_text: null,
    surcharge_amount: 0,
  };
}

export async function mapSingleEvent(
  supabase: SupabaseClient,
  row: MakeupEventRow,
  timeZone?: string,
) {
  const [artistById, customerById, packageById] = await Promise.all([
    fetchProfileNamesByIds(
      supabase,
      row.artist_profile_id ? [row.artist_profile_id] : [],
    ),
    fetchCustomersByIds(supabase, row.customer_id ? [row.customer_id] : []),
    fetchPackagesByIds(supabase, row.package_id ? [row.package_id] : []),
  ]);

  return mapEventRowToDto({
    row,
    artistById,
    customerById,
    packageById,
    timeZone,
  });
}
