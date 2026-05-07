import { DEFAULT_THEME_VARIANT, THEME_VARIANT_STORAGE_KEY } from "@/constants/themeVariant";
import storageAdapter from "@/lib/storageAdapter";
import type { ThemeVariant } from "@/types/themeVariant";
import { isThemeVariant } from "@/utils/themeVariant";

export type ThemeMode = "light" | "dark";

export const THEME_MODE_STORAGE_KEY = "spendsmart:theme-mode";

type PaletteTone = {
  hue: number;
  saturation: number;
  secondaryHue: number;
  accentHue: number;
  glowHue: number;
};

const THEME_PALETTE_TONES: Record<ThemeVariant, PaletteTone> = {
  sunset: {
    hue: 4,
    saturation: 85,
    secondaryHue: 171,
    accentHue: 48,
    glowHue: 15,
  },
  cosmic: {
    hue: 270,
    saturation: 80,
    secondaryHue: 200,
    accentHue: 330,
    glowHue: 290,
  },
  ocean: {
    hue: 200,
    saturation: 85,
    secondaryHue: 185,
    accentHue: 210,
    glowHue: 190,
  },
  forest: {
    hue: 140,
    saturation: 55,
    secondaryHue: 110,
    accentHue: 80,
    glowHue: 125,
  },
  rose: {
    hue: 330,
    saturation: 80,
    secondaryHue: 340,
    accentHue: 20,
    glowHue: 350,
  },
  midnight: {
    hue: 220,
    saturation: 70,
    secondaryHue: 260,
    accentHue: 200,
    glowHue: 240,
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeHue(hue: number): number {
  const normalized = hue % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function toHsl(hue: number, saturation: number, lightness: number): string {
  return `${Math.round(normalizeHue(hue))} ${Math.round(saturation)}% ${Math.round(lightness)}%`;
}

function scaledSaturation(base: number, ratio: number, min = 4, max = 96): number {
  return clamp(Math.round(base * ratio), min, max);
}

function buildThemeTokens(mode: ThemeMode, variant: ThemeVariant): Record<string, string> {
  const tone = THEME_PALETTE_TONES[variant];
  const baseSaturation = tone.saturation;

  if (mode === "dark") {
    const background = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.24), 7);
    const foreground = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.14), 92);
    const card = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.2), 10);
    const secondary = toHsl(tone.secondaryHue, scaledSaturation(baseSaturation, 0.18), 15);
    const accent = toHsl(tone.accentHue, scaledSaturation(baseSaturation, 0.2), 18);
    const muted = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.12), 15);
    const border = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.12), 18);
    const primary = toHsl(tone.hue, baseSaturation, 58);
    const primaryGlow = toHsl(tone.glowHue, clamp(baseSaturation + 10, 20, 98), 64);
    const shadowTint = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.36), 4);
    const heroLayerOne = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.45), 14);
    const heroLayerTwo = toHsl(tone.secondaryHue, scaledSaturation(baseSaturation, 0.38), 16);
    const heroLayerThree = toHsl(tone.accentHue, scaledSaturation(baseSaturation, 0.36), 18);

    return {
      "--background": background,
      "--foreground": foreground,
      "--card": card,
      "--card-foreground": foreground,
      "--popover": card,
      "--popover-foreground": foreground,

      "--primary": primary,
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": primaryGlow,

      "--secondary": secondary,
      "--secondary-foreground": toHsl(tone.secondaryHue, scaledSaturation(baseSaturation, 0.12), 90),

      "--accent": accent,
      "--accent-foreground": toHsl(tone.accentHue, scaledSaturation(baseSaturation, 0.12), 90),

      "--muted": muted,
      "--muted-foreground": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.08), 56),

      "--destructive": "0 62% 42%",
      "--destructive-foreground": "0 0% 100%",

      "--success": "152 50% 45%",
      "--success-foreground": "0 0% 100%",

      "--warning": "38 80% 52%",
      "--warning-foreground": "38 50% 10%",

      "--border": border,
      "--input": border,
      "--ring": primary,

      "--tabbar-bg": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.26), 14)})`,
      "--tabbar-wave": "hsl(var(--primary) / 0.24)",

      "--shadow-sm": `0 2px 8px -2px hsl(${shadowTint} / 0.34)`,
      "--shadow-md": `0 6px 20px -6px hsl(${shadowTint} / 0.44)`,
      "--shadow-lg": `0 12px 34px -10px hsl(${shadowTint} / 0.52)`,
      "--shadow-xl": `0 20px 50px -16px hsl(${shadowTint} / 0.62)`,
      "--shadow-glow": "0 8px 36px -10px hsl(var(--primary) / 0.52)",
      "--shadow-inner": `inset 0 1px 3px 0 hsl(${shadowTint} / 0.42)`,

      "--gradient-primary": `linear-gradient(135deg, hsl(${primary}), hsl(${primaryGlow}))`,
      "--gradient-secondary": `linear-gradient(135deg, hsl(${toHsl(tone.secondaryHue, clamp(baseSaturation - 6, 12, 96), 54)}), hsl(${toHsl(tone.secondaryHue + 10, clamp(baseSaturation - 2, 12, 96), 58)}))`,
      "--gradient-accent": `linear-gradient(135deg, hsl(${toHsl(tone.accentHue, clamp(baseSaturation - 8, 12, 96), 56)}), hsl(${toHsl(tone.accentHue + 10, clamp(baseSaturation - 2, 12, 96), 60)}))`,
      "--gradient-success": "linear-gradient(135deg, hsl(152 50% 45%), hsl(145 48% 48%))",
      "--gradient-background": `linear-gradient(180deg, hsl(${background}), hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.24), 6)}))`,
      "--gradient-card": `linear-gradient(145deg, hsl(${card}), hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.2), 8)}))`,

      "--sidebar-background": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.18), 9),
      "--sidebar-foreground": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.08), 86),
      "--sidebar-primary": toHsl(tone.hue, baseSaturation, 52),
      "--sidebar-primary-foreground": "0 0% 100%",
      "--sidebar-accent": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.12), 14),
      "--sidebar-accent-foreground": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.08), 86),
      "--sidebar-border": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.08), 15),
      "--sidebar-ring": toHsl(tone.hue, baseSaturation, 56),

      "--showroom-hero-overlay": `linear-gradient(120deg, hsl(${heroLayerOne} / 0.95) 12%, hsl(${heroLayerTwo} / 0.9) 58%, hsl(${heroLayerThree} / 0.86) 100%)`,
      "--showroom-hero-glow": `radial-gradient(circle_at_50%_-18%, hsl(${primary} / 0.34), transparent 58%), radial-gradient(circle_at_85%_118%, hsl(${primaryGlow} / 0.2), transparent 56%)`,
      "--showroom-hero-shadow": `0 22px 45px -14px hsl(${shadowTint} / 0.72)`,
      "--showroom-hero-chip-bg": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.28), 24)} / 0.36)`,
      "--showroom-hero-chip-border": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.24), 76)} / 0.34)`,
      "--showroom-hero-text": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.08), 96)})`,
      "--showroom-hero-muted": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.08), 84)})`,
      "--showroom-hero-highlight": "hsl(var(--primary))",
    };
  }

  const background = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.28), 98);
  const foreground = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.44), 8);
  const card = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.12), 100);
  const secondary = toHsl(tone.secondaryHue, scaledSaturation(baseSaturation, 0.24), 94);
  const accent = toHsl(tone.accentHue, scaledSaturation(baseSaturation, 0.28), 92);
  const muted = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.16), 94);
  const border = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.15), 88);
  const primary = toHsl(tone.hue, baseSaturation, 44);
  const primaryGlow = toHsl(tone.glowHue, clamp(baseSaturation + 8, 20, 98), 52);
  const shadowTint = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.35), 9);
  const heroLayerOne = toHsl(tone.hue, scaledSaturation(baseSaturation, 0.45), 13);
  const heroLayerTwo = toHsl(tone.secondaryHue, scaledSaturation(baseSaturation, 0.38), 16);
  const heroLayerThree = toHsl(tone.accentHue, scaledSaturation(baseSaturation, 0.36), 20);

  return {
    "--background": background,
    "--foreground": foreground,
    "--card": card,
    "--card-foreground": foreground,
    "--popover": card,
    "--popover-foreground": foreground,

    "--primary": primary,
    "--primary-foreground": "0 0% 100%",
    "--primary-glow": primaryGlow,

    "--secondary": secondary,
    "--secondary-foreground": toHsl(tone.secondaryHue, scaledSaturation(baseSaturation, 0.45), 12),

    "--accent": accent,
    "--accent-foreground": toHsl(tone.accentHue, scaledSaturation(baseSaturation, 0.46), 12),

    "--muted": muted,
    "--muted-foreground": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.16), 46),

    "--destructive": "0 72% 51%",
    "--destructive-foreground": "0 0% 100%",

    "--success": "152 55% 42%",
    "--success-foreground": "0 0% 100%",

    "--warning": "38 92% 50%",
    "--warning-foreground": "38 50% 15%",

    "--border": border,
    "--input": border,
    "--ring": primary,

    "--tabbar-bg": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.34), 90)})`,
    "--tabbar-wave": "hsl(var(--primary) / 0.16)",

    "--shadow-sm": `0 2px 8px -2px hsl(${shadowTint} / 0.09)`,
    "--shadow-md": `0 6px 20px -6px hsl(${shadowTint} / 0.14)`,
    "--shadow-lg": `0 12px 34px -10px hsl(${shadowTint} / 0.18)`,
    "--shadow-xl": `0 20px 50px -16px hsl(${shadowTint} / 0.24)`,
    "--shadow-glow": "0 8px 34px -10px hsl(var(--primary) / 0.32)",
    "--shadow-inner": `inset 0 1px 3px 0 hsl(${shadowTint} / 0.08)`,

    "--gradient-primary": `linear-gradient(135deg, hsl(${primary}), hsl(${primaryGlow}))`,
    "--gradient-secondary": `linear-gradient(135deg, hsl(${toHsl(tone.secondaryHue, clamp(baseSaturation - 8, 12, 96), 50)}), hsl(${toHsl(tone.secondaryHue + 10, clamp(baseSaturation - 4, 12, 96), 56)}))`,
    "--gradient-accent": `linear-gradient(135deg, hsl(${toHsl(tone.accentHue, clamp(baseSaturation - 8, 12, 96), 60)}), hsl(${toHsl(tone.accentHue + 10, clamp(baseSaturation - 2, 12, 96), 66)}))`,
    "--gradient-success": "linear-gradient(135deg, hsl(152 55% 42%), hsl(148 50% 46%))",
    "--gradient-background": `linear-gradient(180deg, hsl(${background}), hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.24), 96)}))`,
    "--gradient-card": `linear-gradient(145deg, hsl(${card}), hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.12), 98)}))`,

    "--sidebar-background": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.12), 97),
    "--sidebar-foreground": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.3), 25),
    "--sidebar-primary": toHsl(tone.hue, baseSaturation, 40),
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.18), 93),
    "--sidebar-accent-foreground": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.3), 16),
    "--sidebar-border": toHsl(tone.hue, scaledSaturation(baseSaturation, 0.1), 90),
    "--sidebar-ring": toHsl(tone.hue, baseSaturation, 44),

    "--showroom-hero-overlay": `linear-gradient(120deg, hsl(${heroLayerOne} / 0.95) 12%, hsl(${heroLayerTwo} / 0.9) 58%, hsl(${heroLayerThree} / 0.86) 100%)`,
    "--showroom-hero-glow": `radial-gradient(circle_at_50%_-18%, hsl(${primary} / 0.34), transparent 58%), radial-gradient(circle_at_85%_118%, hsl(${primaryGlow} / 0.18), transparent 56%)`,
    "--showroom-hero-shadow": `0 22px 45px -14px hsl(${shadowTint} / 0.34)`,
    "--showroom-hero-chip-bg": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.28), 24)} / 0.32)`,
    "--showroom-hero-chip-border": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.24), 72)} / 0.3)`,
    "--showroom-hero-text": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.08), 96)})`,
    "--showroom-hero-muted": `hsl(${toHsl(tone.hue, scaledSaturation(baseSaturation, 0.08), 82)})`,
    "--showroom-hero-highlight": "hsl(var(--primary))",
  };
}

export function resolveThemeMode(value: string | null | undefined): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function resolveThemeVariant(value: string | null | undefined): ThemeVariant {
  return isThemeVariant(value) ? value : DEFAULT_THEME_VARIANT;
}

export function readStoredThemeMode(): ThemeMode {
  return resolveThemeMode(storageAdapter.getItem(THEME_MODE_STORAGE_KEY));
}

export function readStoredThemeVariant(): ThemeVariant {
  return resolveThemeVariant(storageAdapter.getItem(THEME_VARIANT_STORAGE_KEY));
}

export function persistThemePreferences(mode: ThemeMode, variant: ThemeVariant): void {
  storageAdapter.setItem(THEME_MODE_STORAGE_KEY, mode);
  storageAdapter.setItem(THEME_VARIANT_STORAGE_KEY, variant);
}

export function applyThemeAppearance(mode: ThemeMode, variant: ThemeVariant): void {
  if (typeof document === "undefined") return;

  const resolvedMode = resolveThemeMode(mode);
  const resolvedVariant = resolveThemeVariant(variant);
  const root = document.documentElement;
  const tokens = buildThemeTokens(resolvedMode, resolvedVariant);

  Object.entries(tokens).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });

  root.classList.toggle("dark", resolvedMode === "dark");
  root.dataset.theme = resolvedVariant;
  root.style.colorScheme = resolvedMode;
}
