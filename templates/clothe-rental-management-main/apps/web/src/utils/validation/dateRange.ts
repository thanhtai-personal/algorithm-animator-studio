import type { DateRangeValue } from "@/types/domainPrimitives";

export type DateRangeValidationError =
  | "empty-start-date"
  | "empty-end-date"
  | "invalid-start-date"
  | "invalid-end-date"
  | "end-before-start"
  | "same-day-not-allowed";

export interface DateRangeValidationResult {
  isValid: boolean;
  error: DateRangeValidationError | null;
}

interface ValidateDateRangeOptions {
  allowEmpty?: boolean;
  allowSameDay?: boolean;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function validateDateRange(
  value: DateRangeValue,
  options?: ValidateDateRangeOptions
): DateRangeValidationResult {
  const allowEmpty = options?.allowEmpty ?? false;
  const allowSameDay = options?.allowSameDay ?? true;

  if (!value.startDate) {
    if (allowEmpty && !value.endDate) {
      return { isValid: true, error: null };
    }
    return { isValid: false, error: "empty-start-date" };
  }

  if (!value.endDate) {
    return { isValid: false, error: "empty-end-date" };
  }

  const startDate = parseDate(value.startDate);
  if (!startDate) {
    return { isValid: false, error: "invalid-start-date" };
  }

  const endDate = parseDate(value.endDate);
  if (!endDate) {
    return { isValid: false, error: "invalid-end-date" };
  }

  if (endDate < startDate) {
    return { isValid: false, error: "end-before-start" };
  }

  if (!allowSameDay && endDate.getTime() === startDate.getTime()) {
    return { isValid: false, error: "same-day-not-allowed" };
  }

  return { isValid: true, error: null };
}
