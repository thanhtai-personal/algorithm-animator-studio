import type React from "react";
import type { CompoundType, RentalOrderFormStepsProps, RentalOrderStepKey } from "./types";
import { StepContextProvider } from "./internal/StepContext";
import { extractSlots } from "./internal/StepHelpers";
import { RentalOrderFormFooter } from "./internal/StepFooter";
import { RentalOrderFormStep } from "./internal/Step";
import { RentalOrderFormStepsSlot } from "./internal/Steps";

function buildOrderedSteps(steps: ReturnType<typeof extractSlots>["steps"]) {
  return [...steps].sort((left, right) => left.step - right.step);
}

function findCurrentIndex(steps: ReturnType<typeof extractSlots>["steps"], currentStep: RentalOrderStepKey) {
  const index = steps.findIndex((step) => step.step === currentStep);
  return index >= 0 ? index : 0;
}

export const RentalOrderFormSteps = (({
  currentStep,
  onStepChange,
  children,
}: RentalOrderFormStepsProps) => {
  const slots = extractSlots(children);
  const steps = buildOrderedSteps(slots.steps);
  const currentIndex = findCurrentIndex(steps, currentStep);
  const currentConfig = steps[currentIndex];
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentIndex >= steps.length - 1;

  const goTo = (step: RentalOrderStepKey) => {
    const nextStep = steps.find((entry) => entry.step === step);
    if (!nextStep || nextStep.disabled) return;
    onStepChange(step);
  };

  const goNext = () => {
    const nextStep = steps[currentIndex + 1];
    if (!nextStep || nextStep.disabled) return;
    onStepChange(nextStep.step);
  };

  const goPrev = () => {
    const previousStep = steps[currentIndex - 1];
    if (!previousStep) return;
    onStepChange(previousStep.step);
  };

  const renderContext = {
    currentStep: currentConfig?.step ?? currentStep,
    currentLabel: currentConfig?.label ?? "",
    isFirstStep,
    isLastStep,
    goTo,
    goNext,
    goPrev,
  };

  const footer = slots.footers[0];

  return (
    <StepContextProvider value={renderContext}>
      <section className="stepper-card" aria-label="Tiến trình tạo đơn">
        {steps.map((step, index) => {
          const isActive = step.step === renderContext.currentStep;
          const isComplete = step.step < renderContext.currentStep;

          return (
            <div key={step.step} className="stepper-item">
              <button
                type="button"
                className={`stepper-pill ${isActive ? "is-active" : isComplete ? "is-complete" : ""}`}
                onClick={() => goTo(step.step)}
                disabled={step.disabled}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="stepper-index">{step.step}</span>
                <span className="stepper-label">{step.label}</span>
              </button>

              {index < steps.length - 1 ? (
                <span
                  className={`stepper-connector ${steps[index + 1].step <= renderContext.currentStep ? "is-active" : ""}`}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );
        })}
      </section>

      {currentConfig ? currentConfig.render(renderContext) : null}

      {footer ? (
        <div className="page-fixed-footer" aria-hidden="false">
          <div className="page-fixed-footer-inner">
            {typeof footer.props.children === "function"
              ? footer.props.children(renderContext)
              : footer.props.children}
          </div>
        </div>
      ) : null}
    </StepContextProvider>
  );
}) as React.FC<RentalOrderFormStepsProps> & CompoundType;

RentalOrderFormSteps.Step = RentalOrderFormStep;
RentalOrderFormSteps.Steps = RentalOrderFormStepsSlot;
RentalOrderFormSteps.Footer = RentalOrderFormFooter;
