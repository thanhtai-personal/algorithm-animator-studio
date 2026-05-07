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
  fetchEventById,
  MAKEUP_EVENT_SELECT_FIELDS,
  MakeupDomainError,
  mapSingleEvent,
  normalizeEventStatus,
  normalizeSessionSlot,
  normalizeSourceInputMode,
  parseNumeric,
  resolveActorContext,
  resolveCustomerByProfile,
  resolveSessionSlotByStartAt,
  roundMoney,
  sanitizeText,
  toIsoDateInTimeZone,
  toPositiveInteger,
  validateNonNegativeNumber,
} from './shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MakeupEventMutationResponse,
  UpdateMakeupEventPayload,
} from '../../types/makeup-module.type';
import type { MakeupEventRow } from '../makeupShared';

export async function updateMakeupEvent(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    eventId: string;
    payload: UpdateMakeupEventPayload;
  },
): Promise<MakeupEventMutationResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: null,
  });

  if (context.role === 'accountant') {
    throw new MakeupDomainError('FORBIDDEN_ROLE', { role: context.role });
  }

  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }

  const event = await fetchEventById(supabase, {
    eventId: options.eventId,
    branchId: context.branchId,
  });
  if (!event) throw new MakeupDomainError('EVENT_NOT_FOUND');

  if (
    context.role === 'makeup_artist' &&
    event.artist_profile_id !== context.actor.id
  ) {
    throw new MakeupDomainError('FORBIDDEN_ARTIST_SCOPE');
  }

  let customerScopeId: string | null = null;
  if (context.role === 'customer') {
    customerScopeId = await resolveCustomerByProfile(supabase, {
      branchId: context.branchId,
      profileId: context.actor.id,
    });

    if (!customerScopeId || event.customer_id !== customerScopeId) {
      throw new MakeupDomainError('FORBIDDEN_ROLE', {
        reason: 'customer-event-scope-mismatch',
      });
    }
  }

  const artistProfileId =
    options.payload.artistProfileId === undefined
      ? sanitizeText(event.artist_profile_id)
      : sanitizeText(options.payload.artistProfileId ?? null);
  let sessionSlot = options.payload.sessionSlot
    ? normalizeSessionSlot(options.payload.sessionSlot)
    : normalizeSessionSlot(event.session_slot);

  if (
    context.role === 'makeup_artist' &&
    artistProfileId !== context.actor.id
  ) {
    throw new MakeupDomainError('FORBIDDEN_ARTIST_SCOPE');
  }

  if (artistProfileId) {
    await ensureArtistExists(supabase, {
      artistProfileId,
      branchId: context.branchId,
    });
  }

  let customerId =
    options.payload.customerId === undefined
      ? event.customer_id
      : sanitizeText(options.payload.customerId ?? null);

  if (context.role === 'customer') {
    if (!customerScopeId) {
      throw new MakeupDomainError('CUSTOMER_NOT_FOUND');
    }

    if (customerId && customerId !== customerScopeId) {
      throw new MakeupDomainError('FORBIDDEN_ROLE', {
        reason: 'customer-scope-mismatch',
      });
    }

    customerId = customerScopeId;
  }

  if (customerId) {
    await ensureCustomerExists(supabase, {
      customerId,
      branchId: context.branchId,
    });
  }

  let customerNameSnapshot =
    options.payload.customerName === undefined
      ? sanitizeText(event.customer_name_snapshot)
      : sanitizeText(options.payload.customerName ?? null);
  let customerPhoneSnapshot =
    options.payload.customerPhone === undefined
      ? sanitizeText(event.customer_phone_snapshot)
      : sanitizeText(options.payload.customerPhone ?? null);

  const baseGuestCount = toPositiveInteger(event.guest_count, 1);
  const guestCount =
    options.payload.guestCount === undefined
      ? baseGuestCount
      : toPositiveInteger(options.payload.guestCount, 1);
  const baseDuration = toPositiveInteger(
    event.duration_minutes,
    baseGuestCount * DEFAULT_EVENT_DURATION_MINUTES,
  );
  const durationMinutes =
    options.payload.durationMinutes === undefined
      ? options.payload.guestCount === undefined
        ? baseDuration
        : guestCount * DEFAULT_EVENT_DURATION_MINUTES
      : toPositiveInteger(
          options.payload.durationMinutes,
          guestCount * DEFAULT_EVENT_DURATION_MINUTES,
        );

  const baseRange = buildFallbackEventDateTimeRange({
    eventDate: event.event_date,
    sessionSlot: normalizeSessionSlot(event.session_slot) ?? 'MORNING',
    durationMinutes: baseDuration,
  });
  const baseStartAt = sanitizeText(event.start_at) ?? baseRange.startAt;
  const baseEndAt = sanitizeText(event.end_at) ?? baseRange.endAt;

  let startAt =
    options.payload.startAt === undefined
      ? baseStartAt
      : assertIsoDateTime(options.payload.startAt ?? null);

  let endAt =
    options.payload.endAt === undefined
      ? baseEndAt
      : assertIsoDateTime(options.payload.endAt ?? null);

  if (
    options.payload.eventDate !== undefined &&
    options.payload.startAt === undefined
  ) {
    const fallbackFromDate = buildFallbackEventDateTimeRange({
      eventDate: assertIsoDate(options.payload.eventDate),
      sessionSlot: sessionSlot ?? 'MORNING',
      durationMinutes,
    });
    startAt = fallbackFromDate.startAt;
    if (options.payload.endAt === undefined) {
      endAt = new Date(
        new Date(startAt).getTime() + durationMinutes * 60_000,
      ).toISOString();
    }
  } else if (
    options.payload.startAt !== undefined ||
    options.payload.durationMinutes !== undefined ||
    options.payload.guestCount !== undefined
  ) {
    if (options.payload.endAt === undefined) {
      endAt = new Date(
        new Date(startAt).getTime() + durationMinutes * 60_000,
      ).toISOString();
    }
  }

  if (endAt <= startAt) {
    throw new MakeupDomainError('INVALID_TIME_RANGE', { startAt, endAt });
  }

  if (!sessionSlot) {
    sessionSlot = resolveSessionSlotByStartAt(startAt, context.timeZone);
  }

  const eventDate =
    options.payload.eventDate === undefined
      ? toIsoDateInTimeZone(startAt, context.timeZone)
      : assertIsoDate(options.payload.eventDate);
  const hasScheduleUpdate =
    options.payload.eventDate !== undefined ||
    options.payload.startAt !== undefined ||
    options.payload.endAt !== undefined ||
    options.payload.sessionSlot !== undefined;
  if (hasScheduleUpdate) {
    ensureEventDateNotInPast(eventDate, context.timeZone);
  }

  const packageId =
    options.payload.packageId === undefined
      ? sanitizeText(event.package_id)
      : sanitizeText(options.payload.packageId ?? null);

  if (packageId) {
    await ensurePackageBelongsToBranch(supabase, {
      packageId,
      branchId: context.branchId,
    });
  }

  if (!customerPhoneSnapshot && customerId) {
    const customerById = await fetchCustomersByIds(supabase, [customerId]);
    customerPhoneSnapshot = customerById.get(customerId)?.phone ?? null;
    customerNameSnapshot =
      customerNameSnapshot ?? customerById.get(customerId)?.full_name ?? null;
  }

  const sourceInputMode =
    options.payload.sourceInputMode === undefined
      ? normalizeSourceInputMode(event.source_input_mode)
      : normalizeSourceInputMode(options.payload.sourceInputMode ?? null);
  const sourceInputText =
    options.payload.sourceInputText === undefined
      ? sanitizeText(event.source_input_text)
      : sanitizeText(options.payload.sourceInputText ?? null);

  const conflicts = await detectConflicts(supabase, {
    branchId: context.branchId,
    eventDate,
    sessionSlot,
    startAt,
    endAt,
    artistProfileId,
    customerId,
    customerPhone: customerPhoneSnapshot,
    excludeEventId: event.id,
  });

  if (conflicts.length > 0 && !options.payload.confirmConflictOverride) {
    throw new MakeupDomainError('CONFLICT_WARNING_REQUIRED', { conflicts });
  }

  const { data, error } = await supabase
    .from('makeup_events')
    .update({
      is_delete: false,
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
      source_input_mode: sourceInputMode,
      source_input_text: sourceInputText,
      package_id: packageId,
      status:
        options.payload.status === undefined
          ? normalizeEventStatus(event.status)
          : normalizeEventStatus(options.payload.status),
      note:
        options.payload.note === undefined
          ? event.note
          : sanitizeText(options.payload.note ?? null),
      price_amount:
        options.payload.priceAmount === undefined
          ? roundMoney(parseNumeric(event.price_amount))
          : validateNonNegativeNumber(
              options.payload.priceAmount,
              'priceAmount',
            ),
      surcharge_amount:
        options.payload.surchargeAmount === undefined
          ? roundMoney(parseNumeric(event.surcharge_amount))
          : validateNonNegativeNumber(
              options.payload.surchargeAmount,
              'surchargeAmount',
            ),
      cost_amount:
        options.payload.costAmount === undefined
          ? roundMoney(parseNumeric(event.cost_amount))
          : validateNonNegativeNumber(options.payload.costAmount, 'costAmount'),
      is_conflict_warning: conflicts.length > 0,
      conflict_note:
        conflicts.length > 0
          ? conflicts.map((entry) => entry.reason).join(',')
          : null,
      updated_by: options.actorProfileId,
    })
    .eq('id', event.id)
    .eq('is_delete', false)
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
