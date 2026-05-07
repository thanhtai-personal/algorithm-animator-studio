"use client";

import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStepContext } from "./StepContext";
import type { FooterProps, FormStepsProps } from "../types";

export const FooterMarker = Symbol("FormStepFooter");

export const FormStepsFooter = ({ children }: FooterProps) => {
  const ctx = useStepContext();
  const { labels, isLastStep, isSubmitting, actions, isFirstStep } = ctx;
  if (typeof children === "function") {
    return (
      <>
        {children({
          onPrev: actions.onPrev,
          onNext: actions.onNext,
          isLastStep,
          isSubmitting,
          labels,
        })}
      </>
    );
  }
  return (
    <DialogFooter className="flex gap-2">
      {!isFirstStep && (
        <Button variant="outline" onClick={actions.onPrev}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {labels.back}
        </Button>
      )}
      <Button onClick={actions.onNext} disabled={isSubmitting} className="flex-1">
        {isSubmitting ? labels.submitting ?? labels.done : isLastStep ? labels.done : labels.next}
        {!isLastStep && !isSubmitting && <ChevronRight className="h-4 w-4 ml-1" />}
      </Button>
    </DialogFooter>
  );
};

(FormStepsFooter as any).__marker = FooterMarker;

type DefaultFooterProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  labels: FormStepsProps["labels"];
  onPrev?: () => void;
  onNext: () => void | Promise<void>;
};

export const DefaultFooter = ({
  isFirstStep,
  isLastStep,
  isSubmitting,
  labels,
  onPrev,
  onNext,
}: DefaultFooterProps) => (
  <DialogFooter className="flex gap-2">
    {!isFirstStep && (
      <Button variant="outline" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        {labels.back}
      </Button>
    )}
    <Button onClick={onNext} disabled={isSubmitting} className="flex-1">
      {isSubmitting ? labels.submitting ?? labels.done : isLastStep ? labels.done : labels.next}
      {!isLastStep && !isSubmitting && <ChevronRight className="h-4 w-4 ml-1" />}
    </Button>
  </DialogFooter>
);
