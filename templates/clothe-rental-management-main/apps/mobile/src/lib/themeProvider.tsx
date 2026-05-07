import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { reaction } from "mobx";

import { authStore } from "@/store/authStore";
import { normalizeTheme, normalizeThemeVariant } from "@/lib/theme";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { updateUserSettings } from "@/features/app-shell/services/user";
import type { ThemeVariant } from "@/types/themeVariant";
import { DEFAULT_THEME_VARIANT, THEME_VARIANTS } from "@/constants/themeVariant";

type ThemeMode = "light" | "dark";

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  danger: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  variant: ThemeVariant | null;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const LIGHT_COLORS: ThemeColors = {
  background: "#ffffff",
  card: "#f9fafb",
  text: "#111827",
  mutedText: "#6b7280",
  border: "#e5e7eb",
  primary: "#111827",
  danger: "#b91c1c",
};

const DARK_COLORS: ThemeColors = {
  background: "#0b0f19",
  card: "#111827",
  text: "#f9fafb",
  mutedText: "#9ca3af",
  border: "#1f2937",
  primary: "#f9fafb",
  danger: "#f87171",
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();

  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = normalizeTheme(authStore.userSettings?.theme_mode);
    return stored ?? (systemScheme === "dark" ? "dark" : "light");
  });
  const [variant, setVariant] = useState<ThemeVariant>(() => {
    return normalizeThemeVariant(authStore.userSettings?.theme_variant) ?? DEFAULT_THEME_VARIANT;
  });

  useEffect(() => {
    const dispose = reaction(
      () => authStore.userSettings?.theme_mode ?? null,
      (value) => {
        const resolved = normalizeTheme(value) ?? (systemScheme === "dark" ? "dark" : "light");
        setMode(resolved);
      },
      { fireImmediately: true }
    );
    return () => dispose();
  }, [systemScheme]);

  useEffect(() => {
    const dispose = reaction(
      () => authStore.userSettings?.theme_variant ?? null,
      (value) => {
        const resolved = normalizeThemeVariant(value) ?? DEFAULT_THEME_VARIANT;
        setVariant(resolved);
      },
      { fireImmediately: true }
    );
    return () => dispose();
  }, []);

  useEffect(() => {
    if (!authStore.userSettings?.theme_mode) {
      setMode(systemScheme === "dark" ? "dark" : "light");
    }
  }, [systemScheme]);

  const setThemeMode = useCallback(
    async (nextMode: ThemeMode) => {
      try {
        const hasUserId = Boolean(authStore.userId);
        if (!hasUserId || isAnonymous || !isOnline) {
          authStore.upsert({ theme_mode: nextMode });
          if (hasUserId && !isAnonymous && !isOnline) {
            offlineQueueStore.enqueue({
              id: Math.random().toString(36).substring(2),
              entity: "settings",
              action: "update",
              payload: { updates: { theme_mode: nextMode } },
            });
          }
          setMode(nextMode);
          return;
        }
        const updated = await updateUserSettings({ theme_mode: nextMode });
        authStore.upsert(updated);
        setMode(nextMode);
      } catch (error) {
        console.warn("theme_update_failed", error);
      }
    },
    [isAnonymous, isOnline]
  );

  const value = useMemo<ThemeContextValue>(() => {
    const palette = THEME_VARIANTS.find((item) => item.id === variant) ?? THEME_VARIANTS[0];
    const colors = {
      ...(mode === "dark" ? DARK_COLORS : LIGHT_COLORS),
      primary: palette.preview.primary,
    };
    return {
      mode,
      variant,
      colors,
      setThemeMode,
    };
  }, [mode, setThemeMode, variant]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
