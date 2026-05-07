import type { SupabaseClient } from "@supabase/supabase-js";
import type { MakeupEventsQuery, MakeupEventsResponse } from "@/types/makeupModule";
import type { MakeupEventRow } from "@/server/data-access/makeupShared";
import { MAKEUP_EVENT_SELECT_FIELDS } from "./constants";
import {
  resolveActorContext,
  fetchMakeupModuleEnabled,
  assertIsoDate,
  sanitizeText,
  resolveCustomerByProfile,
  isMissingColumnOrTableError,
  fetchProfileNamesByIds,
  fetchCustomersByIds,
  fetchPackagesByIds,
  mapEventRowToDto,
  DEFAULT_EVENT_DURATION_MINUTES,
} from "@/server/data-access/makeupShared";

export async function listMakeupEvents(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: MakeupEventsQuery;
  }
): Promise<MakeupEventsResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });
  const moduleEnabled = await fetchMakeupModuleEnabled(supabase);
  if (!moduleEnabled) {
    throw new Error("MODULE_DISABLED");
  }

  const startDate = options.query.startDate ? assertIsoDate(options.query.startDate) : null;
  const endDate = options.query.endDate ? assertIsoDate(options.query.endDate) : null;
  if (startDate && endDate && startDate > endDate) {
    throw new Error("INVALID_DATE_RANGE");
  }

  let query = supabase
    .from("makeup_events")
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .eq("branch_id", context.branchId)
    .order("start_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (startDate) query = query.gte("event_date", startDate);
  if (endDate) query = query.lte("event_date", endDate);

  const requestedArtistProfileId = sanitizeText(options.query.artistProfileId ?? null);
  const requestedCustomerId = sanitizeText(options.query.customerId ?? null);

  if (context.role === "makeup_artist") {
    if (requestedArtistProfileId && requestedArtistProfileId !== context.actor.id) {
      throw new Error("FORBIDDEN_ARTIST_SCOPE");
    }
    query = query.eq("artist_profile_id", context.actor.id);
  } else if (requestedArtistProfileId) {
    query = query.eq("artist_profile_id", requestedArtistProfileId);
  }

  if (context.role === "customer") {
    const ownCustomerId = await resolveCustomerByProfile(supabase, {
      branchId: context.branchId,
      profileId: context.actor.id,
    });
    if (!ownCustomerId) {
      return {
        branchId: context.branchId,
        timezone: context.timeZone,
        moduleEnabled,
        events: [],
      };
    }

    if (requestedCustomerId && requestedCustomerId !== ownCustomerId) {
      throw new Error("FORBIDDEN_ROLE");
    }

    query = query.eq("customer_id", ownCustomerId);
  } else if (requestedCustomerId) {
    query = query.eq("customer_id", requestedCustomerId);
  }

  const queryResult = await query.returns<MakeupEventRow[]>();
  let rows: MakeupEventRow[] = [];

  if (queryResult.error) {
    if (!isMissingColumnOrTableError(queryResult.error)) {
      throw queryResult.error;
    }

    const legacySelectFields =
      "id, branch_id, event_date, session_slot, artist_profile_id, customer_id, package_id, status, note, price_amount, cost_amount, is_conflict_warning, conflict_note, created_at, updated_at";

    let legacyQuery = supabase
      .from("makeup_events")
      .select(legacySelectFields)
      .eq("branch_id", context.branchId)
      .order("event_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (startDate) legacyQuery = legacyQuery.gte("event_date", startDate);
    if (endDate) legacyQuery = legacyQuery.lte("event_date", endDate);

    const { data: legacyRows, error: legacyError } = await legacyQuery.returns<
      Array<
        Pick<
          MakeupEventRow,
          | "id"
          | "branch_id"
          | "event_date"
          | "session_slot"
          | "artist_profile_id"
          | "customer_id"
          | "package_id"
          | "status"
          | "note"
          | "price_amount"
          | "cost_amount"
          | "is_conflict_warning"
          | "conflict_note"
          | "created_at"
          | "updated_at"
        >
      >
    >();
    if (legacyError) throw legacyError;

    rows = (legacyRows ?? []).map((row) => ({
      ...row,
      customer_name_snapshot: null,
      customer_phone_snapshot: null,
      guest_count: 1,
      duration_minutes: DEFAULT_EVENT_DURATION_MINUTES,
      start_at: null,
      end_at: null,
      source_input_mode: null,
      source_input_text: null,
      surcharge_amount: 0,
    } as unknown as MakeupEventRow));
  } else {
    rows = queryResult.data ?? [];
  }

  const artistIds = Array.from(
    new Set(
      rows
        .map((row) => sanitizeText(row.artist_profile_id))
        .filter((value): value is string => Boolean(value))
    )
  );
  const customerIds = Array.from(
    new Set(rows.map((row) => sanitizeText(row.customer_id)).filter((value): value is string => Boolean(value)))
  );
  const packageIds = Array.from(
    new Set(rows.map((row) => sanitizeText(row.package_id)).filter((value): value is string => Boolean(value)))
  );

  const [artistById, customerById, packageById] = await Promise.all([
    fetchProfileNamesByIds(supabase, artistIds),
    fetchCustomersByIds(supabase, customerIds),
    fetchPackagesByIds(supabase, packageIds),
  ]);

  return {
    branchId: context.branchId,
    timezone: context.timeZone,
    moduleEnabled,
    events: rows.map((row) =>
      mapEventRowToDto({
        row,
        artistById,
        customerById,
        packageById,
        timeZone: context.timeZone,
      })
    ),
  };
}
