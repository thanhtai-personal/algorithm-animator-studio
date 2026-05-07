import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  SUPPORTED_ROUTE_LOCALES,
  type AppLocale,
} from "@/constants/locale";
import { localizePathname, stripLocaleFromPathname } from "@/utils/locale";

export function buildLocalizedAlternates(
  canonicalPathname: string,
  currentLocale: AppLocale
): Metadata["alternates"] {
  const pathWithoutLocale = stripLocaleFromPathname(canonicalPathname);
  const languages = Object.fromEntries(
    SUPPORTED_ROUTE_LOCALES.map((locale) => [
      locale,
      localizePathname(pathWithoutLocale, locale),
    ])
  );

  return {
    canonical: localizePathname(pathWithoutLocale, currentLocale),
    languages: {
      ...languages,
      "x-default": localizePathname(pathWithoutLocale, DEFAULT_LOCALE),
    },
  };
}
