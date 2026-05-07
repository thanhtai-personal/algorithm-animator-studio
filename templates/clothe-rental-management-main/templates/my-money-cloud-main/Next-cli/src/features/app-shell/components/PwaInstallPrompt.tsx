"use client";

import { useEffect, useRef, useState } from "react";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import storageAdapter from "@/lib/storageAdapter";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PwaInstallElement = HTMLElement & {
  install?: () => Promise<void>;
};

type PwaInstallProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  manifestpath?: string;
  iconpath?: string;
  forceshow?: boolean;
};

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      "pwa-install": PwaInstallProps;
    }
  }
  namespace JSX {
    interface IntrinsicElements {
      "pwa-install": PwaInstallProps;
    }
  }
}

const DISMISS_KEY = "spendsmart:pwa-install-dismissed";
const AUTO_INSTALL_KEY = "spendsmart:pwa-install-auto-shown";
const PROMPT_KEY = "deferredPwaPrompt";
export const PWA_INSTALL_OPEN_EVENT = "spendsmart:pwa-install-open";

const setGlobalPrompt = (value: BeforeInstallPromptEvent | null) => {
  if (typeof window === "undefined") return;
  (window as Window & { [PROMPT_KEY]?: BeforeInstallPromptEvent | null })[PROMPT_KEY] = value;
};

const getGlobalPrompt = (): BeforeInstallPromptEvent | null => {
  if (typeof window === "undefined") return null;
  return (window as Window & { [PROMPT_KEY]?: BeforeInstallPromptEvent | null })[PROMPT_KEY] ?? null;
};

