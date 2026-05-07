"use client";

import { useEffect, useMemo, useState } from "react";
import { Apple, ChevronLeft, ChevronRight, Download, LogOut, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/date";
import { addMonths, subMonths } from "date-fns";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ConfirmLogoutDialog } from "@/features/auth/components/ConfirmLogoutDialog";
import { useI18n } from "@/lib/i18n";
import { authStore } from "@/store/authStore";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { androidUrl, iosUrl } from "../constants";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { SyncDataDrawer } from "./SyncDataDrawer";
import { PWA_INSTALL_OPEN_EVENT } from "./PwaInstallPrompt";
import { observer } from "mobx-react-lite";

interface HeaderProps {
  selectedMonth?: Date;
  onMonthChange?: (date: Date) => void;
  showMonthControls?: boolean;
}

export const Header = observer(function Header({ selectedMonth, onMonthChange, showMonthControls }: HeaderProps) {
    // All hooks and state must be initialized first
    // Then dependent variables can be declared
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const { isAnonymous } = useAnonymousChecker();
    const { isOnline } = useOnlineChecker();
    const { signOut } = useAuthActions();
    const { t, language, locale } = useI18n();
    const [isStandalone, setIsStandalone] = useState(false);
    const { syncing, syncNow, progress, error, status, paused, pauseSync } = useOfflineSync();
    const [showSyncDrawer, setShowSyncDrawer] = useState(false);

    // Dependent variables declared after all hooks and state
    const storeLinks = [
      {
        key: "android",
        label: t("header.downloadAndroid"),
        url: androidUrl,
        icon: Smartphone,
      },
      {
        key: "ios",
        label: t("header.downloadIos"),
        url: iosUrl,
        icon: Apple,
      },
    ];

    const showPwaInstallButton = !isStandalone;

    const handleInstallOpen = () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(PWA_INSTALL_OPEN_EVENT));
      }
    };

    useEffect(() => {
      if (typeof window === "undefined") return;
      const media = window.matchMedia("(display-mode: standalone)");
      const updateStandalone = () => {
        const standalone = media.matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
        setIsStandalone(standalone);
      };
      updateStandalone();
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", updateStandalone);
      } else {
        media.addListener(updateStandalone);
      }
      const handleInstalled = () => {
        setIsStandalone(true);
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

    const pendingCount = useMemo(
      () => (authStore.userId ? offlineQueueStore.getCount(authStore.userId) : 0),
      [offlineQueueStore.version, authStore.userId]
    );
    const showSyncBanner = Boolean(authStore.userId && !isAnonymous && (!isOnline || pendingCount > 0));
    const syncMessage = !isOnline ? t("sync.offlineNotice") : t("sync.pendingNotice", { count: pendingCount });
  // (Removed duplicate hook and state declarations)

  return (
    <header className="sticky top-0 z-50 glass border-b border-border safe-top">
      <div className="container flex flex-col gap-2 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center">
              <img src="/favicon.png" alt={t("app.name")} className="h-7 w-7" />
            </div>
            <span className="hidden sm:inline font-bold text-lg">{t("app.name")}</span>
          </div>
          <div className="flex items-center flex-wrap justify-end gap-1">
            <div className="flex items-center gap-1">
              {showPwaInstallButton ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("header.installPwaButton")}
                  className="h-9 w-9 rounded-xl"
                  onClick={handleInstallOpen}
                >
                  <Download className="h-5 w-5" />
                </Button>
              ) : null}
              {storeLinks.map((item) => {
                const { key, label, url, icon: Icon } = item;
                return url ? (
                  <Button key={key} asChild variant="ghost" size="icon" aria-label={label} className="h-9 w-9 rounded-xl">
                    <a href={url} target="_blank" rel="noreferrer">
                      <Icon className="h-5 w-5" />
                    </a>
                  </Button>
                ) : (
                  <Button
                    key={key}
                    variant="ghost"
                    size="icon"
                    aria-label={label}
                    className="h-9 w-9 rounded-xl"
                    onClick={handleInstallOpen}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
            <LanguageToggle />
            <ThemeToggle />
            {authStore.userId ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  onClick={() => {
                    if (pendingCount > 0) {
                      setShowLogoutDialog(true);
                    } else {
                      signOut();
                    }
                  }}
                  aria-label={t("actions.signOut")}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
                <ConfirmLogoutDialog
                  open={showLogoutDialog}
                  onConfirm={() => {
                    setShowLogoutDialog(false);
                    offlineQueueStore.clear();
                    void signOut({ force: true });
                  }}
                  onCancel={() => setShowLogoutDialog(false)}
                />
              </>
            ) : null}
          </div>
        </div>
        {showMonthControls && selectedMonth && onMonthChange ? (
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => onMonthChange(subMonths(selectedMonth, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-[180px] text-center text-sm font-semibold">{formatMonthYear(selectedMonth, { language, locale })}</div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => onMonthChange(addMonths(selectedMonth, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        ) : null}
        {showSyncBanner ? (
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
              <span>{syncMessage}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => { syncNow(); setShowSyncDrawer(true); }} disabled={syncing}>
              {syncing ? t("sync.syncing") : t("sync.syncNow")}
            </Button>
          </div>
        ) : null}
        {/* Show offline mode notification if syncing is true */}
        {syncing ? (
          <div className="flex items-center justify-center mt-2 text-xs text-red-500">
            <span>Bạn đang hoạt động ở chế độ offline do quá trình đồng bộ dữ liệu chưa hoàn tất.</span>
          </div>
        ) : null}
      </div>
      {/* SyncDataDrawer modal */}
      <SyncDataDrawer
        open={syncing && showSyncDrawer}
        onPause={pauseSync}
        progress={progress}
        error={error}
        status={status}
        onClose={() => setShowSyncDrawer(false)}
      />
    </header>
  );
})
