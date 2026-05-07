"use client";

import { useEffect } from "react";

const ENABLE_PWA =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_PWA_DEV === "true";

export function PwaServiceWorkerBootstrap() {
  useEffect(() => {
    if (!ENABLE_PWA) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let didReload = false;

    const onControllerChange = () => {
      if (didReload) return;
      didReload = true;
      window.location.reload();
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        await registration.update().catch(() => {
          // Ignore update errors; registration already succeeded.
        });
      } catch {
        // Ignore registration errors to avoid blocking app usage.
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    void registerServiceWorker();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
