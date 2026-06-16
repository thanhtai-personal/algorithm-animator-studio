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
    <main className="runtime-loading-screen grid min-h-[60vh] place-items-center px-4 text-sm font-medium text-muted-foreground">
      <div className="runtime-loading-card grid place-items-center rounded-2xl border border-border/70 bg-card/80 px-10 py-9 text-center shadow-[0_18px_60px_hsl(214_80%_5%/0.18)] backdrop-blur-xl">
        <SystemLoader className="h-36 w-72 text-primary" title="Checking local environment" />
      </div>
    </main>
  );
}

function isFreePath(pathname: string) {
  return ["/setup", "/settings", "/auth", "/privacy", "/term", "/terms"].includes(pathname);
}
