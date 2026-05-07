export const SUPPORTED_LANGUAGES = ["en", "vi", "ko", "zh", "ja", "hi"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_OPTIONS: Array<{ value: Language; labelKey: string }> = [
  { value: "en", labelKey: "onboarding.languageEn" },
  { value: "vi", labelKey: "onboarding.languageVi" },
  { value: "ko", labelKey: "onboarding.languageKo" },
  { value: "zh", labelKey: "onboarding.languageZh" },
  { value: "ja", labelKey: "onboarding.languageJa" },
  { value: "hi", labelKey: "onboarding.languageHi" },
];

export const STORAGE_KEY = "spendsmart:lang";
export const LANGUAGE_SELECTED_KEY = "spendsmart:langSelected";

export const LOCALE_CODE_MAP: Record<Language, string> = {
  en: "en-US",
  vi: "vi-VN",
  ko: "ko-KR",
  zh: "zh-CN",
  ja: "ja-JP",
  hi: "hi-IN",
};

export const CURRENCY_MAP: Record<Language, string> = {
  en: "USD",
  vi: "VND",
  ko: "KRW",
  zh: "CNY",
  ja: "JPY",
  hi: "INR",
};

export const AUDIO_LANGUAGE_MAP: Record<Language, string> = {
  en: "en-US",
  vi: "vi-VN",
  ko: "ko-KR",
  zh: "zh-CN",
  ja: "ja-JP",
  hi: "hi-IN",
};