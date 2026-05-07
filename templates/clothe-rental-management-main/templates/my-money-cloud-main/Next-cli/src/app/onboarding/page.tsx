"use client";

import { observer } from "mobx-react-lite";
import { CurrencyStep } from "@/features/onboarding/components/CurrencyStep";
import { LanguageStep } from "@/features/onboarding/components/LanguageStep";
import { PaletteStep } from "@/features/onboarding/components/PaletteStep";
import { ThemeStep } from "@/features/onboarding/components/ThemeStep";
import { useOnboardingFlow } from "@/features/onboarding/hooks/useOnboarding";
import type { ThemeChoice } from "@/features/onboarding/constants";
import { AccountSwitchPrompt } from "@/features/auth/components/AccountSwitchPrompt";
import { THEME_VARIANTS } from "@/constants/themeVariant";

const OnboardingPageContent = observer(function OnboardingPageContent() {
  const {
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
  } = useOnboardingFlow();

  const themeLabels: Record<ThemeChoice, string> = {
    light: t("onboarding.lightMode") || "Light",
    dark: t("onboarding.darkMode") || "Dark",
  };
  const paletteOptions = THEME_VARIANTS.map((variant) => ({
    id: variant.id,
    label: t(variant.labelKey) || variant.id,
    description: t(variant.descriptionKey) || "",
    preview: variant.preview,
  }));

  return (
    <>
      <AccountSwitchPrompt />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <div className="w-full max-w-2xl space-y-4">
          <LanguageStep
            step={step}
            expandedStep={expandedStep}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onConfirm={handleLanguageConfirm}
            toggleStep={toggleStep}
            getLanguageLabel={getLanguageLabel}
            title={t("onboarding.title")}
            subtitle={t("onboarding.subtitle")}
            continueLabel={t("common.continue")}
          />

          <ThemeStep
            step={step}
            expandedStep={expandedStep}
            selectedTheme={selectedTheme}
            onSelectTheme={setSelectedTheme}
            onConfirm={handleThemeConfirm}
            toggleStep={toggleStep}
            title={t("onboarding.themeTitle") || "Theme"}
            subtitle={t("onboarding.themeSubtitle") || "Select your preferred appearance"}
            lightLabel={themeLabels.light}
            darkLabel={themeLabels.dark}
            continueLabel={t("common.continue")}
          />

          <PaletteStep
            step={step}
            expandedStep={expandedStep}
            selectedVariant={selectedThemeVariant}
            options={paletteOptions}
            onSelectVariant={setSelectedThemeVariant}
            onConfirm={handlePaletteConfirm}
            toggleStep={toggleStep}
            title={t("profile.themeStyle") || "Theme style"}
            subtitle={t("profile.themeStyleHint") || "Choose a color palette for the app"}
            continueLabel={t("common.continue")}
          />

          <CurrencyStep
            step={step}
            expandedStep={expandedStep}
            selectedCurrency={selectedCurrency}
            onSelectCurrency={setSelectedCurrency}
            onConfirm={handleCurrencyConfirm}
            saving={saving}
            title={t("onboarding.currencyTitle")}
            subtitle={t("onboarding.currencySubtitle")}
            savingLabel={t("onboarding.currencySaving") || "Saving..."}
            completeLabel={t("common.complete") || "Complete"}
            warning={t("onboarding.currencyWarning")}
          />
        </div>
      </div>
    </>
  );
});

export default OnboardingPageContent;
