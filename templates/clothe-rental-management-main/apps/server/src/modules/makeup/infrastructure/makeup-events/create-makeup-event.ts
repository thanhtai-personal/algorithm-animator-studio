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
  resolveActorContext,
  resolveCustomerByProfile,
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

export async function createMakeupEvent(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateMakeupEventPayload;
  },
): Promise<MakeupEventMutationResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
  });

  if (context.role === 'accountant') {
    throw new MakeupDomainError('FORBIDDEN_ROLE', { role: context.role });
  }
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }

  assertIsoDate(options.payload.eventDate);
  let sessionSlot = normalizeSessionSlot(options.payload.sessionSlot);
  let artistProfileId = sanitizeText(options.payload.artistProfileId ?? null);
  const guestCount = toPositiveInteger(options.payload.guestCount, 1);
  const durationMinutes = toPositiveInteger(
    options.payload.durationMinutes,
    guestCount * DEFAULT_EVENT_DURATION_MINUTES,
  );

  if (context.role === 'makeup_artist') {
    if (artistProfileId && artistProfileId !== context.actor.id) {
      throw new MakeupDomainError('FORBIDDEN_ARTIST_SCOPE');
    }
    artistProfileId = context.actor.id;
  }

  if (artistProfileId) {
    await ensureArtistExists(supabase, {
      artistProfileId,
      branchId: context.branchId,
    });
  }

  let customerId = sanitizeText(options.payload.customerId ?? null);
  let customerNameSnapshot = sanitizeText(options.payload.customerName ?? null);
  let customerPhoneSnapshot = sanitizeText(
    options.payload.customerPhone ?? null,
  );
  if (context.role === 'customer') {
    const ownCustomerId = await resolveCustomerByProfile(supabase, {
      branchId: context.branchId,
      profileId: context.actor.id,
    });
    if (!ownCustomerId) throw new MakeupDomainError('CUSTOMER_NOT_FOUND');
    if (customerId && customerId !== ownCustomerId) {
      throw new MakeupDomainError('FORBIDDEN_ROLE', {
        reason: 'customer-scope-mismatch',
      });
    }
    customerId = ownCustomerId;
  }

  if (customerId) {
    await ensureCustomerExists(supabase, {
      customerId,
      branchId: context.branchId,
    });
  }

  const packageId = sanitizeText(options.payload.packageId ?? null);
  if (packageId) {
    await ensurePackageBelongsToBranch(supabase, {
      packageId,
      branchId: context.branchId,
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
    sessionSlot = resolveSessionSlotByStartAt(startAt, context.timeZone);
  }
  const eventDate = toIsoDateInTimeZone(startAt, context.timeZone);
  ensureEventDateNotInPast(eventDate, context.timeZone);
  if (!customerPhoneSnapshot && customerId) {
    const customerById = await fetchCustomersByIds(supabase, [customerId]);
    customerPhoneSnapshot = customerById.get(customerId)?.phone ?? null;
    customerNameSnapshot =
      customerNameSnapshot ?? customerById.get(customerId)?.full_name ?? null;
  }

  const conflicts = await detectConflicts(supabase, {
    branchId: context.branchId,
    eventDate,
    sessionSlot,
    startAt,
    endAt,
    artistProfileId,
    customerId,
    customerPhone: customerPhoneSnapshot,
  });
  if (conflicts.length > 0 && !options.payload.confirmConflictOverride) {
    throw new MakeupDomainError('CONFLICT_WARNING_REQUIRED', { conflicts });
  }

  const { data, error } = await supabase
    .from('makeup_events')
    .insert({
      branch_id: context.branchId,
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
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .maybeSingle<MakeupEventRow>();

  if (error) throw error;
  if (!data) throw new MakeupDomainError('EVENT_NOT_FOUND');

  return {
    event: await mapSingleEvent(supabase, data, context.timeZone),
    conflicts,
    warningAcknowledged: conflicts.length > 0,
  };
}
