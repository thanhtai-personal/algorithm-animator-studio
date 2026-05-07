export const SUPPORTED_ROUTE_LOCALES = ["vi", "en"] as const;
export type AppLocale = (typeof SUPPORTED_ROUTE_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "vi";
export const LOCALE_COOKIE_NAME = "locale";

export const SUPPORTED_ROUTE_LOCALE_SET = new Set<AppLocale>(SUPPORTED_ROUTE_LOCALES);
