
import { SUPPORTED_LANGUAGE_SET } from "../../constants";
import { Language } from "../constants/i18n";

export function normalizeLanguage(value?: string | null, allowed: Set<Language> = SUPPORTED_LANGUAGE_SET): Language | null {
  if (!value) return null;
  return allowed.has(value as Language) ? (value as Language) : null;
}