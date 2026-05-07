"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { reaction } from "mobx";
import { THEME_VARIANTS } from "@/constants/themeVariant";
import type { ThemeVariant } from "@/types/themeVariant";
import { authStore } from "@/store/authStore";
import {
  applyThemeAppearance,
  persistThemePreferences,
  readStoredThemeMode,
  readStoredThemeVariant,
  resolveThemeMode,
  resolveThemeVariant,
  type ThemeMode,
} from "@/lib/themePreferences";

type ThemePreferences = {
  mode: ThemeMode;
  variant: ThemeVariant;
};

const THEME_PREFERENCES_CHANGED_EVENT = "app:theme-preferences-changed";

function applyAndPersistTheme(theme: ThemePreferences): void {
  applyThemeAppearance(theme.mode, theme.variant);
  persistThemePreferences(theme.mode, theme.variant);
}

function broadcastThemePreferences(theme: ThemePreferences): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ThemePreferences>(THEME_PREFERENCES_CHANGED_EVENT, {
      detail: theme,
    })
  );
}

function resolveCurrentThemePreferences(): ThemePreferences {
  return {
    mode: resolveThemeMode(authStore.userSettings?.theme_mode ?? readStoredThemeMode()),
    variant: resolveThemeVariant(authStore.userSettings?.theme_variant ?? readStoredThemeVariant()),
  };
}

function persistThemeToStore(partial: {
  theme_mode?: ThemeMode;
  theme_variant?: ThemeVariant;
}): void {
  if (!authStore.userId && !authStore.anonId) return;

  authStore.upsert({
    ...partial,
    ...(partial.theme_mode ? { theme: partial.theme_mode } : {}),
  });
}

export function useThemePreferences() {
  const [theme, setTheme] = useState<ThemePreferences>(() => resolveCurrentThemePreferences());

  useLayoutEffect(() => {
    applyThemeAppearance(theme.mode, theme.variant);
  }, [theme.mode, theme.variant]);

  useEffect(() => {
    const dispose = reaction(
      () => ({
        mode: authStore.userSettings?.theme_mode ?? null,
        variant: authStore.userSettings?.theme_variant ?? null,
      }),
      ({ mode, variant }) => {
        const nextTheme: ThemePreferences = {
          mode: resolveThemeMode(mode ?? readStoredThemeMode()),
          variant: resolveThemeVariant(variant ?? readStoredThemeVariant()),
        };

        // Keep DOM + local cache in sync even if another flow mutates authStore directly.
        applyAndPersistTheme(nextTheme);

        setTheme((previous) => {
          if (
            previous.mode === nextTheme.mode &&
            previous.variant === nextTheme.variant
          ) {
            return previous;
          }
          return nextTheme;
        });
      },
      { fireImmediately: true }
    );

    return () => {
      dispose();
    };
  }, []);

  useEffect(() => {
    const handleThemeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<ThemePreferences>;
      const nextTheme = customEvent.detail ?? resolveCurrentThemePreferences();

      setTheme((previous) => {
        if (
          previous.mode === nextTheme.mode &&
          previous.variant === nextTheme.variant
        ) {
          return previous;
        }
        return nextTheme;
      });
    };

    window.addEventListener(THEME_PREFERENCES_CHANGED_EVENT, handleThemeChanged);
    return () => {
      window.removeEventListener(THEME_PREFERENCES_CHANGED_EVENT, handleThemeChanged);
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    const resolvedMode = resolveThemeMode(nextMode);
    const currentVariant = resolveThemeVariant(authStore.userSettings?.theme_variant ?? readStoredThemeVariant());
    const nextTheme: ThemePreferences = { mode: resolvedMode, variant: currentVariant };

    setTheme((previous) => {
      if (previous.mode === nextTheme.mode && previous.variant === nextTheme.variant) {
        return previous;
      }
      return nextTheme;
    });
    applyAndPersistTheme(nextTheme);
    broadcastThemePreferences(nextTheme);
    persistThemeToStore({ theme_mode: nextTheme.mode });
  }, []);

  const toggleMode = useCallback(() => {
    const currentMode = resolveThemeMode(authStore.userSettings?.theme_mode ?? readStoredThemeMode());
    const currentVariant = resolveThemeVariant(authStore.userSettings?.theme_variant ?? readStoredThemeVariant());
    const nextTheme: ThemePreferences = {
      mode: currentMode === "light" ? "dark" : "light",
      variant: currentVariant,
    };

    setTheme((previous) => {
      if (previous.mode === nextTheme.mode && previous.variant === nextTheme.variant) {
        return previous;
      }
      return nextTheme;
    });
    applyAndPersistTheme(nextTheme);
    broadcastThemePreferences(nextTheme);
    persistThemeToStore({ theme_mode: nextTheme.mode });
  }, []);

  const setVariant = useCallback((nextVariant: ThemeVariant) => {
    const resolvedVariant = resolveThemeVariant(nextVariant);
    const currentMode = resolveThemeMode(authStore.userSettings?.theme_mode ?? readStoredThemeMode());
    const nextTheme: ThemePreferences = { mode: currentMode, variant: resolvedVariant };

    setTheme((previous) => {
      if (previous.mode === nextTheme.mode && previous.variant === nextTheme.variant) {
        return previous;
      }
      return nextTheme;
    });
    applyAndPersistTheme(nextTheme);
    broadcastThemePreferences(nextTheme);
    persistThemeToStore({ theme_variant: nextTheme.variant });
  }, []);

  return {
    mode: theme.mode,
    variant: theme.variant,
    setMode,
    toggleMode,
    setVariant,
    options: THEME_VARIANTS,
  };
}

export function useThemeVariant() {
  const { variant, setVariant, options } = useThemePreferences();

  return {
    variant,
    setVariant,
    options,
  };
}

export function useThemeMode() {
  const { mode, setMode, toggleMode } = useThemePreferences();
  return { mode, setMode, toggleMode };
}

export { THEME_VARIANTS };
export type { ThemeVariant };
