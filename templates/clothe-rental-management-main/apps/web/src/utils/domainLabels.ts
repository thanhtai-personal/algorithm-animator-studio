import type { AppLocale } from "@/constants/locale";
import { createLocaleTranslator } from "@/utils/i18nMessages";

export function buildDomainLabels<DomainValue extends string>(
  locale: AppLocale,
  keyByValue: Record<DomainValue, string>
): Record<DomainValue, string> {
  const t = createLocaleTranslator(locale);
  const labels = {} as Record<DomainValue, string>;

  for (const value of Object.keys(keyByValue) as DomainValue[]) {
    labels[value] = t(keyByValue[value]);
  }

  return labels;
}

export function formatDomainLabelFallback(
  value: string | null | undefined,
  locale: AppLocale
): string {
  if (!value) return locale === "vi" ? "Không xác định" : "Unknown";

  const normalized = value.trim();
  if (!normalized) return locale === "vi" ? "Không xác định" : "Unknown";

  return normalized
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
