import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutAnimation, Platform, UIManager } from "react-native";
import { useRouter, useNavigationContainerRef } from "expo-router";

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
  const navigationRef = useNavigationContainerRef();
  const isNavReady = Boolean(navigationRef?.current?.isReady?.());
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
  const languageAppliedRef = useRef(false);

  const userSettings = authStore.userSettings;
  const userId = authStore.userId;
  const anonId = authStore.anonId;

  useEffect(() => {
    if (!isNavReady) return;
    if (userSettings?.currency) {
      router.replace("/(tabs)");
    }
  }, [isNavReady, userSettings?.currency, router]);

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  useEffect(() => {
    if (userSettings?.currency) {
      setSelectedCurrency(userSettings.currency as SupportedCurrency);
    } else {
      setSelectedCurrency(languageCurrencyMap[selectedLanguage]);
    }
  }, [userSettings?.currency, selectedLanguage]);

  useEffect(() => {
    if (languageAppliedRef.current || selectedLanguage !== language) {
      setLanguage(selectedLanguage);
      languageAppliedRef.current = true;
    }
  }, [selectedLanguage, language, setLanguage]);

  useEffect(() => {
    authStore.upsert({ theme_mode: selectedTheme });
  }, [selectedTheme]);

  useEffect(() => {
    authStore.upsert({ theme_variant: selectedThemeVariant });
  }, [selectedThemeVariant]);

  const animateStep = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  const toggleStep = (target: OnboardingStep) => {
    if (target <= step) {
      animateStep();
      setExpandedStep(target);
    }
  };

  const handleLanguageConfirm = () => {
    animateStep();
    setLanguage(selectedLanguage);
    setExpandedStep(2);
    setStep(2);
  };

  const handleThemeConfirm = () => {
    animateStep();
    setExpandedStep(3);
    setStep(3);
  };

  const handlePaletteConfirm = () => {
    animateStep();
    setExpandedStep(4);
    setStep(4);
  };

  const translateCategory = useMemo(() => {
    const translations = Lang as Record<Language, Record<string, string>>;
    const fallback = translations.en;
    const dictionary = translations[selectedLanguage] ?? fallback;
    return (key: string) => dictionary[key] ?? fallback[key] ?? key;
  }, [selectedLanguage]);

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

  const updateSettings = useCallback(
    async (settings: Partial<UserSettings>) => {
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
    },
    [isAnonymous, isOnline]
  );

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
      toast.success(t("onboarding.currencySaved") ?? "Đã lưu thiết lập");
      if (isNavReady) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      toast.error(t("onboarding.currencyError") ?? "Lỗi lưu thiết lập");
    } finally {
      setSaving(false);
    }
  };

  const getLanguageLabel = useMemo(
    () => (lang: Language) => {
      const option = LANGUAGE_OPTIONS.find((opt) => opt.value === lang);
      return option ? t(option.labelKey) : lang;
    },
    [t]
  );

  const getCurrencyLabel = useMemo(
    () => (curr: SupportedCurrency) => {
      const option = currencyOptions.find((opt) => opt.code === curr);
      return option ? `${option.code} ${option.symbol}` : curr;
    },
    []
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
