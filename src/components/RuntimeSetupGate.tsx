import type { PropsWithChildren } from "react";

export function markRuntimeSetupGateSkipped() {
  window.localStorage.setItem("kai-studio.setup.skip-gate", "true");
}

export function markRuntimeSetupGateVisited() {
  window.localStorage.setItem("kai-studio.setup.visited", "true");
}

/**
 * Runtime health is advisory at the routing layer.
 *
 * Individual features must enforce the runtime capabilities they depend on
 * (for example Piper generation validates the executable/model files). A
 * failed health check must never prevent the user from opening the studio.
 */
export function RuntimeSetupGate({ children }: PropsWithChildren) {
  return <>{children}</>;
}
