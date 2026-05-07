"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n";
import { AppLockGate } from "@/features/auth/components/AppLockGate";
import { PwaInstallPrompt } from "@/features/app-shell/components/PwaInstallPrompt";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { AccountSwitchProvider } from "@/features/auth/components/AccountSwitchProvider";
import { ForceResetGuard } from "@/features/app-shell/components/ForceResetGuard";
import { OnlineSyncProvider } from "@/features/app-shell/components/OnlineSyncProvider";
import { useLocalStoreBootstrap } from "@/hooks/useLocalStoreBootstrap";
import { uiStore } from "@/store/uiStore";
import { LoadingScreen } from "@/components/LoadingScreen";
import { observer } from "mobx-react-lite";
import { authStore } from "@/store/authStore";
import { useTheme } from "next-themes";

const ThemeSettingsSync = observer(function ThemeSettingsSync() {
  const { setTheme } = useTheme();
  useEffect(() => {
    const mode = authStore.userSettings?.theme_mode;
    if (mode === "light" || mode === "dark") {
      setTheme(mode);
    }
  }, [setTheme, authStore.userSettings?.theme_mode]);
  return null;
});

export const Providers = observer(function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  useLocalStoreBootstrap();

  const onLoad = () => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => { });
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        }).catch(() => {});
      }
      if (typeof window !== "undefined" && "caches" in window) {
        caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {});
      }
    }
    window.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return uiStore.loading ? <LoadingScreen /> : (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ThemeSettingsSync />
          <TooltipProvider>
            <Sonner />
            <ForceResetGuard />
            <PwaInstallPrompt />
            <AccountSwitchProvider>
              <AuthGate>
                <AppLockGate>
                  <OnlineSyncProvider>
                    {children}
                  </OnlineSyncProvider>
                </AppLockGate>
              </AuthGate>
            </AccountSwitchProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
})
