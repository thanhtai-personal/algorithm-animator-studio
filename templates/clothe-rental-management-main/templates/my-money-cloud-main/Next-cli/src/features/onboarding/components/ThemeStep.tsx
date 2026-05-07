import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils";

import type { ThemeChoice } from "../constants";
import type { OnboardingStep } from "../hooks/useOnboarding";

type ThemeStepProps = {
  step: OnboardingStep;
  expandedStep: OnboardingStep;
  selectedTheme: ThemeChoice;
  onSelectTheme: (theme: ThemeChoice) => void;
  onConfirm: () => void;
  toggleStep: (step: OnboardingStep) => void;
  title: string;
  subtitle: string;
  lightLabel: string;
  darkLabel: string;
  continueLabel: string;
};

export function ThemeStep({
  step,
  expandedStep,
  selectedTheme,
  onSelectTheme,
  onConfirm,
  toggleStep,
  title,
  subtitle,
  lightLabel,
  darkLabel,
  continueLabel,
}: ThemeStepProps) {
  return (
    <div
      className={cn(
        "transition-all duration-500 ease-in-out origin-top overflow-hidden px-2",
        step >= 2 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 h-0",
        step > 2 && expandedStep !== 2 && "-translate-y-2",
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          step > 2 && expandedStep !== 2 ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {step > 2 && expandedStep !== 2 && (
          <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => toggleStep(2)}>
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
                      {selectedTheme === "light" ? lightLabel : darkLabel}
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
          expandedStep === 2 ? "max-h-[1000px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0",
        )}
      >
        {expandedStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md overflow-hidden min-w-0 p-1",
                  selectedTheme === "light" && "ring-2 ring-primary",
                )}
                onClick={() => {
                  onSelectTheme("light");
                  document.documentElement.classList.remove("dark");
                }}
              >
                <CardContent className="p-0">
                  <div className="overflow-hidden w-full aspect-[3/4] sm:aspect-[4/3] max-h-44 sm:max-h-60 flex items-center justify-center bg-muted">
                    <Image
                      src="/light.png"
                      alt="Light mode"
                      width={180}
                      height={240}
                      className="h-full w-auto object-contain"
                      priority
                    />
                  </div>
                  <div className="overflow-hidden p-3 sm:p-4 flex items-center justify-between bg-background">
                    <div className="font-semibold text-base sm:text-lg">{lightLabel}</div>
                    {selectedTheme === "light" && <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md overflow-hidden min-w-0 p-1",
                  selectedTheme === "dark" && "ring-2 ring-primary",
                )}
                onClick={() => {
                  onSelectTheme("dark");
                  document.documentElement.classList.add("dark");
                }}
              >
                <CardContent className="p-0">
                  <div className="overflow-hidden w-full aspect-[3/4] sm:aspect-[4/3] max-h-44 sm:max-h-60 flex items-center justify-center bg-muted">
                    <Image
                      src="/dark.png"
                      alt="Dark mode"
                      width={180}
                      height={240}
                      className="h-full w-auto object-contain"
                      priority
                    />
                  </div>
                  <div className="p-3 sm:p-4 flex items-center justify-between bg-background">
                    <div className="font-semibold text-base sm:text-lg">{darkLabel}</div>
                    {selectedTheme === "dark" && <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />}
                  </div>
                </CardContent>
              </Card>
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
