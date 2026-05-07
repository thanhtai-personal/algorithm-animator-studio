"use client";

import { useEffect, useMemo, useState } from "react";

type StepItem<T extends string> = {
  id: T;
};

export function useStepFlow<T extends string, S extends StepItem<T>>(steps: S[]) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= steps.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, steps.length]);

  const currentStep = steps[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;

  const goNext = () => {
    setCurrentIndex((idx) => Math.min(idx + 1, steps.length - 1));
  };

  const goPrev = () => {
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  };

  const reset = () => setCurrentIndex(0);

  return useMemo(
    () => ({
      currentIndex,
      currentStep,
      isFirstStep,
      isLastStep,
      goNext,
      goPrev,
      reset,
    }),
    [currentIndex, currentStep, isFirstStep, isLastStep],
  );
}
