import type { AppLocale } from "@/constants/locale";
import type { SupportedCurrency } from "@/types/SupportedCurrency";

const APP_LOCALE_TO_INTL: Record<AppLocale, string> = {
  vi: "vi-VN",
  en: "en-US",
};

const DEFAULT_CURRENCY: SupportedCurrency = "VND";
const VND_CURRENCY_CODE = "VND";

function resolveMoneyIntlLocale(
  locale: AppLocale,
  currency: SupportedCurrency = DEFAULT_CURRENCY
): string {
  if (currency === VND_CURRENCY_CODE) {
    return "vi-VN";
  }
  return APP_LOCALE_TO_INTL[locale];
}

function normalizeNumericInput(raw: string): { normalized: string; isNegative: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { normalized: "", isNegative: false };

  const isNegative = /^\s*-/.test(trimmed);
  const cleaned = trimmed.replace(/[^0-9.,]/g, "");
  if (!cleaned) return { normalized: "", isNegative };

  const lastDotIndex = cleaned.lastIndexOf(".");
  const lastCommaIndex = cleaned.lastIndexOf(",");
  const decimalIndex = Math.max(lastDotIndex, lastCommaIndex);

  if (decimalIndex < 0) {
    return {
      normalized: cleaned.replace(/[.,]/g, ""),
      isNegative,
    };
  }

  let normalized = "";
  for (let index = 0; index < cleaned.length; index += 1) {
    const char = cleaned[index] ?? "";
    if (/\d/.test(char)) {
      normalized += char;
      continue;
    }

    if ((char === "." || char === ",") && index === decimalIndex) {
      normalized += ".";
    }
  }

  return {
    normalized,
    isNegative,
  };
}

export interface ParsedMoneyResult {
  value: number | null;
  normalizedInput: string;
  error: "invalid-number" | "negative-not-allowed" | null;
}

export function parseNonNegativeMoney(rawInput: string): ParsedMoneyResult {
  const { normalized, isNegative } = normalizeNumericInput(rawInput);

  if (!normalized) {
    return {
      value: null,
      normalizedInput: "",
      error: null,
    };
  }

  if (isNegative) {
    return {
      value: null,
      normalizedInput: normalized,
      error: "negative-not-allowed",
    };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return {
      value: null,
      normalizedInput: normalized,
      error: "invalid-number",
    };
  }

  return {
    value: parsed,
    normalizedInput: normalized,
    error: null,
  };
}

export function formatMoney(
  value: number | null | undefined,
  options?: {
    locale?: AppLocale;
    currency?: SupportedCurrency;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }

  const locale = options?.locale ?? "vi";
  const currency = options?.currency ?? DEFAULT_CURRENCY;

  return new Intl.NumberFormat(resolveMoneyIntlLocale(locale, currency), {
    style: "currency",
    currency,
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
  }).format(value);
}

export function formatMoneyInputValue(
  value: number | null | undefined,
  options?: {
    locale?: AppLocale;
    currency?: SupportedCurrency;
    maximumFractionDigits?: number;
  }
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }

  const locale = options?.locale ?? "vi";
  const currency = options?.currency ?? DEFAULT_CURRENCY;

  return new Intl.NumberFormat(resolveMoneyIntlLocale(locale, currency), {
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
}
