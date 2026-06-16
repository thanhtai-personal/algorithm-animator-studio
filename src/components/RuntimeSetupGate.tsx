import { useEffect, useState, type PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { SystemLoader } from "@/components/ui/system-loader";
import { getCachedSetupWizardStatusSnapshot, getSetupWizardStatus } from "@/lib/setupWizardApi";
import { IS_PUBLIC_WEB } from "@/lib/runtimeApi";

export function markRuntimeSetupGateSkipped() {
  window.localStorage.setItem("kai-studio.setup.skip-gate", "true");
}

export function markRuntimeSetupGateVisited() {
  window.localStorage.setItem("kai-studio.setup.visited", "true");
}

export function RuntimeSetupGate({ children }: PropsWithChildren) {
  const location = useLocation();
  const path = location.pathname;
  const [state, setState] = useState<"checking" | "ready" | "needs-setup">(() => {
    if (IS_PUBLIC_WEB || isFreePath(path)) return "ready";
    const cached = getCachedSetupWizardStatusSnapshot();
    return cached ? (cached.coreReady ? "ready" : "needs-setup") : "checking";
  });

  useEffect(() => {
    if (IS_PUBLIC_WEB || isFreePath(path)) {
      setState("ready");
      return;
    }

    const cached = getCachedSetupWizardStatusSnapshot();
    if (cached) {
      setState(cached.coreReady ? "ready" : "needs-setup");
      return;
    }

    let active = true;
    setState("checking");
    getSetupWizardStatus()
      .then((status) => {
        if (active) setState(status.coreReady ? "ready" : "needs-setup");
      })
      .catch(() => {
        if (active) setState("needs-setup");
      });

    return () => { active = false; };
  }, [path]);

  if (IS_PUBLIC_WEB || isFreePath(path) || state === "ready") return <>{children}</>;
  if (state === "needs-setup") return <Navigate replace to="/settings?tab=health" state={{ from: location }} />;

  return (
    <main className="runtime-loading-screen grid min-h-screen place-items-center px-4">
      <SystemLoader className="h-[18rem] w-[36rem] max-w-[72vw] text-primary" title="Loading" />
    </main>
  );
}

function isFreePath(pathname: string) {
  return ["/setup", "/settings", "/auth", "/privacy", "/term", "/terms"].includes(pathname);
}
