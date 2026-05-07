import {
  DEFAULT_LOCALE,
  type AppLocale,
  SUPPORTED_ROUTE_LOCALE_SET,
} from "@/constants/locale";

function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  const trimmed = pathname.trim();
  if (!trimmed) return "/";

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const normalized = withLeadingSlash.replace(/\/+$/, "");
  return normalized || "/";
}

export function normalizeAppLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (SUPPORTED_ROUTE_LOCALE_SET.has(normalized as AppLocale)) {
    return normalized as AppLocale;
  }
  return null;
}

export function resolveAppLocale(value: string | null | undefined): AppLocale {
  return normalizeAppLocale(value) ?? DEFAULT_LOCALE;
}

export function extractLocaleFromPathname(pathname: string | null | undefined): AppLocale | null {
  const normalizedPathname = normalizePathname(pathname);
  const segment = normalizedPathname.split("/").filter(Boolean)[0] ?? null;
  return normalizeAppLocale(segment);
}

export function stripLocaleFromPathname(pathname: string | null | undefined): string {
  const normalizedPathname = normalizePathname(pathname);
  const segments = normalizedPathname.split("/").filter(Boolean);

  if (segments.length === 0) return "/";
  if (!normalizeAppLocale(segments[0])) return normalizedPathname;

  const localizedPathname = `/${segments.slice(1).join("/")}`;
  return localizedPathname === "/" ? "/" : localizedPathname.replace(/\/+$/, "") || "/";
}

export function localizePathname(pathname: string | null | undefined, locale: AppLocale): string {
  const pathWithoutLocale = stripLocaleFromPathname(pathname);
  if (pathWithoutLocale === "/") return `/${locale}`;
  return `/${locale}${pathWithoutLocale}`;
}
