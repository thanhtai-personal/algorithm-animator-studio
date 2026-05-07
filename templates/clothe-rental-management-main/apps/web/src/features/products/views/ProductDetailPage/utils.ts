import type { AppLocale } from "@/constants/locale";

export const PRODUCT_ITEMS_PAGE_SIZE = 10;
export const PRODUCT_ACTIVITY_PAGE_SIZE = 10;

export function formatProductActivityDateTime(value: string, locale: AppLocale): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function renderProductActivityAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
