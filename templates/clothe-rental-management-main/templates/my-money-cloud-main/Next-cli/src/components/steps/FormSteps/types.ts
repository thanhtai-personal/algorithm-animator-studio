import type React from "react";
import type { StepFormHandle, StepKey, StepRenderContext } from "../types";

export type FormStepsProps = {
  open: boolean;
  onClose: () => void;
  initialStepKey?: StepKey;
  onSubmit?: () => void | Promise<void>;
  onStepChange?: (key: StepKey) => void;
  labels: {
    back: string;
    next: string;
    done: string;
    submitting?: string;
  };
  children: React.ReactNode;
};

export type StepProps = {
  stepKey: StepKey;
  title: string;
  validate?: () => boolean | Promise<boolean>;
  children: React.ReactNode | ((ctx: StepRenderContext) => React.ReactNode);
};

export type HeaderProps = { children?: React.ReactNode };
export type FooterProps = {
  children?: (params: {
    onPrev?: () => void | Promise<void>;
    onNext: () => void | Promise<void>;
    isLastStep: boolean;
    isSubmitting: boolean;
    labels: FormStepsProps["labels"];
  }) => React.ReactNode;
};

export type StepsProps = { children: React.ReactNode };

export type CompoundType = {
  Step: typeof import("./internal/Step").FormStepsStep;
  Header: typeof import("./internal/StepHeader").FormStepsHeader;
  Footer: typeof import("./internal/StepFooter").FormStepsFooter;
  Steps: typeof import("./internal/Steps").FormStepsSteps;
};
