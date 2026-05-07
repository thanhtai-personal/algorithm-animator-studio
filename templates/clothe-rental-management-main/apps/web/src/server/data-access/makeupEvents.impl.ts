import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CheckMakeupConflictsQuery,
  CreateMakeupEventPayload,
  MakeupArtistDto,
  MakeupConflictsResponse,
  MakeupEventConflictDto,
  MakeupEventMutationResponse,
  MakeupEventsQuery,
  MakeupEventsResponse,
  UpdateMakeupEventPayload,
} from "@/types/makeupModule";
import {
  assertIsoDate,
  assertIsoDateTime,
  buildFallbackEventDateTimeRange,
  DEFAULT_BRANCH_TIMEZONE,
  DEFAULT_EVENT_DURATION_MINUTES,
  ensurePackageBelongsToBranch,
  ensureArtistExists,
  ensureCustomerExists,
  fetchCustomersByIds,
  fetchMakeupModuleEnabled,
  fetchPackagesByIds,
  fetchProfileNamesByIds,
  isMissingColumnOrTableError,
  MANAGER_ROLE_SET,
  mapEventRowToDto,
  MakeupDomainError,
  type MakeupEventRow,
  normalizeEventStatus,
  normalizeSessionSlot,
  resolveSessionSlotByStartAt,
  parseNumeric,
  resolveActorContext,
  resolveCustomerByProfile,
  roundMoney,
  sanitizeText,
  validateNonNegativeNumber,
} from "@/server/data-access/makeupShared";

const MAKEUP_EVENT_SELECT_FIELDS =
  "id, branch_id, event_date, session_slot, artist_profile_id, customer_id, customer_name_snapshot, customer_phone_snapshot, guest_count, duration_minutes, start_at, end_at, source_input_mode, source_input_text, package_id, status, note, price_amount, surcharge_amount, cost_amount, is_conflict_warning, conflict_note, created_at, updated_at";

