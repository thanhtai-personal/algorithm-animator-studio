import type React from "react";

export type RentalOrderStepKey = 1 | 2;

export type RentalOrderStepRenderContext = {
  currentStep: RentalOrderStepKey;
  isFirstStep: boolean;
  isLastStep: boolean;
  goTo: (step: RentalOrderStepKey) => void;
  goNext: () => void;
  goPrev: () => void;
};

export type RentalOrderFormStepsProps = {
  currentStep: RentalOrderStepKey;
  onStepChange: (step: RentalOrderStepKey) => void;
  children: React.ReactNode;
};

export type StepProps = {
  step: RentalOrderStepKey;
  label: string;
  disabled?: boolean;
  children: React.ReactNode | ((ctx: RentalOrderStepRenderContext) => React.ReactNode);
};

export type StepsProps = {
  children: React.ReactNode;
};

export type FooterProps = {
  children:
    | React.ReactNode
    | ((ctx: RentalOrderStepRenderContext & { currentLabel: string }) => React.ReactNode);
};

export type StepConfig = {
  step: RentalOrderStepKey;
  label: string;
  disabled: boolean;
  render: (ctx: RentalOrderStepRenderContext) => React.ReactNode;
};

export type CompoundType = {
  Step: typeof import("./internal/Step").RentalOrderFormStep;
  Steps: typeof import("./internal/Steps").RentalOrderFormStepsSlot;
  Footer: typeof import("./internal/StepFooter").RentalOrderFormFooter;
};
