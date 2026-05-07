import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateMakeupEventPayload, MakeupEventMutationResponse } from "@/types/makeupModule";
import type { MakeupEventRow } from "@/server/data-access/makeupShared";

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
  roundMoney,
  parseNumeric,
  DEFAULT_EVENT_DURATION_MINUTES,
} from "@/server/data-access/makeupShared";
import { toPositiveInteger, toIsoDateInTimeZone, ensureEventDateNotInPast, normalizeSourceInputMode } from "./utils";
import { MAKEUP_EVENT_SELECT_FIELDS } from "./constants";
import { fetchCustomersByIds } from "@/server/data-access/makeupShared";
import { detectConflicts } from "./db";
import { mapSingleEvent } from "./mappers";

export async function createMakeupEvent(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateMakeupEventPayload;
  }
): Promise<MakeupEventMutationResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
  });

  if (context.role === "accountant") {
    throw new Error("FORBIDDEN_ROLE");
  }
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new Error("MODULE_DISABLED");
  }

  assertIsoDate(options.payload.eventDate);
  let sessionSlot = normalizeSessionSlot(options.payload.sessionSlot);
  let artistProfileId = sanitizeText(options.payload.artistProfileId ?? null);
  const guestCount = toPositiveInteger(options.payload.guestCount, 1);
  const durationMinutes = toPositiveInteger(
    options.payload.durationMinutes,
    guestCount * DEFAULT_EVENT_DURATION_MINUTES
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

  let customerId = sanitizeText(options.payload.customerId ?? null);
  let customerNameSnapshot = sanitizeText(options.payload.customerName ?? null);
  let customerPhoneSnapshot = sanitizeText(options.payload.customerPhone ?? null);
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

  const packageId = sanitizeText(options.payload.packageId ?? null);
  if (packageId) {
    await ensurePackageBelongsToBranch(supabase, {
      packageId,
      branchId: context.branchId,
    });
  }

  const fallbackRange = {
    eventDate: options.payload.eventDate,
    sessionSlot: sessionSlot ?? "MORNING",
    durationMinutes,
  } as const;
  const startAt = options.payload.startAt
    ? assertIsoDateTime(options.payload.startAt)
    : /* compute fallback */ new Date().toISOString();
  const endAt = options.payload.endAt
    ? assertIsoDateTime(options.payload.endAt)
    : new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString();
  if (endAt <= startAt) {
    throw new Error("INVALID_TIME_RANGE");
  }
  if (!sessionSlot) {
    sessionSlot = resolveSessionSlotByStartAt(startAt, context.timeZone);
  }
  const eventDate = toIsoDateInTimeZone(startAt, context.timeZone);
  ensureEventDateNotInPast(eventDate, context.timeZone);
  if (!customerPhoneSnapshot && customerId) {
    const customerById = await fetchCustomersByIds(supabase, [customerId]);
    customerPhoneSnapshot = customerById.get(customerId)?.phone ?? null;
    customerNameSnapshot = customerNameSnapshot ?? customerById.get(customerId)?.full_name ?? null;
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
    throw new Error("CONFLICT_WARNING_REQUIRED");
  }

  const { data, error } = await supabase
    .from("makeup_events")
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
      source_input_mode: normalizeSourceInputMode(options.payload.sourceInputMode ?? null),
      source_input_text: sanitizeText(options.payload.sourceInputText ?? null),
      package_id: packageId,
      status: options.payload.status ? normalizeEventStatus(options.payload.status) : "BOOKED",
      note: sanitizeText(options.payload.note ?? null),
      price_amount: validateNonNegativeNumber(options.payload.priceAmount, "priceAmount"),
      surcharge_amount: validateNonNegativeNumber(options.payload.surchargeAmount, "surchargeAmount"),
      cost_amount: validateNonNegativeNumber(options.payload.costAmount, "costAmount"),
      is_conflict_warning: conflicts.length > 0,
      conflict_note: conflicts.length > 0 ? conflicts.map((entry) => entry.reason).join(",") : null,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .maybeSingle<MakeupEventRow>();

  if (error) throw error;
  if (!data) throw new Error("EVENT_NOT_FOUND");

  return {
    event: await mapSingleEvent(supabase, data, context.timeZone),
    conflicts,
    warningAcknowledged: conflicts.length > 0,
  };
}