function toIsoDateInTimeZone(value: string, timeZone: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(parsed);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function ensureEventDateNotInPast(eventDate: string, timeZone: string): void {
  const today = toIsoDateInTimeZone(new Date().toISOString(), timeZone);
  if (eventDate < today) {
    throw new MakeupDomainError("INVALID_DATE_RANGE", {
      eventDate,
      minEventDate: today,
      reason: "past-event-date",
    });
  }
}

function toPositiveInteger(value: number | null | undefined, fallback: number): number {
  const parsed = Math.floor(parseNumeric(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function resolveBranchTimeZone(
  supabase: SupabaseClient,
  branchId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, timezone")
    .eq("id", branchId)
    .maybeSingle<{ id: string; timezone: string | null }>();

  if (error) throw error;
  if (!data) {
    throw new MakeupDomainError("MISSING_BRANCH_CONTEXT", {
      branchId,
      reason: "branch-not-found",
    });
  }

  return sanitizeText(data.timezone) ?? DEFAULT_BRANCH_TIMEZONE;
}

async function resolvePublicMakeupBranchId(
  supabase: SupabaseClient,
  requestedBranchId: string | null | undefined
): Promise<string | null> {
  const normalizedBranchId = sanitizeText(requestedBranchId);
  if (normalizedBranchId) return normalizedBranchId;

  const defaultShowroomResult = await supabase
    .from("showrooms")
    .select("branch_id")
    .eq("is_default", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle<{ branch_id: string }>();
  if (!defaultShowroomResult.error) {
    const branchId = sanitizeText(defaultShowroomResult.data?.branch_id);
    if (branchId) return branchId;
  } else if (!isMissingColumnOrTableError(defaultShowroomResult.error)) {
    throw defaultShowroomResult.error;
  }

  const fallbackShowroomResult = await supabase
    .from("showrooms")
    .select("branch_id")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ branch_id: string }>();
  if (!fallbackShowroomResult.error) {
    const branchId = sanitizeText(fallbackShowroomResult.data?.branch_id);
    if (branchId) return branchId;
  } else if (!isMissingColumnOrTableError(fallbackShowroomResult.error)) {
    throw fallbackShowroomResult.error;
  }

  const branchResult = await supabase
    .from("branches")
    .select("id")
    .eq("is_active", true)
    .order("code", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (branchResult.error) throw branchResult.error;

  return sanitizeText(branchResult.data?.id);
}

function normalizeSourceInputMode(value: string | null | undefined): "VOICE" | "TEXT" | null {
  const normalized = sanitizeText(value)?.toUpperCase() ?? "";
  if (!normalized) return null;
  if (normalized === "VOICE" || normalized === "TEXT") return normalized;
  return null;
}

async function detectConflicts(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    eventDate: string;
    sessionSlot: "MORNING" | "AFTERNOON" | "EVENING";
    startAt: string;
    endAt: string;
    artistProfileId: string | null;
    customerId: string | null;
    customerPhone: string | null;
    excludeEventId?: string | null;
  }
): Promise<MakeupEventConflictDto[]> {
  const parsedStartAt = assertIsoDateTime(options.startAt);
  const parsedEndAt = assertIsoDateTime(options.endAt);
  if (parsedEndAt <= parsedStartAt) {
    throw new MakeupDomainError("INVALID_TIME_RANGE", {
      startAt: parsedStartAt,
      endAt: parsedEndAt,
    });
  }

  type ConflictRow = Pick<
    MakeupEventRow,
    | "id"
    | "event_date"
    | "session_slot"
    | "artist_profile_id"
    | "customer_id"
    | "customer_phone_snapshot"
    | "start_at"
    | "end_at"
  >;

  const queryOverlapRows = async (filters: {
    artistProfileId?: string;
    customerId?: string;
    customerPhone?: string;
  }): Promise<ConflictRow[]> => {
    let query = supabase
      .from("makeup_events")
      .select(
        "id, event_date, session_slot, artist_profile_id, customer_id, customer_phone_snapshot, start_at, end_at"
      )
      .eq("branch_id", options.branchId)
      .neq("status", "CANCELLED")
      .lt("start_at", parsedEndAt)
      .gt("end_at", parsedStartAt)
      .order("start_at", { ascending: true });

    if (filters.artistProfileId) query = query.eq("artist_profile_id", filters.artistProfileId);
    if (filters.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters.customerPhone) query = query.eq("customer_phone_snapshot", filters.customerPhone);
    if (options.excludeEventId) query = query.neq("id", options.excludeEventId);

    const { data, error } = await query.returns<ConflictRow[]>();
    if (!error) return data ?? [];
    if (!isMissingColumnOrTableError(error)) {
      throw error;
    }

    // Legacy fallback for environments that have not applied time-range columns yet.
    let legacyQuery = supabase
      .from("makeup_events")
      .select("id, event_date, session_slot, artist_profile_id, customer_id")
      .eq("branch_id", options.branchId)
      .eq("event_date", options.eventDate)
      .eq("session_slot", options.sessionSlot)
      .neq("status", "CANCELLED")
      .order("created_at", { ascending: true });

    if (filters.artistProfileId) legacyQuery = legacyQuery.eq("artist_profile_id", filters.artistProfileId);
    if (filters.customerId) legacyQuery = legacyQuery.eq("customer_id", filters.customerId);
    if (options.excludeEventId) legacyQuery = legacyQuery.neq("id", options.excludeEventId);

    const { data: legacyRows, error: legacyError } = await legacyQuery.returns<
      Array<
        Pick<
          MakeupEventRow,
          "id" | "event_date" | "session_slot" | "artist_profile_id" | "customer_id"
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
    options.customerId ? queryOverlapRows({ customerId: options.customerId }) : Promise.resolve([]),
    options.customerPhone ? queryOverlapRows({ customerPhone: options.customerPhone }) : Promise.resolve([]),
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
        .filter((value): value is string => Boolean(value))
    )
  );
  const customerIds = Array.from(
    new Set(rows.map((row) => sanitizeText(row.customer_id)).filter((value): value is string => Boolean(value)))
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
    const customerName = row.customer_id ? customerMap.get(row.customer_id)?.full_name ?? null : null;

    if (options.artistProfileId && row.artist_profile_id === options.artistProfileId) {
      const key = `${row.id}:ARTIST_SLOT_CONFLICT`;
      if (!pushed.has(key)) {
        pushed.add(key);
        const artistProfileId = sanitizeText(row.artist_profile_id) ?? "";
        conflicts.push({
          eventId: row.id,
          eventDate: row.event_date,
          sessionSlot: slot,
          artistProfileId,
          artistName: artistProfileId ? artistMap.get(artistProfileId)?.full_name ?? null : null,
          customerId: row.customer_id,
          customerName,
          reason: "ARTIST_SLOT_CONFLICT",
        });
      }
    }

    const matchedCustomerById = Boolean(options.customerId && row.customer_id === options.customerId);
    const matchedCustomerByPhone = Boolean(
      options.customerPhone &&
        sanitizeText(row.customer_phone_snapshot)?.replace(/\s+/g, "") ===
          options.customerPhone.replace(/\s+/g, "")
    );

    if (matchedCustomerById || matchedCustomerByPhone) {
      const key = `${row.id}:CUSTOMER_SLOT_CONFLICT`;
      if (!pushed.has(key)) {
        pushed.add(key);
        const artistProfileId = sanitizeText(row.artist_profile_id) ?? "";
        conflicts.push({
          eventId: row.id,
          eventDate: row.event_date,
          sessionSlot: slot,
          artistProfileId,
          artistName: artistProfileId ? artistMap.get(artistProfileId)?.full_name ?? null : null,
          customerId: row.customer_id,
          customerName,
          reason: "CUSTOMER_SLOT_CONFLICT",
        });
      }
    }
  }

  return conflicts;
}

async function fetchEventById(
  supabase: SupabaseClient,
  options: { eventId: string; branchId: string }
): Promise<MakeupEventRow | null> {
  const result = await supabase
    .from("makeup_events")
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .eq("id", options.eventId)
    .eq("branch_id", options.branchId)
    .maybeSingle<MakeupEventRow>();

  if (!result.error) {
    return result.data ?? null;
  }

  if (!isMissingColumnOrTableError(result.error)) {
    throw result.error;
  }

  const legacySelectFields =
    "id, branch_id, event_date, session_slot, artist_profile_id, customer_id, package_id, status, note, price_amount, cost_amount, is_conflict_warning, conflict_note, created_at, updated_at";
  const { data: legacyData, error: legacyError } = await supabase
    .from("makeup_events")
    .select(legacySelectFields)
    .eq("id", options.eventId)
    .eq("branch_id", options.branchId)
    .maybeSingle<
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

async function mapSingleEvent(
  supabase: SupabaseClient,
  row: MakeupEventRow,
  timeZone?: string
) {
  const [artistById, customerById, packageById] = await Promise.all([
    fetchProfileNamesByIds(
      supabase,
      row.artist_profile_id ? [row.artist_profile_id] : []
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
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  const startDate = options.query.startDate ? assertIsoDate(options.query.startDate) : null;
  const endDate = options.query.endDate ? assertIsoDate(options.query.endDate) : null;
  if (startDate && endDate && startDate > endDate) {
    throw new MakeupDomainError("INVALID_DATE_RANGE", {
      startDate,
      endDate,
    });
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
      throw new MakeupDomainError("FORBIDDEN_ARTIST_SCOPE", { requestedArtistProfileId });
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
      throw new MakeupDomainError("FORBIDDEN_ROLE", { reason: "customer-scope-mismatch" });
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
    if (context.role === "makeup_artist") {
      legacyQuery = legacyQuery.eq("artist_profile_id", context.actor.id);
    } else if (requestedArtistProfileId) {
      legacyQuery = legacyQuery.eq("artist_profile_id", requestedArtistProfileId);
    }
    if (context.role === "customer") {
      const ownCustomerId = await resolveCustomerByProfile(supabase, {
        branchId: context.branchId,
        profileId: context.actor.id,
      });
      if (ownCustomerId) {
        legacyQuery = legacyQuery.eq("customer_id", ownCustomerId);
      }
    } else if (requestedCustomerId) {
      legacyQuery = legacyQuery.eq("customer_id", requestedCustomerId);
    }

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
    }));
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
    throw new MakeupDomainError("FORBIDDEN_ROLE", { role: context.role });
  }
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
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
      throw new MakeupDomainError("FORBIDDEN_ARTIST_SCOPE");
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
    if (!ownCustomerId) throw new MakeupDomainError("CUSTOMER_NOT_FOUND");
    if (customerId && customerId !== ownCustomerId) {
      throw new MakeupDomainError("FORBIDDEN_ROLE", { reason: "customer-scope-mismatch" });
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
    sessionSlot: sessionSlot ?? "MORNING",
    durationMinutes,
  });
  const startAt = options.payload.startAt
    ? assertIsoDateTime(options.payload.startAt)
    : fallbackRange.startAt;
  const endAt = options.payload.endAt
    ? assertIsoDateTime(options.payload.endAt)
    : new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString();
  if (endAt <= startAt) {
    throw new MakeupDomainError("INVALID_TIME_RANGE", { startAt, endAt });
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
    throw new MakeupDomainError("CONFLICT_WARNING_REQUIRED", { conflicts });
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
  if (!data) throw new MakeupDomainError("EVENT_NOT_FOUND");

  return {
    event: await mapSingleEvent(supabase, data, context.timeZone),
    conflicts,
    warningAcknowledged: conflicts.length > 0,
  };
}

export async function createPublicMakeupEvent(
  supabase: SupabaseClient,
  options: {
    payload: CreateMakeupEventPayload;
  }
): Promise<MakeupEventMutationResponse> {
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  const branchId = await resolvePublicMakeupBranchId(supabase, options.payload.branchId);
  if (!branchId) {
    throw new MakeupDomainError("MISSING_BRANCH_CONTEXT", {
      reason: "missing-default-public-branch",
    });
  }

  const timeZone = await resolveBranchTimeZone(supabase, branchId);

  assertIsoDate(options.payload.eventDate);
  let sessionSlot = normalizeSessionSlot(options.payload.sessionSlot);
  const artistProfileId = sanitizeText(options.payload.artistProfileId ?? null);
  const guestCount = toPositiveInteger(options.payload.guestCount, 1);
  const durationMinutes = toPositiveInteger(
    options.payload.durationMinutes,
    guestCount * DEFAULT_EVENT_DURATION_MINUTES
  );

  if (artistProfileId) {
    await ensureArtistExists(supabase, {
      artistProfileId,
      branchId,
    });
  }

  const customerId = sanitizeText(options.payload.customerId ?? null);
  let customerNameSnapshot = sanitizeText(options.payload.customerName ?? null);
  let customerPhoneSnapshot = sanitizeText(options.payload.customerPhone ?? null);

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
    sessionSlot: sessionSlot ?? "MORNING",
    durationMinutes,
  });
  const startAt = options.payload.startAt
    ? assertIsoDateTime(options.payload.startAt)
    : fallbackRange.startAt;
  const endAt = options.payload.endAt
    ? assertIsoDateTime(options.payload.endAt)
    : new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString();
  if (endAt <= startAt) {
    throw new MakeupDomainError("INVALID_TIME_RANGE", { startAt, endAt });
  }
  if (!sessionSlot) {
    sessionSlot = resolveSessionSlotByStartAt(startAt, timeZone);
  }

  const eventDate = toIsoDateInTimeZone(startAt, timeZone);
  ensureEventDateNotInPast(eventDate, timeZone);
  if (!customerPhoneSnapshot && customerId) {
    const customerById = await fetchCustomersByIds(supabase, [customerId]);
    customerPhoneSnapshot = customerById.get(customerId)?.phone ?? null;
    customerNameSnapshot = customerNameSnapshot ?? customerById.get(customerId)?.full_name ?? null;
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
    throw new MakeupDomainError("CONFLICT_WARNING_REQUIRED", {
      conflicts,
      overrideAllowed: false,
      source: "public-booking",
    });
  }

  const { data, error } = await supabase
    .from("makeup_events")
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
      created_by: null,
      updated_by: null,
    })
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .maybeSingle<MakeupEventRow>();

  if (error) throw error;
  if (!data) throw new MakeupDomainError("EVENT_NOT_FOUND");

  return {
    event: await mapSingleEvent(supabase, data, timeZone),
    conflicts,
    warningAcknowledged: conflicts.length > 0,
  };
}

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

  if (context.role === "accountant") {
    throw new MakeupDomainError("FORBIDDEN_ROLE", { role: context.role });
  }

  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  const event = await fetchEventById(supabase, {
    eventId: options.eventId,
    branchId: context.branchId,
  });
  if (!event) throw new MakeupDomainError("EVENT_NOT_FOUND");

  if (context.role === "makeup_artist" && event.artist_profile_id !== context.actor.id) {
    throw new MakeupDomainError("FORBIDDEN_ARTIST_SCOPE");
  }

  let customerScopeId: string | null = null;
  if (context.role === "customer") {
    customerScopeId = await resolveCustomerByProfile(supabase, {
      branchId: context.branchId,
      profileId: context.actor.id,
    });

    if (!customerScopeId || event.customer_id !== customerScopeId) {
      throw new MakeupDomainError("FORBIDDEN_ROLE", {
        reason: "customer-event-scope-mismatch",
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

  if (context.role === "makeup_artist" && artistProfileId !== context.actor.id) {
    throw new MakeupDomainError("FORBIDDEN_ARTIST_SCOPE");
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

  if (context.role === "customer") {
    if (!customerScopeId) {
      throw new MakeupDomainError("CUSTOMER_NOT_FOUND");
    }

    if (customerId && customerId !== customerScopeId) {
      throw new MakeupDomainError("FORBIDDEN_ROLE", {
        reason: "customer-scope-mismatch",
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
    baseGuestCount * DEFAULT_EVENT_DURATION_MINUTES
  );
  const durationMinutes =
    options.payload.durationMinutes === undefined
      ? options.payload.guestCount === undefined
        ? baseDuration
        : guestCount * DEFAULT_EVENT_DURATION_MINUTES
      : toPositiveInteger(
          options.payload.durationMinutes,
          guestCount * DEFAULT_EVENT_DURATION_MINUTES
        );

  const baseRange = buildFallbackEventDateTimeRange({
    eventDate: event.event_date,
    sessionSlot: normalizeSessionSlot(event.session_slot) ?? "MORNING",
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

  if (endAt <= startAt) {
    throw new MakeupDomainError("INVALID_TIME_RANGE", { startAt, endAt });
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
    customerNameSnapshot = customerNameSnapshot ?? customerById.get(customerId)?.full_name ?? null;
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
    throw new MakeupDomainError("CONFLICT_WARNING_REQUIRED", { conflicts });
  }

  const { data, error } = await supabase
    .from("makeup_events")
    .update({
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
        options.payload.note === undefined ? event.note : sanitizeText(options.payload.note ?? null),
      price_amount:
        options.payload.priceAmount === undefined
          ? roundMoney(parseNumeric(event.price_amount))
          : validateNonNegativeNumber(options.payload.priceAmount, "priceAmount"),
      surcharge_amount:
        options.payload.surchargeAmount === undefined
          ? roundMoney(parseNumeric(event.surcharge_amount))
          : validateNonNegativeNumber(options.payload.surchargeAmount, "surchargeAmount"),
      cost_amount:
        options.payload.costAmount === undefined
          ? roundMoney(parseNumeric(event.cost_amount))
          : validateNonNegativeNumber(options.payload.costAmount, "costAmount"),
      is_conflict_warning: conflicts.length > 0,
      conflict_note: conflicts.length > 0 ? conflicts.map((entry) => entry.reason).join(",") : null,
      updated_by: options.actorProfileId,
    })
    .eq("id", event.id)
    .select(MAKEUP_EVENT_SELECT_FIELDS)
    .maybeSingle<MakeupEventRow>();

  if (error) throw error;
  if (!data) throw new MakeupDomainError("EVENT_NOT_FOUND");

  return {
    event: await mapSingleEvent(supabase, data, context.timeZone),
    conflicts,
    warningAcknowledged: conflicts.length > 0,
  };
}

export async function listMakeupArtists(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId?: string | null;
  }
): Promise<{ branchId: string; items: MakeupArtistDto[] }> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.branchId ?? null),
  });
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  if (!MANAGER_ROLE_SET.has(context.role ?? "")) {
    throw new MakeupDomainError("FORBIDDEN_ROLE", { role: context.role });
  }

  const { data: accessRows, error: accessError } = await supabase
    .from("profile_branch_access")
    .select("profile_id, branch_id")
    .eq("branch_id", context.branchId)
    .eq("is_delete", false)
    .returns<Array<{ profile_id: string; branch_id: string }>>();

  if (accessError) throw accessError;

  const profileIds = Array.from(new Set((accessRows ?? []).map((row) => row.profile_id)));
  if (profileIds.length === 0) {
    return { branchId: context.branchId, items: [] };
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active, default_branch_id")
    .in("id", profileIds)
    .eq("role", "makeup_artist")
    .returns<
      Array<{
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        is_active: boolean;
        default_branch_id: string | null;
      }>
    >();

  if (profileError) throw profileError;

  const branchIdsByProfile = new Map<string, string[]>();
  for (const row of accessRows ?? []) {
    const bucket = branchIdsByProfile.get(row.profile_id);
    if (bucket) {
      bucket.push(row.branch_id);
    } else {
      branchIdsByProfile.set(row.profile_id, [row.branch_id]);
    }
  }

  return {
    branchId: context.branchId,
    items: (profileRows ?? []).map((row) => ({
      profileId: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      isActive: row.is_active,
      defaultBranchId: row.default_branch_id,
      branchIds: branchIdsByProfile.get(row.id) ?? [],
    })),
  };
}

export async function listPublicMakeupArtists(
  supabase: SupabaseClient,
  options: {
    branchId?: string | null;
  }
): Promise<{ branchId: string; items: MakeupArtistDto[] }> {
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  const branchId = await resolvePublicMakeupBranchId(supabase, options.branchId);
  if (!branchId) {
    throw new MakeupDomainError("MISSING_BRANCH_CONTEXT", {
      reason: "missing-default-public-branch",
    });
  }

  const { data: accessRows, error: accessError } = await supabase
    .from("profile_branch_access")
    .select("profile_id, branch_id")
    .eq("branch_id", branchId)
    .eq("is_delete", false)
    .returns<Array<{ profile_id: string; branch_id: string }>>();

  if (accessError) throw accessError;

  const profileIds = Array.from(new Set((accessRows ?? []).map((row) => row.profile_id)));
  if (profileIds.length === 0) {
    return { branchId, items: [] };
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active, default_branch_id")
    .in("id", profileIds)
    .eq("role", "makeup_artist")
    .eq("is_active", true)
    .returns<
      Array<{
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        is_active: boolean;
        default_branch_id: string | null;
      }>
    >();

  if (profileError) throw profileError;

  const branchIdsByProfile = new Map<string, string[]>();
  for (const row of accessRows ?? []) {
    const bucket = branchIdsByProfile.get(row.profile_id);
    if (bucket) {
      bucket.push(row.branch_id);
    } else {
      branchIdsByProfile.set(row.profile_id, [row.branch_id]);
    }
  }

  const items = (profileRows ?? [])
    .map((row) => ({
      profileId: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      isActive: row.is_active,
      defaultBranchId: row.default_branch_id,
      branchIds: branchIdsByProfile.get(row.id) ?? [],
    }))
    .sort((left, right) => {
      const leftLabel = left.fullName?.trim().toLowerCase() ?? left.profileId.toLowerCase();
      const rightLabel = right.fullName?.trim().toLowerCase() ?? right.profileId.toLowerCase();
      return leftLabel.localeCompare(rightLabel);
    });

  return {
    branchId,
    items,
  };
}
