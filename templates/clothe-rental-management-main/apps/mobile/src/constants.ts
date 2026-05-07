import type { ThemeVariant } from "@/types/themeVariant";
import { SupportedCurrency } from "@/types/SupportedCurrency";
import { Language, LANGUAGE_OPTIONS } from "./lib/constants/i18n";

export const SUPPORTED_LANGUAGES: Language[] = LANGUAGE_OPTIONS.map((option) => option.value);
export const SUPPORTED_LANGUAGE_SET = new Set(SUPPORTED_LANGUAGES);

export const SUPPORTED_THEME_VARIANTS: ThemeVariant[] = [
  "sunset",
  "cosmic",
  "ocean",
  "forest",
  "rose",
  "midnight",
];

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["VND", "USD", "CNY", "KRW", "JPY", "INR"];
export const SUPPORTED_CURRENCY_SET = new Set(SUPPORTED_CURRENCIES);

// AI voice / trial
export const DEFAULT_AI_FREE_TRIAL_REQUESTS = 50;
