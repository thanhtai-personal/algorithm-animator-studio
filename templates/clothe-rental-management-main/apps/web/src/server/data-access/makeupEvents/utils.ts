import { MakeupDomainError } from "@/server/data-access/makeupShared";
import { sanitizeText } from "@/server/data-access/makeupShared";
import { DEFAULT_BRANCH_TIMEZONE } from "@/server/data-access/makeupShared";

export function toIsoDateInTimeZone(value: string, timeZone: string): string {
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

export function ensureEventDateNotInPast(eventDate: string, timeZone: string): void {
  const today = toIsoDateInTimeZone(new Date().toISOString(), timeZone);
  if (eventDate < today) {
    throw new MakeupDomainError("INVALID_DATE_RANGE", {
      eventDate,
      minEventDate: today,
      reason: "past-event-date",
    });
  }
}

export function toPositiveInteger(value: number | null | undefined, fallback: number): number {
  const parsed = Math.floor(Number(value ?? 0));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function normalizeSourceInputMode(value: string | null | undefined): "VOICE" | "TEXT" | null {
  const normalized = sanitizeText(value)?.toUpperCase() ?? "";
  if (!normalized) return null;
  if (normalized === "VOICE" || normalized === "TEXT") return normalized;
  return null;
}
