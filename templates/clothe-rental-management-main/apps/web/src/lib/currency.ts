import { SUPPORTED_CURRENCY_SET } from "../constants";
import { SupportedCurrency } from "@/types/SupportedCurrency";
import { Language } from "./constants/i18n";

export function formatCurrency(
  amount: number,
  currency: string = 'VND',
  locale: string = 'vi-VN'
): string {
  const resolvedLocale = currency.toUpperCase() === "VND" ? "vi-VN" : locale;
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrencySymbol(currency: string, locale: string = "en-US"): string {
  if (typeof Intl === "undefined" || typeof Intl.NumberFormat !== "function") {
    return currency;
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const parts = formatter.formatToParts ? formatter.formatToParts(0) : [];
    const symbol = parts.find((part) => part.type === "currency")?.value;
    return symbol || currency;
  } catch {
    return currency;
  }
}

export function formatCompactNumber(amount: number, language: Language = "en"): string {
  const units = language === "vi"
    ? { billion: "tỷ", million: "tr", thousand: "k" }
    : { billion: "B", million: "M", thousand: "K" };
  const separator = language === "vi" ? " " : "";

  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1).replace(/\.0$/, '') + separator + units.billion;
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + separator + units.million;
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1).replace(/\.0$/, '') + separator + units.thousand;
  }
  return amount.toString();
}

export function parseCurrencyInput(input: string): number {
  // Remove all non-digit characters except decimal point
  const cleaned = input.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

export function normalizeCurrency(
  value?: string | null,
  allowed: Iterable<SupportedCurrency> = SUPPORTED_CURRENCY_SET,
): SupportedCurrency | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  const set = allowed instanceof Set ? allowed : new Set(allowed);
  return set.has(upper as SupportedCurrency) ? (upper as SupportedCurrency) : null;
}
