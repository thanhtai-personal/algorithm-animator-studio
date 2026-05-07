import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils";
import type { ThemeVariant } from "@/types/themeVariant";

import type { OnboardingStep } from "../hooks/useOnboarding";

type PalettePreview = {
  primary: string;
  secondary: string;
  accent: string;
  nav: string;
};

export type PaletteOption = {
  id: ThemeVariant;
  label: string;
  description: string;
  preview: PalettePreview;
};

type PaletteStepProps = {
  step: OnboardingStep;
  expandedStep: OnboardingStep;
  selectedVariant: ThemeVariant;
  options: PaletteOption[];
  onSelectVariant: (variant: ThemeVariant) => void;
  onConfirm: () => void;
  toggleStep: (step: OnboardingStep) => void;
  title: string;
  subtitle: string;
  continueLabel: string;
};

export function PaletteStep({
  step,
  expandedStep,
  selectedVariant,
  options,
  onSelectVariant,
  onConfirm,
  toggleStep,
  title,
  subtitle,
  continueLabel,
}: PaletteStepProps) {
  const selectedOption = options.find((option) => option.id === selectedVariant);

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-in-out origin-top overflow-hidden px-2",
        step >= 3 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 h-0",
        step > 3 && expandedStep !== 3 && "-translate-y-2",
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          step > 3 && expandedStep !== 3 ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {step > 3 && expandedStep !== 3 && selectedOption ? (
          <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => toggleStep(3)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">{title}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{selectedOption.label}</span>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out origin-top",
          expandedStep === 3 ? "max-h-[2000px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0",
        )}
      >
        {expandedStep === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>

            <div className="grid gap-3 grid-cols-2">
              {options.map((option) => {
                const isSelected = option.id === selectedVariant;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectVariant(option.id)}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition",
                      isSelected ? "border-primary shadow-glow" : "border-border/60 hover:border-primary/60"
                    )}
                  >
                    <div className="mb-3 rounded-xl border border-border/40 bg-card/70 p-2">
                      <div className="h-2 w-2/3 rounded-full" style={{ background: option.preview.primary }} />
                      <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: option.preview.secondary }} />
                      <div className="mt-2 h-2 w-2 rounded-full" style={{ background: option.preview.accent }} />
                      <div className="mt-2 h-2 w-full rounded-full" style={{ background: option.preview.nav }} />
                    </div>
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                    {isSelected ? (
                      <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={onConfirm} className="min-w-[200px] rounded-md sm:rounded-lg">
                {continueLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
