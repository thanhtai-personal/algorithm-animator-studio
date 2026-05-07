import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckMakeupConflictsQuery, MakeupConflictsResponse } from "@/types/makeupModule";
import {
  resolveActorContext,
  fetchMakeupModuleEnabled,
  assertIsoDate,
  normalizeSessionSlot,
  buildFallbackEventDateTimeRange,
  DEFAULT_EVENT_DURATION_MINUTES,
  assertIsoDateTime,
  resolveSessionSlotByStartAt,
  ensureArtistExists,
  sanitizeText,
  MakeupDomainError,
} from "@/server/data-access/makeupShared";
import { detectConflicts } from "./db";

export async function checkMakeupEventConflicts(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: CheckMakeupConflictsQuery;
  }
): Promise<MakeupConflictsResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  const eventDate = assertIsoDate(options.query.eventDate);
  let sessionSlot = normalizeSessionSlot(options.query.sessionSlot);
  let artistProfileId = sanitizeText(options.query.artistProfileId ?? null);
  if (context.role === "makeup_artist") {
    if (artistProfileId && artistProfileId !== context.actor.id) {
      throw new MakeupDomainError("FORBIDDEN_ARTIST_SCOPE");
    }
    artistProfileId = context.actor.id;
  }

  const fallbackRange = buildFallbackEventDateTimeRange({
    eventDate,
    sessionSlot: sessionSlot ?? "MORNING",
    durationMinutes: DEFAULT_EVENT_DURATION_MINUTES,
  });
  const startAt = options.query.startAt
    ? assertIsoDateTime(options.query.startAt)
    : fallbackRange.startAt;
  const endAt = options.query.endAt
    ? assertIsoDateTime(options.query.endAt)
    : fallbackRange.endAt;
  if (endAt <= startAt) {
    throw new MakeupDomainError("INVALID_TIME_RANGE", { startAt, endAt });
  }
  if (!sessionSlot) {
    sessionSlot = resolveSessionSlotByStartAt(startAt, context.timeZone);
  }

  if (artistProfileId) {
    await ensureArtistExists(supabase, {
      artistProfileId,
      branchId: context.branchId,
    });
  }

  const conflicts = await detectConflicts(supabase, {
    branchId: context.branchId,
    eventDate,
    sessionSlot,
    startAt,
    endAt,
    artistProfileId,
    customerId: sanitizeText(options.query.customerId ?? null),
    customerPhone: sanitizeText(options.query.customerPhone ?? null),
    excludeEventId: sanitizeText(options.query.excludeEventId ?? null),
  });

  return {
    branchId: context.branchId,
    timezone: context.timeZone,
    conflicts,
  };
}
