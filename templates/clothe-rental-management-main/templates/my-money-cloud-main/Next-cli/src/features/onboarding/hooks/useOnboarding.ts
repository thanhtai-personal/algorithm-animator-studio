"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";
import { LANGUAGE_OPTIONS, Language } from "@/lib/constants/i18n";
import { useI18n } from "@/lib/i18n";
import { SupportedCurrency, currencyOptions } from "@/lib/constants/currency";
import { buildDefaultCategoryInputs } from "@/features/categories/utils/defaultCategories";
import { useCreateCategoryMutation } from "@/features/categories/queries/useCreateCategoryMutation";
import { categoryStore } from "@/store/categoryStore";
import { authStore } from "@/store/authStore";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { UserSettings } from "@/types/userSettings";
import { DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";
import { isThemeVariant } from "@/utils/themeVariant";
import type { ThemeVariant } from "@/types/themeVariant";
import * as Lang from "@/lib/languages";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { updateUserSettings } from "@/features/app-shell/services/user";

export type OnboardingStep = 1 | 2 | 3 | 4;

const languageCurrencyMap: Record<Language, SupportedCurrency> = {
  en: "USD",
  vi: "VND",
  zh: "CNY",
  ko: "KRW",
  ja: "JPY",
  hi: "INR",
};

export function useOnboardingFlow() {
  const router = useRouter();
  const { toast } = useToast();
  const { language, setLanguage, t } = useI18n();
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();
  const createCategoryService = useCreateCategoryMutation();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [expandedStep, setExpandedStep] = useState<OnboardingStep>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(() => languageCurrencyMap[language]);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light");
  const [selectedThemeVariant, setSelectedThemeVariant] = useState<ThemeVariant>(() => {
    const stored = authStore.userSettings?.theme_variant;
    return isThemeVariant(stored) ? stored : DEFAULT_THEME_VARIANT;
  });
  const [saving, setSaving] = useState(false);

  // Lấy userSettings từ MobX store
  const userSettings = authStore.userSettings;
  const userId = authStore.userId;
  const anonId = authStore.anonId;

  useEffect(() => {
    if (userSettings?.currency) {
      router.replace("/home");
    }
  }, [userSettings?.currency, router]);

  useEffect(() => {
    if (userSettings?.currency) {
      setSelectedCurrency(userSettings.currency as SupportedCurrency);
    } else {
      setSelectedCurrency(languageCurrencyMap[selectedLanguage]);
    }
  }, [userSettings?.currency, selectedLanguage]);

  const toggleStep = (target: OnboardingStep) => {
    if (target <= step) {
      setExpandedStep(target);
    }
  };

  const handleLanguageConfirm = () => {
    setLanguage(selectedLanguage);
    setExpandedStep(2);
    setStep(2);
  };

  const handleThemeConfirm = () => {
    setExpandedStep(3);
    setStep(3);
  };

  const handlePaletteConfirm = () => {
    setExpandedStep(4);
    setStep(4);
  };

  const translateCategory = useMemo(() => {
    const translations = Lang as Record<Language, Record<string, string>>;
    const fallback = translations.en;
    const dictionary = translations[selectedLanguage] ?? fallback;
    return (key: string) => dictionary[key] ?? fallback[key] ?? key;
  }, [selectedLanguage]);

  // Refactor tạo default categories theo store mới
  const createDefaultCategories = useCallback(async () => {
    const defaultInputs = buildDefaultCategoryInputs(translateCategory);
    const cacheUserId = userId || anonId;
    if (!cacheUserId) return;
    if (isAnonymous) {
      const createdAt = new Date().toISOString();
      defaultInputs.forEach((input) => {
        if (!input.id) return;
        categoryStore.upsert({
          id: input.id,
          user_id: null,
          anon_key: anonId ?? null,
          name: input.name,
          icon: input.icon ?? null,
          color: input.color ?? null,
          created_at: createdAt,
        });
      });
      return;
    }

    for (const input of defaultInputs) {
      await createCategoryService.mutateAsync(input);
    }
  }, [translateCategory, createCategoryService, isAnonymous, userId, anonId]);

  // Refactor cập nhật settings qua store
  const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
    try {
      if (isAnonymous) {
        authStore.upsert(settings);
        return true;
      }
      if (!isOnline) {
        authStore.upsert(settings);
        offlineQueueStore.enqueue({
          id: Math.random().toString(36).substring(2),
          entity: "settings",
          action: "update",
          payload: { updates: settings },
        });
        return true;
      }
      const updated = await updateUserSettings(settings);
      authStore.upsert(updated);
      return true;
    } catch {
      return false;
    }
  }, [isAnonymous, isOnline]);

  const handleCurrencyConfirm = async () => {
    if (!selectedCurrency) return;
    setSaving(true);
    try {
      const success = await updateSettings({
        currency: selectedCurrency,
        theme_mode: selectedTheme,
        language: selectedLanguage,
        theme_variant: selectedThemeVariant,
      });
      if (!success) {
        throw new Error("Failed to save settings");
      }
      await createDefaultCategories();
      document.documentElement.classList.toggle("dark", selectedTheme === "dark");
      toast(t("onboarding.currencySaved") ?? "Đã lưu thiết lập", {
        description: t("onboarding.currencySavedDesc") ?? "",
      });
      router.replace("/home");
    } catch (error) {
      toast(t("onboarding.currencyError") ?? "Lỗi lưu thiết lập", {
        description: t("onboarding.currencyErrorDesc") ?? "",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", selectedThemeVariant);
  }, [selectedThemeVariant]);

  const getLanguageLabel = useMemo(
    () => (lang: Language) => {
      const option = LANGUAGE_OPTIONS.find((opt) => opt.value === lang);
      return option ? t(option.labelKey) : lang;
    },
    [t],
  );

  const getCurrencyLabel = useMemo(
    () => (curr: SupportedCurrency) => {
      const option = currencyOptions.find((opt) => opt.code === curr);
      return option ? `${option.code} ${option.symbol}` : curr;
    },
    [],
  );

  return {
    t,
    step,
    expandedStep,
    selectedLanguage,
    selectedCurrency,
    selectedTheme,
    selectedThemeVariant,
    saving,
    setSelectedLanguage,
    setSelectedCurrency,
    setSelectedTheme,
    setSelectedThemeVariant,
    handleLanguageConfirm,
    handleThemeConfirm,
    handlePaletteConfirm,
    handleCurrencyConfirm,
    toggleStep,
    getLanguageLabel,
    getCurrencyLabel,
  };
}
