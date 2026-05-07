import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import mobileAds from "react-native-google-mobile-ads";
import { useLocalStoreBootstrap } from "@/hooks/useLocalStoreBootstrap";
import { QueryProvider } from "@/lib/queryClient";
import { I18nProvider } from "@/lib/i18n";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { AppLockGate } from "@/features/auth/components/AppLockGate";
import { ThemeProvider } from "@/lib/themeProvider";
import { OnlineSyncProvider } from "@/features/app-shell/components/OnlineSyncProvider";
import { ForceUpdateGate } from "@/features/app-shell/components/ForceUpdateGate";
import { AccountSwitchProvider } from "@/features/auth/components/AccountSwitchProvider";

function Bootstrapper() {
  useLocalStoreBootstrap();
  useEffect(() => {
    try {
      const ads = typeof mobileAds === "function" ? mobileAds() : (mobileAds as any);
      if (ads?.initialize) {
        void ads.initialize().catch(() => undefined);
      }
    } catch {
      // ignore ads init failures
    }
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Bootstrapper />
      <QueryProvider>
        <I18nProvider>
          <ThemeProvider>
            <ForceUpdateGate>
              <AccountSwitchProvider>
                <AuthGate>
                  <AppLockGate>
                    <OnlineSyncProvider>
                      <Stack screenOptions={{ headerShown: false }} />
                    </OnlineSyncProvider>
                  </AppLockGate>
                </AuthGate>
              </AccountSwitchProvider>
            </ForceUpdateGate>
          </ThemeProvider>
        </I18nProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