export function PwaInstallPrompt() {
  const { t } = useI18n();
  const installElementRef = useRef<PwaInstallElement | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [autoShown, setAutoShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [open, setOpen] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [host, setHost] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("pwa-install/loader")
      .then(({ defineCustomElements }) => defineCustomElements(window))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stored = storageAdapter.getItem(DISMISS_KEY);
    setDismissed(stored === "true");
    const auto = storageAdapter.getItem(AUTO_INSTALL_KEY);
    setAutoShown(auto === "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(display-mode: standalone)");
    const updateStandalone = () => {
      const standalone = media.matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      setIsStandalone(standalone);
    };
    const ua = window.navigator.userAgent ?? "";
    setIsIos(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/i.test(ua));
    setHost(window.location.host);
    updateStandalone();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateStandalone);
    } else {
      media.addListener(updateStandalone);
    }
    const handleInstalled = () => {
      setIsStandalone(true);
      setOpen(false);
      setInstallPrompt(null);
      setGlobalPrompt(null);
      storageAdapter.setItem(DISMISS_KEY, "true");
      setDismissed(true);
    };
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("appinstalled", handleInstalled);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", updateStandalone);
      } else {
        media.removeListener(updateStandalone);
      }
    };
  }, []);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setGlobalPrompt(promptEvent);
      setInstallPrompt(promptEvent);
      if (dismissed || isStandalone || isAndroid) return;
      setOpen(true);
      setAutoShown(true);
      storageAdapter.setItem(AUTO_INSTALL_KEY, "true");
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, [dismissed, isStandalone, isAndroid]);

  useEffect(() => {
    if (dismissed || isStandalone || isAndroid || autoShown) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      setAutoShown(true);
      storageAdapter.setItem(AUTO_INSTALL_KEY, "true");
    }, 600);
    return () => window.clearTimeout(timer);
  }, [autoShown, dismissed, isAndroid, isStandalone]);

  useEffect(() => {
    const handleOpen = () => {
      if (isStandalone || isAndroid) return;
      setManualOverride(true);
      setOpen(true);
    };
    window.addEventListener(PWA_INSTALL_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener(PWA_INSTALL_OPEN_EVENT, handleOpen);
    };
  }, [isStandalone, isAndroid]);

  useEffect(() => {
    const prompt = getGlobalPrompt();
    if (prompt) {
      setInstallPrompt(prompt);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setShowManualSteps(false);
      setInstallError(null);
      return;
    }
    if (isIos) {
      setShowManualSteps(true);
    }
  }, [open, isIos]);

  const handleSkip = () => {
    storageAdapter.setItem(DISMISS_KEY, "true");
    setDismissed(true);
    setManualOverride(false);
    setOpen(false);
    setInstallPrompt(null);
    setGlobalPrompt(null);
    setInstallError(null);
    setShowManualSteps(false);
  };

  const handleInstall = async () => {
    const installElement =
      installElementRef.current ??
      (typeof window !== "undefined" ? (window as Window & { __pwaInstallEl?: PwaInstallElement | null }).__pwaInstallEl ?? null : null);
    const promptEvent = installPrompt ?? getGlobalPrompt();

    try {
      setInstallError(null);
      if (installElement && !installElement.install && typeof window !== "undefined" && "customElements" in window) {
        try {
          await customElements.whenDefined("pwa-install");
        } catch {
          // ignore
        }
      }
      if (installElement?.install) {
        await installElement.install();
        setOpen(false);
        setInstallPrompt(null);
        setGlobalPrompt(null);
        setManualOverride(false);
        return;
      }
      if (promptEvent) {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          storageAdapter.setItem(DISMISS_KEY, "true");
          setDismissed(true);
        }
        setOpen(false);
        setInstallPrompt(null);
        setGlobalPrompt(null);
        setManualOverride(false);
        return;
      }
      setShowManualSteps(true);
    } catch {
      setShowManualSteps(true);
      setInstallError(t("common.error"));
    }
  };

  const shouldRender = open && !isStandalone && !isAndroid && (!dismissed || manualOverride);

  return (
    <>
      <pwa-install
        manifestpath="/manifest.webmanifest"
        iconpath="/favicon.png"
        style={{ display: "none" }}
        ref={(node) => {
          installElementRef.current = node as PwaInstallElement | null;
          if (typeof window !== "undefined") {
            (window as Window & { __pwaInstallEl?: PwaInstallElement | null }).__pwaInstallEl = node as PwaInstallElement | null;
          }
        }}
      />
      {shouldRender ? (
        <div className="fixed inset-x-3 top-4 md:inset-auto md:right-6 md:top-6 md:w-[420px] z-[70]">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-neutral-900 text-white shadow-2xl animate-in fade-in slide-in-from-top-6 duration-200">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
              <div className="absolute -right-8 -bottom-10 h-36 w-36 rounded-full bg-indigo-500/30 blur-3xl" />
            </div>
            <div className="relative flex items-start gap-3 px-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 ring-1 ring-white/30 shadow-md">
                <img src="/favicon.png" alt={t("app.name")} className="h-8 w-8 rounded-lg" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold leading-tight">{t("app.name")}</p>
                    <p className="text-[11px] text-white/70 leading-tight truncate">{host}</p>
                  </div>
                  <button aria-label={t("header.installPwaSkip")} className="text-white/70 hover:text-white transition" onClick={handleSkip}>
                    ×
                  </button>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">{t("header.installPwaSubtitle")}</p>
                <p className="text-xs text-white/80 leading-relaxed">{t("header.installPwaNote")}</p>
                {showManualSteps ? (
                  <div className="space-y-1">
                    <p className="text-xs text-white/85 leading-relaxed">{t("header.installPwaStep1")}</p>
                    <p className="text-xs text-white/85 leading-relaxed">{t("header.installPwaStep2")}</p>
                  </div>
                ) : null}
                {isIos ? (
                  <p className="text-[11px] text-amber-200 bg-amber-500/15 border border-amber-400/30 rounded-md px-2 py-1 inline-block">
                    {t("header.installPwaIosHint")}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="relative flex items-center justify-between gap-2 border-t border-white/10 bg-white/5 px-4 py-3">
              <div className="flex min-w-0 flex-col gap-1">
                {installError ? (
                  <p className="text-xs text-amber-200 leading-tight">{installError}</p>
                ) : null}
                <button
                  type="button"
                  className="text-xs text-white/70 hover:text-white transition"
                  onClick={handleSkip}
                >
                  {t("header.installPwaSkip")}
                </button>
              </div>
              <Button variant="secondary" size="sm" className="bg-white text-neutral-900 hover:bg-white/90" onClick={handleInstall}>
                {t("header.installPwaButton")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
