"use client";

import { createContext, useContext } from "react";
import type { StepConfig, StepRenderContext } from "../../types";
import type { FormStepsProps } from "../types";

type StepContextValue = {
  currentStep?: StepConfig;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  labels: FormStepsProps["labels"];
  actions: {
    onPrev?: () => void | Promise<void>;
    onNext: () => void | Promise<void>;
  };
  renderContext: StepRenderContext;
};

const StepContext = createContext<StepContextValue>({
  isFirstStep: true,
  isLastStep: true,
  isSubmitting: false,
  labels: { back: "", next: "", done: "" },
  actions: { onNext: () => {} },
  renderContext: {
    currentKey: "",
    goNext: () => {},
    goPrev: () => {},
    goTo: () => {},
    setStepData: () => {},
    getStepData: () => undefined,
  },
});

export function StepContextProvider({
  children,
  ...value
}: StepContextValue & { children: React.ReactNode }) {
  return <StepContext.Provider value={value}>{children}</StepContext.Provider>;
}

export function useStepContext() {
  return useContext(StepContext);
}
