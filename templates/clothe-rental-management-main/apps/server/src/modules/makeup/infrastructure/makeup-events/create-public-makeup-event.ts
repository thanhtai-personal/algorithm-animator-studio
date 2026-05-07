import {
  assertIsoDate,
  assertIsoDateTime,
  buildFallbackEventDateTimeRange,
  DEFAULT_EVENT_DURATION_MINUTES,
  detectConflicts,
  ensureArtistExists,
  ensureCustomerExists,
  ensureEventDateNotInPast,
  ensurePackageBelongsToBranch,
  fetchCustomersByIds,
  fetchMakeupModuleEnabled,
  MAKEUP_EVENT_SELECT_FIELDS,
  MakeupDomainError,
  mapSingleEvent,
  normalizeEventStatus,
  normalizeSessionSlot,
  normalizeSourceInputMode,
  resolveBranchTimeZone,
  resolvePublicMakeupBranchId,
  resolveSessionSlotByStartAt,
  sanitizeText,
  toIsoDateInTimeZone,
  toPositiveInteger,
  validateNonNegativeNumber,
} from './shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateMakeupEventPayload,
  MakeupEventMutationResponse,
} from '../../types/makeup-module.type';
import type { MakeupEventRow } from '../makeupShared';

export async function createPublicMakeupEvent(
  supabase: SupabaseClient,
  options: {
    payload: CreateMakeupEventPayload;
  },
): Promise<MakeupEventMutationResponse> {
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }

  const branchId = await resolvePublicMakeupBranchId(
    supabase,
    options.payload.branchId,
  );
  if (!branchId) {
    throw new MakeupDomainError('MISSING_BRANCH_CONTEXT', {
      reason: 'missing-default-public-branch',
    });
  }

  const timeZone = await resolveBranchTimeZone(supabase, branchId);

  assertIsoDate(options.payload.eventDate);
  let sessionSlot = normalizeSessionSlot(options.payload.sessionSlot);
  const artistProfileId = sanitizeText(options.payload.artistProfileId ?? null);
  const guestCount = toPositiveInteger(options.payload.guestCount, 1);
  const durationMinutes = toPositiveInteger(
    options.payload.durationMinutes,
    guestCount * DEFAULT_EVENT_DURATION_MINUTES,
  );

  if (artistProfileId) {
    await ensureArtistExists(supabase, {
      artistProfileId,
      branchId,
    });
  }

  const customerId = sanitizeText(options.payload.customerId ?? null);
  let customerNameSnapshot = sanitizeText(options.payload.customerName ?? null);
  let customerPhoneSnapshot = sanitizeText(
    options.payload.customerPhone ?? null,
  );

  if (customerId) {
    await ensureCustomerExists(supabase, {
      customerId,
      branchId,
    });
  }

  const packageId = sanitizeText(options.payload.packageId ?? null);
  if (packageId) {
    await ensurePackageBelongsToBranch(supabase, {
      packageId,
      branchId,
    });
  }

  const fallbackRange = buildFallbackEventDateTimeRange({
    eventDate: options.payload.eventDate,
    sessionSlot: sessionSlot ?? 'MORNING',
    durationMinutes,
  });
  const startAt = options.payload.startAt
    ? assertIsoDateTime(options.payload.startAt)
    : fallbackRange.startAt;
  const endAt = options.payload.endAt
    ? assertIsoDateTime(options.payload.endAt)
    : new Date(
        new Date(startAt).getTime() + durationMinutes * 60_000,
      ).toISOString();
  if (endAt <= startAt) {
    throw new MakeupDomainError('INVALID_TIME_RANGE', { startAt, endAt });
  }
  if (!sessionSlot) {
    sessionSlot = resolveSessionSlotByStartAt(startAt, timeZone);
  }

  const eventDate = toIsoDateInTimeZone(startAt, timeZone);
  ensureEventDateNotInPast(eventDate, timeZone);
  if (!customerPhoneSnapshot && customerId) {
    const customerById = await fetchCustomersByIds(supabase, [customerId]);
    customerPhoneSnapshot = customerById.get(customerId)?.phone ?? null;
    customerNameSnapshot =
      customerNameSnapshot ?? customerById.get(customerId)?.full_name ?? null;
  }

  const conflicts = await detectConflicts(supabase, {
    branchId,
    eventDate,
    sessionSlot,
    startAt,
    endAt,
    artistProfileId,
    customerId,
    customerPhone: customerPhoneSnapshot,
  });
  // Public booking flows (product page + mini app) are not allowed to override conflicts.
  if (conflicts.length > 0) {
    throw new MakeupDomainError('CONFLICT_WARNING_REQUIRED', {
      conflicts,
      overrideAllowed: false,
      source: 'public-booking',
    });
  }

  const { data, error } = await supabase
    .from('makeup_events')
    .insert({
      branch_id: branchId,
      event_date: eventDate,
      session_slot: sessionSlot,
      artist_profile_id: artistProfileId,
      customer_id: customerId,
      customer_name_snapshot: customerNameSnapshot,
      customer_phone_snapshot: customerPhoneSnapshot,
      guest_count: guestCount,
      duration_minutes: durationMinutes,
      start_at: startAt,
      end_at: endAt,
      source_input_mode: normalizeSourceInputMode(
        options.payload.sourceInputMode ?? null,
      ),
      source_input_text: sanitizeText(options.payload.sourceInputText ?? null),
      package_id: packageId,
      status: options.payload.status
        ? normalizeEventStatus(options.payload.status)
        : 'BOOKED',
      note: sanitizeText(options.payload.note ?? null),
      price_amount: validateNonNegativeNumber(
        options.payload.priceAmount,
        'priceAmount',
      ),
      surcharge_amount: validateNonNegativeNumber(
        options.payload.surchargeAmount,
        'surchargeAmount',
      ),
      cost_amount: validateNonNegativeNumber(
        options.payload.costAmount,
        'costAmount',
      ),
      is_conflict_warning: conflicts.length > 0,
      conflict_note:
        conflicts.length > 0
          ? conflicts.map((entry) => entry.reason).join(',')
          : null,
      created_by: null,
      updated_by: null,
    })
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .maybeSingle<MakeupEventRow>();

  if (error) throw error;
  if (!data) throw new MakeupDomainError('EVENT_NOT_FOUND');

  return {
    event: await mapSingleEvent(supabase, data, timeZone),
    conflicts,
    warningAcknowledged: conflicts.length > 0,
  };
}
