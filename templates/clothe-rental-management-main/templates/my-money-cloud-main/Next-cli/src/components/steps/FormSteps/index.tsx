"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import type { StepFormHandle, StepKey } from "../types";
import { StepContainer } from "./internal/StepContainer";
import { StepContextProvider } from "./internal/StepContext";
import { buildLinkedMap, buildStepMap, extractSlots } from "./internal/StepHelpers";
import { DefaultFooter, FormStepsFooter } from "./internal/StepFooter";
import { DefaultHeader, FormStepsHeader } from "./internal/StepHeader";
import { FormStepsStep } from "./internal/Step";
import { FormStepsSteps } from "./internal/Steps";
import type { CompoundType, FormStepsProps } from "./types";

export const FormSteps = forwardRef<StepFormHandle, FormStepsProps>(function FormSteps(
  { open, onClose, initialStepKey, onSubmit, onStepChange, labels, children },
  ref,
) {
  const slots = extractSlots(children);

  const stepConfigs = useMemo(() => slots.steps, [slots.steps]);

  const [currentKey, setCurrentKey] = useState<StepKey>(initialStepKey ?? stepConfigs[0]?.key ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepData, setStepData] = useState<Record<StepKey, unknown>>({});

  const linkedMap = useMemo(() => buildLinkedMap(stepConfigs), [stepConfigs]);
  const stepMap = useMemo(() => buildStepMap(stepConfigs), [stepConfigs]);

  useEffect(() => {
    if (!stepMap[currentKey]) {
      const fallback = initialStepKey ?? stepConfigs[0]?.key;
      if (fallback) setCurrentKey(fallback);
    }
  }, [currentKey, initialStepKey, stepConfigs, stepMap]);

  const goTo = (key: StepKey) => {
    if (stepMap[key]) setCurrentKey(key);
  };

  const goNext = () => {
    const next = linkedMap[currentKey]?.next;
    if (next) setCurrentKey(next);
  };

  const goPrev = () => {
    const prev = linkedMap[currentKey]?.prev;
    if (prev) setCurrentKey(prev);
  };

  const reset = () => {
    const fallback = initialStepKey ?? stepConfigs[0]?.key;
    if (fallback) setCurrentKey(fallback);
    setStepData({});
    setIsSubmitting(false);
  };

  const setStepDataValue = (key: StepKey, value: unknown) => {
    setStepData((prev) => ({ ...prev, [key]: value }));
  };
  const getStepDataValue = <T = unknown,>(key: StepKey): T | undefined => stepData[key] as T | undefined;

  useImperativeHandle(
    ref,
    () => ({
      goNext,
      goPrev,
      goTo,
      reset,
      getCurrentKey: () => currentKey,
      setStepData: setStepDataValue,
      getStepData: getStepDataValue,
    }),
    [currentKey, goNext, goPrev, goTo, reset, setStepDataValue, getStepDataValue],
  );

  const currentStep = stepMap[currentKey] ?? stepConfigs[0];
  const isLastStep = !linkedMap[currentKey]?.next;
  const isFirstStep = !linkedMap[currentKey]?.prev;

  useEffect(() => {
    if (currentKey && onStepChange) {
      onStepChange(currentKey);
    }
  }, [currentKey, onStepChange]);

  const runPrimary = async () => {
    const valid = currentStep?.validate ? await currentStep.validate() : true;
    if (!valid) return;

    if (isLastStep) {
      if (!onSubmit) return;
      setIsSubmitting(true);
      try {
        await onSubmit();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    goNext();
  };

  const runSecondary = () => {
    if (!isFirstStep) goPrev();
  };

  return (
    <StepContextProvider
      currentStep={currentStep}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      isSubmitting={isSubmitting}
      labels={labels}
      actions={{ onPrev: isFirstStep ? undefined : runSecondary, onNext: runPrimary }}
      renderContext={{
        currentKey,
        goNext,
        goPrev,
        goTo,
        setStepData: setStepDataValue,
        getStepData: getStepDataValue,
      }}
    >
      <StepContainer
        open={open}
        onClose={onClose}
        header={slots.headers.length ? slots.headers : [<DefaultHeader key="default-header" />]}
        footer={
          slots.footers.length
            ? slots.footers
            : [
                <DefaultFooter
                  key="default-footer"
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                  isSubmitting={isSubmitting}
                  labels={labels}
                  onPrev={isFirstStep ? undefined : runSecondary}
                  onNext={runPrimary}
                />,
              ]
        }
        body={currentStep?.render}
        bodyContext={{
          currentKey,
          goNext,
          goPrev,
          goTo,
          setStepData: setStepDataValue,
          getStepData: getStepDataValue,
        }}
      />
    </StepContextProvider>
  );
}) as React.ForwardRefExoticComponent<FormStepsProps & React.RefAttributes<StepFormHandle>> & CompoundType;

FormSteps.Step = FormStepsStep;
FormSteps.Header = FormStepsHeader;
FormSteps.Footer = FormStepsFooter;
FormSteps.Steps = FormStepsSteps;

export { useStepContext } from "./internal/StepContext";
