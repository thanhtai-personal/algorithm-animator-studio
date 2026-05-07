import type { AppLocale } from "@/constants/locale";
import type { OrderIncidentStatus, OrderIncidentType } from "@/types/ordersDomain";

export const INCIDENT_TYPE_ORDER: OrderIncidentType[] = ["LATE", "DAMAGE", "LOST", "CLEANING"];
export const INCIDENT_STATUS_ORDER: OrderIncidentStatus[] = ["OPEN", "SETTLED", "WAIVED"];
export const INCIDENTS_TABLE_PAGE_SIZE = 15;

export function formatIncidentCurrency(
  value: number,
  currencyCode: string,
  locale: AppLocale
): string {
  const formatLocale =
    currencyCode.toUpperCase() === "VND" ? "vi-VN" : locale === "vi" ? "vi-VN" : "en-US";
  try {
    return new Intl.NumberFormat(formatLocale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return new Intl.NumberFormat(formatLocale, {
      maximumFractionDigits: 0,
    }).format(value);
  }
}

export function formatIncidentDateTime(value: string, locale: AppLocale): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function getIncidentStatusClassName(status: string): string {
  if (status === "SETTLED") return "bg-success/15 text-success";
  if (status === "WAIVED") return "bg-muted text-muted-foreground";
  return "bg-warning/15 text-warning";
}
