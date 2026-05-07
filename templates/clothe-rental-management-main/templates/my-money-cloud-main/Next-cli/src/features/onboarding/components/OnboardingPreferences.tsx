"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { useI18n } from "@/lib/i18n";
import { authStore } from "@/store/authStore";
import { Language, LANGUAGE_OPTIONS } from "@/lib/constants/i18n";
import { observer } from "mobx-react-lite";

interface OnboardingPreferencesProps {
  onComplete: () => void;
}

function OnboardingPreferencesContent({ onComplete }: OnboardingPreferencesProps) {
  const { t, language, setLanguage } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [skipLanguage, setSkipLanguage] = useState(Boolean(authStore.userSettings?.language));
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">(
    resolvedTheme === "dark" ? "dark" : "light"
  );


  const handleContinue = () => {
    setLanguage(selectedLanguage);
    setTheme(selectedTheme);
      authStore.updateUser({
        user_id: authStore.userSettings?.user_id,
        currency: authStore.userSettings?.currency ?? null,
        theme_variant: authStore.userSettings?.theme_variant ?? null,
        background_type: authStore.userSettings?.background_type ?? "default",
        background_value: authStore.userSettings?.background_value ?? null,
        ai_trial_used: authStore.userSettings?.ai_trial_used ?? false,
        ai_requests_remaining: authStore.userSettings?.ai_requests_remaining ?? 0,
        ignore_voice_verify: authStore.userSettings?.ignore_voice_verify ?? false,
        use_ai: authStore.userSettings?.use_ai ?? true,
        pro_mode: true,
        language: selectedLanguage,
        theme_mode: selectedTheme,
        theme: selectedTheme,
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg card-2d">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">{t("onboarding.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!skipLanguage ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">{t("onboarding.languageLabel")}</p>
              <div className="grid grid-cols-3 gap-3">
                {LANGUAGE_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedLanguage(item.value)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      selectedLanguage === item.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40"
                    )}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-sm font-semibold">{t("onboarding.themeLabel")}</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "light", label: t("onboarding.themeLight") },
                { value: "dark", label: t("onboarding.themeDark") },
              ] as const).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedTheme(item.value)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    selectedTheme === item.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/40"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleContinue}>
            {t("onboarding.continue")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export const OnboardingPreferences = observer(function OnboardingPreferences(props: OnboardingPreferencesProps) {
  return <OnboardingPreferencesContent {...props} />;
})
