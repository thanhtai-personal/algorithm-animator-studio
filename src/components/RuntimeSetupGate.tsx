import { useEffect, useState, type PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSetupWizardStatus } from "@/lib/setupWizardApi";
import { IS_PUBLIC_WEB } from "@/lib/runtimeApi";

export function markRuntimeSetupGateSkipped() {
  window.localStorage.setItem("kai-studio.setup.skip-gate", "true");
}

export function markRuntimeSetupGateVisited() {
  window.localStorage.setItem("kai-studio.setup.visited", "true");
}

export function RuntimeSetupGate({ children }: PropsWithChildren) {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "ready" | "needs-setup">("checking");
  const path = location.pathname;

  useEffect(() => {
    if (IS_PUBLIC_WEB || isFreePath(path)) {
      setState("ready");
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
    <main className="grid min-h-[60vh] place-items-center px-4 text-sm font-medium text-muted-foreground">
      Đang kiểm tra môi trường local...
    </main>
  );
}

function isFreePath(pathname: string) {
  return ["/setup", "/settings", "/auth", "/privacy", "/term", "/terms"].includes(pathname);
}
