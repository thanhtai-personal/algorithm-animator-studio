import type { StepProps } from "../types";

export const StepMarker = Symbol("RentalOrderFormStep");

export function RentalOrderFormStep(props: StepProps) {
  return <>{props.children}</>;
}

(RentalOrderFormStep as { __marker?: symbol }).__marker = StepMarker;
