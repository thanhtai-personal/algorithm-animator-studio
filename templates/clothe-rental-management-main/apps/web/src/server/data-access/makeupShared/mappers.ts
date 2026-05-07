import type { MakeupEventDto, MakeupPackageDto, MakeupSessionSlot } from "@/types/makeupModule";
import { parseNumeric, roundMoney, sanitizeText, buildFallbackEventDateTimeRange, normalizeSessionSlot, resolveSessionSlotByStartAt, normalizeEventStatus } from "./utils";
import { DEFAULT_EVENT_DURATION_MINUTES } from "./constants";
import type { MakeupEventRow, ProfileNameRow, CustomerRow, MakeupPackageRow } from "./types";

export function mapEventRowToDto(options: {
  row: MakeupEventRow;
  artistById: Map<string, ProfileNameRow>;
  customerById: Map<string, CustomerRow>;
  packageById: Map<string, MakeupPackageRow>;
  timeZone?: string;
}): MakeupEventDto {
  const durationMinutes = Math.max(
    1,
    Math.floor(parseNumeric(options.row.duration_minutes ?? DEFAULT_EVENT_DURATION_MINUTES))
  );
  const guestCount = Math.max(1, Math.floor(parseNumeric(options.row.guest_count ?? 1)));
  const fallbackRange = buildFallbackEventDateTimeRange({
    eventDate: options.row.event_date,
    sessionSlot: normalizeSessionSlot(options.row.session_slot) ?? "MORNING",
    durationMinutes,
  } as { eventDate: string; sessionSlot: MakeupSessionSlot; durationMinutes: number });
  const startAt = sanitizeText(options.row.start_at) ?? fallbackRange.startAt;
  const endAt = sanitizeText(options.row.end_at) ?? fallbackRange.endAt;
  const slot =
    normalizeSessionSlot(options.row.session_slot) ?? resolveSessionSlotByStartAt(startAt, options.timeZone);
  const artistProfileId = sanitizeText(options.row.artist_profile_id) ?? "";
  const artist = artistProfileId ? options.artistById.get(artistProfileId) : undefined;
  const customer = options.row.customer_id ? options.customerById.get(options.row.customer_id) : null;
  const makeupPackage = options.row.package_id ? options.packageById.get(options.row.package_id) : null;

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

export async function mapPackageRowToDto(row: MakeupPackageRow): Promise<MakeupPackageDto> {
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
