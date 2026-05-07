"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { useAuthBootstrap } from "@/features/auth/hooks/bootstrap/useAuthBootstrap";
import { ThemeAppearanceSync } from "@/features/app-shell/components/ThemeAppearanceSync";
import { PwaServiceWorkerBootstrap } from "@/features/pwa/components/PwaServiceWorkerBootstrap";
import { AppModalProvider } from "@/components/feedback/AppModalProvider";
import { authStore } from "@/store/authStore";
import { LoadingScreen } from "@/components/LoadingScreen";

const WEB_QUERY_STALE_TIME_MS = 30_000;
const WEB_QUERY_GC_TIME_MS = 5 * 60_000;

function ProvidersContent({ children }: { children: ReactNode }) {
  useAuthBootstrap();

  return (
    <I18nProvider>
      <ThemeAppearanceSync />
      <PwaServiceWorkerBootstrap />
      <Toaster position="top-center" richColors />
      <AppModalProvider>
        <AuthGate>{children}</AuthGate>
      </AppModalProvider>
    </I18nProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: WEB_QUERY_STALE_TIME_MS,
            gcTime: WEB_QUERY_GC_TIME_MS,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
            retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );
  const [isStoreReady, setIsStoreReady] = useState(false);

  useEffect(() => {
    authStore.load();
    setIsStoreReady(true);
  }, []);

  if (!isStoreReady) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersContent>{children}</ProvidersContent>
    </QueryClientProvider>
  );
}
