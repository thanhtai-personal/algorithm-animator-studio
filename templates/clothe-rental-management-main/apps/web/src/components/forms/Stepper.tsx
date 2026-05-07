"use client";

import { Check } from "lucide-react";
import { cn } from "@/utils/className";

export interface StepperStep {
  key: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStepIndex: number;
  onStepChange?: (index: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStepIndex,
  onStepChange,
  className,
}: StepperProps) {
  return (
    <ol className={cn("flex w-full items-start", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const isDisabled = !onStepChange;

        return (
          <li key={step.key} className="flex flex-1 items-start last:flex-none">
            <button
              type="button"
              onClick={() => onStepChange?.(index)}
              disabled={isDisabled}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "group flex min-w-[68px] flex-col items-center text-center",
                isDisabled ? "cursor-default" : "cursor-pointer"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-primary/10 text-primary",
                  !isActive && !isCompleted && "border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </span>

              <p
                className={cn(
                  "mt-1.5 text-[10px] font-semibold uppercase tracking-wide",
                  isActive || isCompleted ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>

              {step.description ? (
                <p className="mt-1 max-w-[110px] text-[10px] leading-tight text-muted-foreground">
                  {step.description}
                </p>
              ) : null}
            </button>

            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "mt-4 h-0.5 flex-1 rounded-full mx-2",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
