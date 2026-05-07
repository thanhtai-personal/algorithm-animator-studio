import type { AppLocale } from "@/constants/locale";
import type { TemplateLang } from "@/features/product-landing/components/templates/three-d/productLandingTemplate3D.config";
import type { LocalizedText } from "./types";

export function parseObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function readString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function readNullableString(value: unknown, fallback: string | null = null): string | null {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function readNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const output = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return output.length > 0 ? output : fallback;
}

export function localized(vi: string, en: string): LocalizedText {
  return { vi, en };
}

export function readLocalizedText(value: unknown, fallback: LocalizedText): LocalizedText {
  const map = parseObject(value);
  return {
    vi: readString(map.vi, fallback.vi),
    en: readString(map.en, fallback.en),
  };
}

export function readLocalizedStringArray(
  value: unknown,
  fallback: Record<TemplateLang, string[]>
): Record<TemplateLang, string[]> {
  const map = parseObject(value);
  return {
    vi: readStringArray(map.vi, fallback.vi),
    en: readStringArray(map.en, fallback.en),
  };
}

export function resolveLocalizedText(value: LocalizedText, lang: TemplateLang): string {
  const primary = readString(value[lang], "");
  if (primary) return primary;
  return readString(value[lang === "vi" ? "en" : "vi"], "");
}

export function formatVndCurrency(value: number, locale: AppLocale): string {
  void locale;
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}
