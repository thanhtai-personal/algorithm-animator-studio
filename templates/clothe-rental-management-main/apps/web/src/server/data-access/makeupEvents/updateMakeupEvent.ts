import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpdateMakeupEventPayload, MakeupEventMutationResponse } from "@/types/makeupModule";
import {
  resolveActorContext,
  fetchMakeupModuleEnabled,
  assertIsoDate,
  normalizeSessionSlot,
  ensureArtistExists,
  resolveCustomerByProfile,
  ensureCustomerExists,
  sanitizeText,
  ensurePackageBelongsToBranch,
  assertIsoDateTime,
  resolveSessionSlotByStartAt,
  normalizeEventStatus,
  validateNonNegativeNumber,
  DEFAULT_EVENT_DURATION_MINUTES,
  buildFallbackEventDateTimeRange,
} from "@/server/data-access/makeupShared";
import { toPositiveInteger, toIsoDateInTimeZone, ensureEventDateNotInPast, normalizeSourceInputMode } from "./utils";
import { detectConflicts, fetchEventById } from "./db";
import { mapSingleEvent } from "./mappers";
import { MAKEUP_EVENT_SELECT_FIELDS } from "./constants";

export async function updateMakeupEvent(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    eventId: string;
    payload: UpdateMakeupEventPayload;
  }
): Promise<MakeupEventMutationResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: null,
  });

  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new Error("MODULE_DISABLED");
  }

  const existing = await fetchEventById(supabase, {
    eventId: options.eventId,
    branchId: context.branchId,
  });
  if (!existing) throw new Error("EVENT_NOT_FOUND");
  if (existing.branch_id !== context.branchId) throw new Error("FORBIDDEN_BRANCH");

  if (options.payload.eventDate) assertIsoDate(options.payload.eventDate);
  let sessionSlot = normalizeSessionSlot(options.payload.sessionSlot ?? existing.session_slot);
  let artistProfileId = sanitizeText(options.payload.artistProfileId ?? existing.artist_profile_id ?? null);
  const guestCount = toPositiveInteger(options.payload.guestCount ?? existing.guest_count ?? 1, 1);
  const durationMinutes = toPositiveInteger(
    options.payload.durationMinutes ?? existing.duration_minutes ?? guestCount * 60,
    1
  );

  if (context.role === "makeup_artist") {
    if (artistProfileId && artistProfileId !== context.actor.id) {
      throw new Error("FORBIDDEN_ARTIST_SCOPE");
    }
    artistProfileId = context.actor.id;
  }

  if (artistProfileId) {
    await ensureArtistExists(supabase, {
      artistProfileId,
      branchId: context.branchId,
    });
  }

  let customerId = sanitizeText(options.payload.customerId ?? existing.customer_id ?? null);
  let customerNameSnapshot = sanitizeText(options.payload.customerName ?? existing.customer_name_snapshot ?? null);
  let customerPhoneSnapshot = sanitizeText(options.payload.customerPhone ?? existing.customer_phone_snapshot ?? null);
  if (context.role === "customer") {
    const ownCustomerId = await resolveCustomerByProfile(supabase, {
      branchId: context.branchId,
      profileId: context.actor.id,
    });
    if (!ownCustomerId) throw new Error("CUSTOMER_NOT_FOUND");
    if (customerId && customerId !== ownCustomerId) {
      throw new Error("FORBIDDEN_ROLE");
    }
    customerId = ownCustomerId;
  }

  if (customerId) {
    await ensureCustomerExists(supabase, {
      customerId,
      branchId: context.branchId,
    });
  }

  const packageId = sanitizeText(options.payload.packageId ?? existing.package_id ?? null);
  if (packageId) {
    await ensurePackageBelongsToBranch(supabase, {
      packageId,
      branchId: context.branchId,
    });
  }

  const baseGuestCount = toPositiveInteger(existing.guest_count, 1);
  const baseDuration = toPositiveInteger(existing.duration_minutes, baseGuestCount * DEFAULT_EVENT_DURATION_MINUTES);
  const baseRange = buildFallbackEventDateTimeRange({
    eventDate: existing.event_date,
    sessionSlot: normalizeSessionSlot(existing.session_slot) ?? "MORNING",
    durationMinutes: baseDuration,
  });
  const baseStartAt = sanitizeText(existing.start_at) ?? baseRange.startAt;
  const baseEndAt = sanitizeText(existing.end_at) ?? baseRange.endAt;

  let startAt =
    options.payload.startAt === undefined
      ? baseStartAt
      : assertIsoDateTime(options.payload.startAt ?? null);
  let endAt =
    options.payload.endAt === undefined
      ? baseEndAt
      : assertIsoDateTime(options.payload.endAt ?? null);

  if (options.payload.eventDate !== undefined && options.payload.startAt === undefined) {
    const fallbackFromDate = buildFallbackEventDateTimeRange({
      eventDate: assertIsoDate(options.payload.eventDate),
      sessionSlot: sessionSlot ?? "MORNING",
      durationMinutes,
    });
    startAt = fallbackFromDate.startAt;
    if (options.payload.endAt === undefined) {
      endAt = new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString();
    }
  } else if (
    options.payload.startAt !== undefined ||
    options.payload.durationMinutes !== undefined ||
    options.payload.guestCount !== undefined
  ) {
    if (options.payload.endAt === undefined) {
      endAt = new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString();
    }
  }

  if (endAt <= startAt) throw new Error("INVALID_TIME_RANGE");
  if (!sessionSlot) sessionSlot = resolveSessionSlotByStartAt(startAt, context.timeZone);

  const eventDate =
    options.payload.eventDate === undefined
      ? toIsoDateInTimeZone(startAt, context.timeZone)
      : assertIsoDate(options.payload.eventDate);
  ensureEventDateNotInPast(eventDate, context.timeZone);

  const conflicts = await detectConflicts(supabase, {
    branchId: context.branchId,
    eventDate,
    sessionSlot,
    startAt,
    endAt,
    artistProfileId,
    customerId,
    customerPhone: customerPhoneSnapshot,
    excludeEventId: options.eventId,
  });
  if (conflicts.length > 0 && !options.payload.confirmConflictOverride) {
    throw new Error("CONFLICT_WARNING_REQUIRED");
  }

  const { data, error } = await supabase
    .from("makeup_events")
    .update({
      session_slot: sessionSlot,
      artist_profile_id: artistProfileId,
      customer_id: customerId,
      customer_name_snapshot: customerNameSnapshot,
      customer_phone_snapshot: customerPhoneSnapshot,
      guest_count: guestCount,
      duration_minutes: durationMinutes,
      start_at: startAt,
      end_at: endAt,
      source_input_mode: normalizeSourceInputMode(options.payload.sourceInputMode ?? null),
      source_input_text: sanitizeText(options.payload.sourceInputText ?? null),
      package_id: packageId,
      status: options.payload.status ? normalizeEventStatus(options.payload.status) : existing.status,
      note: sanitizeText(options.payload.note ?? existing.note ?? null),
      price_amount: validateNonNegativeNumber(options.payload.priceAmount ?? existing.price_amount ?? null, "priceAmount"),
      surcharge_amount: validateNonNegativeNumber(options.payload.surchargeAmount ?? existing.surcharge_amount ?? null, "surchargeAmount"),
      cost_amount: validateNonNegativeNumber(options.payload.costAmount ?? existing.cost_amount ?? null, "costAmount"),
      is_conflict_warning: conflicts.length > 0,
      conflict_note: conflicts.length > 0 ? conflicts.map((entry) => entry.reason).join(",") : null,
      updated_by: options.actorProfileId,
    })
    .eq("id", options.eventId)
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("EVENT_NOT_FOUND");

  return {
    event: await mapSingleEvent(supabase, data, context.timeZone),
    conflicts,
    warningAcknowledged: conflicts.length > 0,
  };
}
