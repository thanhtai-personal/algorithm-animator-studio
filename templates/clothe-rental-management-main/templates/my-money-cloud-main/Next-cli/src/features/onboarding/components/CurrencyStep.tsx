import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils";
import { currencyOptions, SupportedCurrency } from "@/lib/constants/currency";

import type { OnboardingStep } from "../hooks/useOnboarding";

type CurrencyStepProps = {
  step: OnboardingStep;
  expandedStep: OnboardingStep;
  selectedCurrency: SupportedCurrency;
  onSelectCurrency: (currency: SupportedCurrency) => void;
  onConfirm: () => void;
  saving: boolean;
  title: string;
  subtitle: string;
  savingLabel: string;
  completeLabel: string;
  warning: string;
};

export function CurrencyStep({
  step,
  expandedStep,
  selectedCurrency,
  onSelectCurrency,
  onConfirm,
  saving,
  title,
  subtitle,
  savingLabel,
  completeLabel,
  warning,
}: CurrencyStepProps) {
  return (
    <div
      className={cn(
        "transition-all duration-500 ease-in-out origin-top overflow-hidden",
        step >= 4 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 h-0",
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-in-out origin-top",
          expandedStep === 4 ? "max-h-[1000px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0",
        )}
      >
        {expandedStep === 4 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-1 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {currencyOptions.map((option) => (
                <Card
                  key={option.code}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedCurrency === option.code && "ring-2 ring-primary",
                  )}
                  onClick={() => onSelectCurrency(option.code)}
                >
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl sm:text-3xl flex-shrink-0">{option.flag}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs sm:text-base truncate">
                            {option.code} {option.symbol}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground truncate">{option.name}</div>
                        </div>
                      </div>
                      {selectedCurrency === option.code && <Check className="w-4 h-4 sm:w-6 sm:h-6 text-primary flex-shrink-0" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button
                size="sm"
                onClick={onConfirm}
                disabled={!selectedCurrency || saving}
                className="min-w-[160px] sm:min-w-[200px] rounded-md sm:rounded-lg"
              >
                {saving ? savingLabel : completeLabel}
              </Button>
            </div>

            <p className="text-center text-xs sm:text-sm text-muted-foreground">{warning}</p>
          </div>
        )}
      </div>
    </div>
  );
}
