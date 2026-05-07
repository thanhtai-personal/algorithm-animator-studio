import { Check, ChevronDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { LANGUAGE_OPTIONS, Language } from "@/lib/constants/i18n";

import { languageFlags } from "../constants";
import type { OnboardingStep } from "../hooks/useOnboarding";

type LanguageStepProps = {
  step: OnboardingStep;
  expandedStep: OnboardingStep;
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onConfirm: () => void;
  toggleStep: (step: OnboardingStep) => void;
  getLanguageLabel: (lang: Language) => string;
  title: string;
  subtitle: string;
  continueLabel: string;
};

export function LanguageStep({
  step,
  expandedStep,
  selectedLanguage,
  onSelectLanguage,
  onConfirm,
  toggleStep,
  getLanguageLabel,
  title,
  subtitle,
  continueLabel,
}: LanguageStepProps) {
  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        step >= 1 && "translate-y-0 opacity-100",
        step > 1 && expandedStep !== 1 && "-translate-y-2",
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          step > 1 && expandedStep !== 1 ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {step > 1 && expandedStep !== 1 && (
          <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => toggleStep(1)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">{title}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {languageFlags[selectedLanguage]} {getLanguageLabel(selectedLanguage)}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out origin-top",
          expandedStep === 1 ? "max-h-[800px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0",
        )}
      >
        {expandedStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-1 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4">
              {LANGUAGE_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedLanguage === option.value && "ring-2 ring-primary",
                  )}
                  onClick={() => onSelectLanguage(option.value)}
                >
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl sm:text-3xl flex-shrink-0">{languageFlags[option.value]}</span>
                        <div className="font-semibold text-xs sm:text-base truncate">{getLanguageLabel(option.value)}</div>
                      </div>
                      {selectedLanguage === option.value && <Check className="w-4 h-4 sm:w-6 sm:h-6 text-primary flex-shrink-0" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button size="sm" onClick={onConfirm} className="min-w-[160px] sm:min-w-[200px] rounded-md sm:rounded-lg">
                {continueLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
