// filepath: apps/web/src/server/data-access/calendar/utils.ts
import type { OrderStatus } from "@/types/domainPrimitives";
import { ORDER_STATUS_SET, ACTIVE_ORDER_EVENT_STATUS_SET } from "./constants";
import { CalendarDomainError } from "./errors";
import type { CalendarDomainErrorCode } from "./types";

export function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

export function assertValidDateRange(startDate: string, endDate: string): void {
  if (startDate > endDate) {
    throw new CalendarDomainError("INVALID_DATE_RANGE", {
      startDate,
      endDate,
    });
  }

  const rangeDays = diffDaysBetweenIsoDates(startDate, endDate) + 1;
  if (rangeDays > 124) {
    throw new CalendarDomainError("DATE_RANGE_TOO_LARGE", {
      maxDays: 124,
      requestedDays: rangeDays,
    });
  }
}

export function diffDaysBetweenIsoDates(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00Z`).getTime();
  const to = new Date(`${toDate}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

export function diffDaysFromNow(isoDateTime: string): number {
  const value = new Date(isoDateTime).getTime();
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor((Date.now() - value) / 86_400_000));
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

export function orderToEventTitle(type: "pickup" | "return" | "booking" | "overdue", orderCode: string): string {
  if (type === "pickup") return `Pickup · ${orderCode}`;
  if (type === "return") return `Return · ${orderCode}`;
  if (type === "booking") return `Booking · ${orderCode}`;
  return `Overdue · ${orderCode}`;
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_EVENT_STATUS_SET.has(status);
}