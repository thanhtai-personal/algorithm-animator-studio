"use client";

import { useMemo, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { usePwaInstallPrompt } from "@/features/pwa/hooks/usePwaInstallPrompt";

export function PwaInstallButton() {
  const { t } = useI18n();
  const { isInstallable, isInstalled, isIos, install } = usePwaInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  const shouldRender = useMemo(() => {
    return isInstalled || isInstallable || isIos;
  }, [isInstallable, isInstalled, isIos]);

  if (!shouldRender) {
    return null;
  }

  const handleInstall = async () => {
    if (isInstallable) {
      await install();
      return;
    }

    if (isIos) {
      setShowIosHelp((previous) => !previous);
    }
  };

  if (isInstalled) {
    return (
      <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-success/35 bg-success/10 px-2.5 text-xs font-semibold text-success">
        <Smartphone className="h-3.5 w-3.5" />
        {t("common.enabled")}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void handleInstall()}
        aria-label={t("header.installPwaButton")}
        title={isIos ? t("header.installPwaIosHint") : t("header.installPwaSubtitle")}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("header.installPwaButton")}</span>
      </button>

      {showIosHelp ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-xl border border-border bg-card p-3 shadow-lg">
          <p className="text-xs font-semibold text-foreground">{t("header.installPwaTitle")}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t("header.installPwaIosHint")}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-muted-foreground">
            <li>{t("header.installPwaStep1")}</li>
            <li>{t("header.installPwaStep2")}</li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}
