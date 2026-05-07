import type { AppLocale } from "@/constants/locale";
import en from "@/lib/languages/en.json";
import vi from "@/lib/languages/vi.json";

type TranslateParams = Record<string, string | number>;
type RouteMessages = Record<AppLocale, Record<string, string>>;
type Translator = (key: string, params?: TranslateParams) => string;

const ROUTE_MESSAGES: RouteMessages = {
  vi,
  en,
};

function applyParams(template: string, params?: TranslateParams): string {
  if (!params) return template;

  return Object.entries(params).reduce((output, [key, value]) => {
    return output.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }, template);
}

export function translateWithLocale(
  locale: AppLocale,
  key: string,
  params?: TranslateParams
): string {
  const message =
    ROUTE_MESSAGES[locale][key] ??
    ROUTE_MESSAGES.en[key] ??
    key;

  return applyParams(message, params);
}

export function createLocaleTranslator(locale: AppLocale): Translator {
  return (key, params) => translateWithLocale(locale, key, params);
}
