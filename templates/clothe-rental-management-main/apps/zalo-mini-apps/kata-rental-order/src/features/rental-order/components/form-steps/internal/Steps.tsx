import type { StepsProps } from "../types";

export const StepsMarker = Symbol("RentalOrderFormSteps");

export function RentalOrderFormStepsSlot({ children }: StepsProps) {
  return <>{children}</>;
}

(RentalOrderFormStepsSlot as { __marker?: symbol }).__marker = StepsMarker;
