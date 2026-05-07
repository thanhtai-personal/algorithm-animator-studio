import { Language } from "@/lib/constants/i18n";

export const languageFlags: Record<Language, string> = {
  en: "🇺🇸",
  vi: "🇻🇳",
  zh: "🇨🇳",
  ko: "🇰🇷",
  ja: "🇯🇵",
  hi: "🇮🇳",
};

export type ThemeChoice = "light" | "dark";

export type OnboardingCopy = {
  title: string;
  subtitle: string;
  continue: string;
  themeTitle: string;
  themeSubtitle: string;
  lightMode: string;
  darkMode: string;
  currencyTitle: string;
  currencySubtitle: string;
  currencySaving: string;
  complete: string;
  currencyWarning: string;
};
