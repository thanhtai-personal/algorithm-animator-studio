"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { reaction } from "mobx";
import type { Locale } from "date-fns";
import { enUS, vi, ja, zhCN, ko, hi } from "date-fns/locale";
import storageAdapter from "@/lib/storageAdapter";
import * as Lang from "./languages";
import { SupportedCurrency } from "@/types/SupportedCurrency";
import { SUPPORTED_LANGUAGES } from "@/constants";
import { AUDIO_LANGUAGE_MAP, CURRENCY_MAP, Language, LANGUAGE_SELECTED_KEY, LOCALE_CODE_MAP, STORAGE_KEY } from "./constants/i18n";
import { authStore } from "@/store/authStore";
import { normalizeCurrency } from "@/lib/currency";

type TranslateParams = Record<string, string | number>;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslateParams) => string;
  locale: Locale;
  localeCode: string;
  currency: string;
  audioLanguage: string;
  needsOnboarding: boolean;
  userCurrency: SupportedCurrency | null;
  setUserCurrency: (currency: SupportedCurrency | null) => void;
  setNeedsOnboarding: (needs: boolean) => void;
  currencyLoading: boolean;
  setCurrencyLoading: (loading: boolean) => void;
}

const LOCALE_MAP: Record<Language, Locale> = {
  en: enUS,
  vi,
  ko,
  zh: zhCN,
  ja,
  hi,
};

const translations: Record<Language, Record<string, string>> = Lang;

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolveTranslation(key: string, dictionary: Record<string, string>): string | undefined {
  return dictionary[key];
}

function applyParams(text: string, params?: TranslateParams): string {
  if (!params) return text;
  return Object.entries(params).reduce(
    (acc, [paramKey, paramValue]) =>
      acc.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue)),
    text
  );
}

function normalizeLanguage(value?: string | null): Language | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("vi")) return "vi";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("zh")) return "zh";
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("hi")) return "hi";
  if (SUPPORTED_LANGUAGES.includes(normalized as Language)) {
    return normalized as Language;
  }
  return null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [userCurrency, setUserCurrency] = useState<SupportedCurrency | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [currencyLoading, setCurrencyLoading] = useState(true);
  
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = storageAdapter.getItem(STORAGE_KEY);
    const storedLanguage = normalizeLanguage(stored);
    if (storedLanguage) return storedLanguage;
    return "en";
  });

  useEffect(() => {
    storageAdapter.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const dispose = reaction(
      () => authStore.userSettings?.currency ?? null,
      (nextCurrency) => {
        setUserCurrency(normalizeCurrency(nextCurrency));
      },
      { fireImmediately: true }
    );
    return () => dispose();
  }, []);

  useEffect(() => {
    const dispose = reaction(
      () => authStore.userSettings?.language ?? null,
      (nextLanguage) => {
        const normalized = normalizeLanguage(nextLanguage);
        if (normalized && normalized !== language) {
          setLanguageState(normalized);
          storageAdapter.setItem(STORAGE_KEY, normalized);
        }
      },
      { fireImmediately: true }
    );
    return () => dispose();
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    storageAdapter.setItem(LANGUAGE_SELECTED_KEY, "true");
  }, []);

  const t = useCallback(
    (key: string, params?: TranslateParams) => {
      const value =
        resolveTranslation(key, translations[language]) ??
        resolveTranslation(key, translations.en) ??
        key;
      return applyParams(value, params);
    },
    [language]
  );

  const locale = useMemo(() => LOCALE_MAP[language] ?? enUS, [language]);
  const localeCode = useMemo(() => LOCALE_CODE_MAP[language] ?? "en-US", [language]);
  
  // Use user's selected currency if available, otherwise fallback to language-based currency
  const currency = useMemo(() => userCurrency || CURRENCY_MAP[language] || "USD", [userCurrency, language]);
  
  const audioLanguage = useMemo(() => AUDIO_LANGUAGE_MAP[language] ?? "en-US", [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      locale,
      localeCode,
      currency,
      audioLanguage,
      needsOnboarding,
      userCurrency,
      setUserCurrency,
      setNeedsOnboarding,
      currencyLoading,
      setCurrencyLoading,
    }),
    [language, setLanguage, t, locale, localeCode, currency, audioLanguage, needsOnboarding, userCurrency, currencyLoading]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
