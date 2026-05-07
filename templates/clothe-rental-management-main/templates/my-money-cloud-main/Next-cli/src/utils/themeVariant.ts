import type { ThemeVariant } from "@/types/themeVariant";

export const isThemeVariant = (value?: string | null): value is ThemeVariant =>
  value === "sunset" ||
  value === "cosmic" ||
  value === "ocean" ||
  value === "forest" ||
  value === "rose" ||
  value === "midnight";
