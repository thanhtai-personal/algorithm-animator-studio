import { isDesktopRuntime } from "./publicRuntime";

export type LocalRuntimeAccessState = "granted" | "denied" | "unset";

const LOCAL_RUNTIME_ACCESS_KEY = "kata.localRuntimeAccess";
export const LOCAL_RUNTIME_ACCESS_CHANGED_EVENT = "kata:local-runtime-access-changed";

export function getLocalRuntimeAccessState(): LocalRuntimeAccessState {
  if (typeof window === "undefined") {
    return "unset";
  }

  if (isDesktopRuntime()) {
    return "granted";
  }

  const value = window.localStorage.getItem(LOCAL_RUNTIME_ACCESS_KEY);
  return value === "granted" || value === "denied" ? value : "unset";
}

export function hasLocalRuntimeAccess() {
  return getLocalRuntimeAccessState() === "granted";
}

export function setLocalRuntimeAccessState(nextState: LocalRuntimeAccessState) {
  if (typeof window === "undefined" || isDesktopRuntime()) {
    return;
  }

  if (nextState === "unset") {
    window.localStorage.removeItem(LOCAL_RUNTIME_ACCESS_KEY);
  } else {
    window.localStorage.setItem(LOCAL_RUNTIME_ACCESS_KEY, nextState);
  }

  window.dispatchEvent(new CustomEvent(LOCAL_RUNTIME_ACCESS_CHANGED_EVENT, { detail: nextState }));
}

export function grantLocalRuntimeAccess() {
  setLocalRuntimeAccessState("granted");
}

export function denyLocalRuntimeAccess() {
  setLocalRuntimeAccessState("denied");
}

export function resetLocalRuntimeAccess() {
  setLocalRuntimeAccessState("unset");
}
