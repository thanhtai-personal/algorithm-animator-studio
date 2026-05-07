
import type { ThemeVariant } from "@/types/themeVariant";
import { SUPPORTED_THEME_VARIANTS } from "../constants";

export function normalizeTheme(value?: string | null): "light" | "dark" | null {
  if (value === "light" || value === "dark") return value;
  return null;
}

export function normalizeThemeVariant(
  value?: string | null,
  allowed: readonly ThemeVariant[] = SUPPORTED_THEME_VARIANTS,
): ThemeVariant | null {
  if (!value) return null;
  return allowed.includes(value as ThemeVariant) ? (value as ThemeVariant) : null;
}