import { DashboardActivityRowDto, DashboardOrderRowDto } from "@/types/dashboardOverview";
import { OrderStatus } from "@/types/domainPrimitives";
import { DEFAULT_BRANCH_TIMEZONE, ORDER_STATUS_SET, MANAGER_PLUS_ROLE_SET } from "./constants";
import { AuditEventRow, CustomerRefRow, DashboardOrderRow, ProfileNameRow } from "./interfaces";


export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function normalizeBranchTimeZone(value: string | null | undefined): string {
  const sanitized = sanitizeText(value);
  if (!sanitized) return DEFAULT_BRANCH_TIMEZONE;
  return isValidTimeZone(sanitized) ? sanitized : DEFAULT_BRANCH_TIMEZONE;
}

export function isMissingOptionalPaymentColumnsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const row = error as Record<string, unknown>;

  const code = typeof row.code === "string" ? row.code : "";
  const message = typeof row.message === "string" ? row.message : "";
  const details = typeof row.details === "string" ? row.details : "";
  const hint = typeof row.hint === "string" ? row.hint : "";
  const combined = `${message} ${details} ${hint}`.toLowerCase();
  const missingOptionalColumns =
    combined.includes("payments.source") ||
    combined.includes("payments.reason") ||
    combined.includes("payments.is_initial_capital") ||
    combined.includes("payments.is_import_order") ||
    combined.includes("column source") ||
    combined.includes("column reason") ||
    combined.includes("column is_initial_capital") ||
    combined.includes("column is_import_order");

  if (!missingOptionalColumns) return false;
  if (code === "42703" || code === "PGRST204") return true;

  return (
    combined.includes("does not exist") ||
    combined.includes("schema cache") ||
    combined.includes("could not find")
  );
}

export function parseNumeric(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function normalizeOrderStatus(value: string | null | undefined): OrderStatus {
  if (!value) return "DRAFT";
  const normalized = value.trim().toUpperCase() as OrderStatus;
  if (!ORDER_STATUS_SET.has(normalized)) return "DRAFT";
  return normalized;
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === "staff";
}

export function isManagerPlusRole(role: string | null | undefined): boolean {
  return role !== null && role !== undefined && MANAGER_PLUS_ROLE_SET.has(role);
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  });

  const timeZoneName =
    formatter.formatToParts(date).find((part) => part.type === "timeZoneName")
      ?.value ?? "GMT+0";

  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  const hour = Number.parseInt(match[2] ?? "0", 10);
  const minute = Number.parseInt(match[3] ?? "0", 10);

  return sign * (hour * 60 + minute);
}

export function zonedDateTimeToUtc(options: {
  date: string;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  timeZone: string;
}): Date {
  const { date, hours, minutes, seconds, milliseconds, timeZone } = options;
  const utcGuess = new Date(
    `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}Z`,
  );

  let resolved = utcGuess;
  for (let index = 0; index < 2; index += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(resolved, timeZone);
    resolved = new Date(utcGuess.getTime() - offsetMinutes * 60_000);
  }

  return resolved;
}

export function addDaysToIsoDate(date: string, days: number): string {
  const [yearText, monthText, dayText] = date.split("-");
  const year = Number.parseInt(yearText ?? "0", 10);
  const month = Number.parseInt(monthText ?? "0", 10);
  const day = Number.parseInt(dayText ?? "0", 10);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);

  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, "0");
  const d = String(base.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildTodayUtcRange(options: { today: string; timeZone: string }): {
  startIso: string;
  endExclusiveIso: string;
} {
  const start = zonedDateTimeToUtc({
    date: options.today,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    timeZone: options.timeZone,
  });

  const tomorrow = addDaysToIsoDate(options.today, 1);
  const endExclusive = zonedDateTimeToUtc({
    date: tomorrow,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    timeZone: options.timeZone,
  });

  return {
    startIso: start.toISOString(),
    endExclusiveIso: endExclusive.toISOString(),
  };
}