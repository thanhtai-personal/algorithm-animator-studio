import type { MakeupSessionSlot, MakeupEventStatus } from "@/types/makeupModule";
import {
  DEFAULT_BRANCH_TIMEZONE,
  SESSION_SLOT_SET,
  EVENT_STATUS_SET,
  DEFAULT_EVENT_DURATION_MINUTES,
} from "./constants";
import { MakeupDomainError } from "./errors";

export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseNumeric(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function normalizeRole(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  if (normalized === "admin") return "owner_admin";
  return normalized;
}

export function normalizeSessionSlot(
  value: string | null | undefined
): MakeupSessionSlot | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  if (!SESSION_SLOT_SET.has(normalized as MakeupSessionSlot)) {
    return null;
  }
  return normalized as MakeupSessionSlot;
}

export function normalizeEventStatus(value: string | null | undefined): MakeupEventStatus {
  const normalized = value?.trim().toUpperCase() ?? "BOOKED";
  if (!EVENT_STATUS_SET.has(normalized as MakeupEventStatus)) {
    return "BOOKED";
  }
  return normalized as MakeupEventStatus;
}

export function assertIsoDate(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new MakeupDomainError("INVALID_DATE", { value });
  }
  return value;
}

export function assertIsoDateTime(value: string | null | undefined): string {
  if (!value) {
    throw new MakeupDomainError("INVALID_DATETIME", { value });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new MakeupDomainError("INVALID_DATETIME", { value });
  }

  return parsed.toISOString();
}

function resolveDefaultStartTimeFromSessionSlot(sessionSlot: MakeupSessionSlot): string {
  if (sessionSlot === "MORNING") return "08:00:00";
  if (sessionSlot === "AFTERNOON") return "13:00:00";
  return "18:00:00";
}

export function resolveSessionSlotByStartAt(
  startAt: string,
  timeZone = DEFAULT_BRANCH_TIMEZONE
): MakeupSessionSlot {
  const parsed = new Date(startAt);
  if (Number.isNaN(parsed.getTime())) return "MORNING";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  });

  const hourRaw = formatter
    .formatToParts(parsed)
    .find((part) => part.type === "hour")
    ?.value;
  const hour = Number.parseInt(hourRaw ?? "8", 10);
  if (!Number.isFinite(hour)) return "MORNING";

  if (hour < 12) return "MORNING";
  if (hour < 17) return "AFTERNOON";
  return "EVENING";
}

export function buildFallbackEventDateTimeRange(options: {
  eventDate: string;
  sessionSlot: MakeupSessionSlot;
  durationMinutes: number;
}): { startAt: string; endAt: string } {
  const startTime = resolveDefaultStartTimeFromSessionSlot(options.sessionSlot);
  const startAt = new Date(`${options.eventDate}T${startTime}+07:00`);
  const normalizedStart =
    Number.isNaN(startAt.getTime()) ? new Date(`${options.eventDate}T08:00:00+07:00`) : startAt;

  const endAt = new Date(normalizedStart.getTime() + Math.max(1, options.durationMinutes) * 60_000);
  return {
    startAt: normalizedStart.toISOString(),
    endAt: endAt.toISOString(),
  };
}

export function isMissingColumnOrTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const row = error as Record<string, unknown>;
  const code = typeof row.code === "string" ? row.code.toUpperCase() : "";
  if (code === "42703" || code === "42P01" || code === "PGRST204") {
    return true;
  }

  const message = `${String(row.message ?? "")} ${String(row.details ?? "")} ${String(
    row.hint ?? ""
  )}`.toLowerCase();
  return message.includes("does not exist") || message.includes("schema cache");
}

export function validateNonNegativeNumber(
  value: number | string | null | undefined,
  field: string
): number {
  const parsed = roundMoney(parseNumeric(value));
  if (parsed < 0) {
    throw new MakeupDomainError("INVALID_NON_NEGATIVE_NUMBER", {
      field,
      value,
    });
  }

  return parsed;
}
