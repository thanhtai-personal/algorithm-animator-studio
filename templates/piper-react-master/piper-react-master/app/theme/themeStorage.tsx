import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type ThemePalette = "violet" | "teal" | "amber" | "rose";

const THEME_STORAGE_KEY = "kata.studio.theme";
const PALETTE_STORAGE_KEY = "kata.studio.palette";

const DEFAULT_MODE: ThemeMode = "dark";
const DEFAULT_PALETTE: ThemePalette = "violet";

type ThemeContextValue = {
  mode: ThemeMode;
  palette: ThemePalette;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readThemeMode());
  const [palette, setPaletteState] = useState<ThemePalette>(() => readThemePalette());

  useEffect(() => {
    applyTheme(mode, palette);

    if (mode !== "system" || typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(mode, palette);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode, palette]);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    palette,
    setMode(nextMode) {
      setModeState(nextMode);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
      }
    },
    setPalette(nextPalette) {
      setPaletteState(nextPalette);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PALETTE_STORAGE_KEY, nextPalette);
      }
    },
  }), [mode, palette]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeSettings must be used inside ThemeProvider");
  }
  return context;
}

function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  return raw === "dark" || raw === "light" || raw === "system" ? raw : DEFAULT_MODE;
}

function readThemePalette(): ThemePalette {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
  return raw === "violet" || raw === "teal" || raw === "amber" || raw === "rose" ? raw : DEFAULT_PALETTE;
}

function applyTheme(mode: ThemeMode, palette: ThemePalette) {
  if (typeof document === "undefined") return;

  const resolvedMode = mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : mode;

  document.documentElement.dataset.theme = resolvedMode;
  document.documentElement.dataset.palette = palette;
  document.documentElement.style.colorScheme = resolvedMode;
}
