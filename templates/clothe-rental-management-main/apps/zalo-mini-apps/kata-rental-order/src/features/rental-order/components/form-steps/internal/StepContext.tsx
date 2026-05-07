import { createContext } from "react";
import type { RentalOrderStepRenderContext } from "../types";

type StepContextValue = RentalOrderStepRenderContext & {
  currentLabel: string;
};

const StepContext = createContext<StepContextValue>({
  currentStep: 1,
  currentLabel: "",
  isFirstStep: true,
  isLastStep: true,
  goTo: () => {},
  goNext: () => {},
  goPrev: () => {},
});

export function StepContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: StepContextValue;
}) {
  return <StepContext.Provider value={value}>{children}</StepContext.Provider>;
}
