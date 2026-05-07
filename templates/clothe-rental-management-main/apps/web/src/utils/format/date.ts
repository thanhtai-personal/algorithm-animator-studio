import type { AppLocale } from "@/constants/locale";
import type { DateRangeValue } from "@/types/domainPrimitives";

const APP_LOCALE_TO_INTL: Record<AppLocale, string> = {
  vi: "vi-VN",
  en: "en-US",
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateLabel(
  value: string | Date | null | undefined,
  options?: {
    locale?: AppLocale;
    dateStyle?: "short" | "medium" | "long";
  }
): string {
  const parsedDate = toDate(value);
  if (!parsedDate) return "";

  const locale = options?.locale ?? "vi";
  const dateStyle = options?.dateStyle ?? "medium";

  return new Intl.DateTimeFormat(APP_LOCALE_TO_INTL[locale], {
    dateStyle,
  }).format(parsedDate);
}

export function formatDateRangeLabel(
  value: DateRangeValue,
  options?: {
    locale?: AppLocale;
    dateStyle?: "short" | "medium" | "long";
    separator?: string;
  }
): string {
  const startLabel = formatDateLabel(value.startDate, {
    locale: options?.locale,
    dateStyle: options?.dateStyle,
  });
  const endLabel = formatDateLabel(value.endDate, {
    locale: options?.locale,
    dateStyle: options?.dateStyle,
  });

  if (!startLabel || !endLabel) return "";
  return `${startLabel}${options?.separator ?? " - "}${endLabel}`;
}
