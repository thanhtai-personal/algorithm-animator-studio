"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type InstallOutcome = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome; platform: string }>;
};

function detectIos(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

function detectStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return displayModeStandalone || iosStandalone;
}

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const refreshStandaloneState = () => {
      setIsStandalone(detectStandaloneMode());
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      refreshStandaloneState();
    };

    refreshStandaloneState();

    mediaQuery.addEventListener("change", refreshStandaloneState);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      mediaQuery.removeEventListener("change", refreshStandaloneState);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<InstallOutcome | null> => {
    if (!deferredPrompt) return null;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  const isIos = useMemo(() => detectIos(), []);
  const isInstallable = Boolean(deferredPrompt) && !isStandalone;

  return {
    isInstallable,
    isInstalled: isStandalone,
    isIos,
    install,
  };
}
