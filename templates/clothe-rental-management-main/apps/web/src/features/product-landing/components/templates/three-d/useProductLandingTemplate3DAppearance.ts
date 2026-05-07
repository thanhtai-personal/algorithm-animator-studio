"use client";

import { useMemo } from "react";
import { useThemePreferences } from "@/lib/themeVariants";
import type { ThemeVariant } from "@/types/themeVariant";
import {
  buildThemeStyle,
  type PaletteMode,
} from "./productLandingTemplate3D.config";

const THEME_VARIANT_TO_3D_PALETTE: Record<ThemeVariant, PaletteMode> = {
  sunset: "gold",
  cosmic: "rose",
  ocean: "ocean",
  forest: "emerald",
  rose: "rose",
  midnight: "ocean",
};

const THREE_D_PALETTE_TO_THEME_VARIANT: Record<PaletteMode, ThemeVariant> = {
  gold: "sunset",
  rose: "rose",
  ocean: "ocean",
  emerald: "forest",
};

function resolve3DPaletteFromThemeVariant(variant: ThemeVariant): PaletteMode {
  return THEME_VARIANT_TO_3D_PALETTE[variant];
}

function resolveThemeVariantFrom3DPalette(palette: PaletteMode): ThemeVariant {
  return THREE_D_PALETTE_TO_THEME_VARIANT[palette];
}

export function useProductLandingTemplate3DAppearance() {
  const { mode, setMode, setVariant, variant } = useThemePreferences();

  const palette = useMemo(
    () => resolve3DPaletteFromThemeVariant(variant),
    [variant]
  );

  const themeStyle = useMemo(
    () => buildThemeStyle(mode, palette),
    [mode, palette]
  );

  return {
    mode,
    palette,
    setMode,
    setPalette: (nextPalette: PaletteMode) => {
      setVariant(resolveThemeVariantFrom3DPalette(nextPalette));
    },
    themeStyle,
  };
}
