import type { FooterProps } from "../types";

export const FooterMarker = Symbol("RentalOrderFormFooter");

export function RentalOrderFormFooter({ children }: FooterProps) {
  return <>{children}</>;
}

(RentalOrderFormFooter as { __marker?: symbol }).__marker = FooterMarker;
