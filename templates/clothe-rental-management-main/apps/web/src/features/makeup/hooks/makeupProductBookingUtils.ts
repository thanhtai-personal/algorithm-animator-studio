import { MakeupApiError } from "@/features/makeup/services/makeupClientService";
import type { AppLocale } from "@/constants/locale";
import type { MakeupProductBookingCopy } from "@/features/makeup/hooks/makeupProductBookingCopy";

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekMonday(value: Date): Date {
  const day = value.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(value, offset);
}

function endOfWeekSunday(value: Date): Date {
  return addDays(startOfWeekMonday(value), 6);
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function endOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

export function buildMonthGrid(anchor: Date): string[][] {
  const firstCell = startOfWeekMonday(startOfMonth(anchor));
  const lastCell = endOfWeekSunday(endOfMonth(anchor));
  const weeks: string[][] = [];
  let cursor = new Date(firstCell);

  while (cursor <= lastCell) {
    const week: string[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push(toIsoDate(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function toLocalDateTimeInput(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function resolveSessionSlotByLocalDateTime(
  value: string
): "MORNING" | "AFTERNOON" | "EVENING" {
  const parsed = new Date(value);
  const hour = Number.isNaN(parsed.getTime()) ? 8 : parsed.getHours();

  if (hour < 12) return "MORNING";
  if (hour < 17) return "AFTERNOON";
  return "EVENING";
}

export function toIsoDateTime(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function resolveErrorMessage(
  error: unknown,
  copy: MakeupProductBookingCopy,
  fallback: string
): string {
  if (error instanceof MakeupApiError) {
    if (error.message === "INVALID_BOOKING_INPUT") return copy.parseFailed;
    if (error.message === "INVALID_TIME_RANGE") return copy.invalidFormHint;
    if (error.message === "INVALID_DATE_RANGE") return copy.invalidPastDateHint;
    if (error.message === "CONFLICT_WARNING_REQUIRED") return copy.conflictHint;
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    if (error.message === "INVALID_BOOKING_INPUT") return copy.parseFailed;
    if (error.message === "INVALID_TIME_RANGE") return copy.invalidFormHint;
    if (error.message === "INVALID_DATE_RANGE") return copy.invalidPastDateHint;
    return error.message;
  }

  return fallback;
}

export function translateParseWarnings(
  warnings: string[],
  copy: MakeupProductBookingCopy
): string[] {
  return warnings
    .map((entry) => {
      if (entry === "missing-customer-name") return copy.parseMissingNameWarning;
      if (entry === "missing-customer-phone") return copy.parseMissingPhoneWarning;
      return "";
    })
    .filter((entry) => entry.length > 0);
}

export function formatMonthLabel(value: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function calculateDurationMinutes(startAtIso: string, endAtIso: string): number {
  const start = new Date(startAtIso);
  const end = new Date(endAtIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));
}
