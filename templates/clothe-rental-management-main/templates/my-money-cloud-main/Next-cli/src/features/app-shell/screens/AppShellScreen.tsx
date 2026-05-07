"use client";

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { Header } from "@/features/app-shell/components/Header";
import { TabBar } from "@/features/app-shell/components/TabBar";
import { TabContentTransition } from "@/features/app-shell/components/TabContentTransition";
import { RectangleGlowingBackground } from "@/components/animations/RectangleGlowingBackground/RectangleGlowingBackground";
import { HomeScreen } from "@/features/app-shell/screens/HomeScreen";
import { StatsScreen } from "@/features/app-shell/screens/StatsScreen";
import { StoreScreen } from "@/features/app-shell/screens/StoreScreen";
import { SettingsScreen } from "@/features/app-shell/screens/SettingsScreen";
import { appShellStore, type TabKey } from "@/features/app-shell/stores/appShellStore";
import { authStore } from "@/store/authStore";
import { DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";
import { isThemeVariant } from "@/utils/themeVariant";

export const AppShellScreen = observer(function AppShellScreen() {
  const { activeTab } = appShellStore;
  const themeVariant = authStore.userSettings?.theme_variant;

  const handleTabChange = useCallback((tab: TabKey) => {
    appShellStore.setActiveTab(tab);
  }, []);

  const triggerMic = useCallback(() => {
    appShellStore.queueMic();
  }, []);

  useEffect(() => {
    // clear any stale mic queue when leaving home
    if (activeTab !== "home") {
      appShellStore.consumePendingMic();
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const resolvedVariant = isThemeVariant(themeVariant) ? themeVariant : DEFAULT_THEME_VARIANT;
    document.documentElement.setAttribute("data-theme", resolvedVariant);
  }, [themeVariant]);

  return (
    <div className="relative min-h-screen pb-32">
      <RectangleGlowingBackground />

      <Header showMonthControls={false} />

      <main className="container px-1 md:px-4 py-6 space-y-6">
        <TabContentTransition activeKey={activeTab}>
          {activeTab === "home" ? (
            <HomeScreen />
          ) : activeTab === "stats" ? (
            <StatsScreen />
          ) : activeTab === "store" ? (
            <StoreScreen />
          ) : (
            <SettingsScreen />
          )}
        </TabContentTransition>
      </main>

      <TabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMicClick={triggerMic}
        isListening={appShellStore.homeListening}
        isAIMode={appShellStore.homeAIMode}
      />
    </div>
  );
});
