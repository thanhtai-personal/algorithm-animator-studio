"use client";

import { useLayoutEffect } from "react";
import { reaction } from "mobx";
import { authStore } from "@/store/authStore";
import {
  applyThemeAppearance,
  persistThemePreferences,
  readStoredThemeMode,
  readStoredThemeVariant,
  resolveThemeMode,
  resolveThemeVariant,
} from "@/lib/themePreferences";

export function ThemeAppearanceSync() {
  useLayoutEffect(() => {
    const dispose = reaction(
      () => ({
        mode: authStore.userSettings?.theme_mode ?? null,
        variant: authStore.userSettings?.theme_variant ?? null,
      }),
      ({ mode, variant }) => {
        const resolvedMode = resolveThemeMode(mode ?? readStoredThemeMode());
        const resolvedVariant = resolveThemeVariant(variant ?? readStoredThemeVariant());
        applyThemeAppearance(resolvedMode, resolvedVariant);
        persistThemePreferences(resolvedMode, resolvedVariant);
      },
      {
        fireImmediately: true,
      }
    );

    return () => {
      dispose();
    };
  }, []);

  return null;
}
