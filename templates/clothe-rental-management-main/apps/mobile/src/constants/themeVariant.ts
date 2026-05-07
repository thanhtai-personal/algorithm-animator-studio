import type { ThemeVariant } from "@/types/themeVariant";

export const THEME_VARIANTS: readonly {
  id: ThemeVariant;
  labelKey: string;
  descriptionKey: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    nav: string;
  };
}[] = [
  {
    id: "cosmic",
    labelKey: "theme.cosmicPurple",
    descriptionKey: "theme.cosmicPurpleDesc",
    preview: {
      primary: "hsl(270 80% 65%)",
      secondary: "hsl(200 80% 55%)",
      accent: "hsl(330 85% 70%)",
      nav: "hsl(258 60% 88%)",
    },
  },
  {
    id: "ocean",
    labelKey: "theme.oceanBlue",
    descriptionKey: "theme.oceanBlueDesc",
    preview: {
      primary: "hsl(200 85% 55%)",
      secondary: "hsl(185 70% 50%)",
      accent: "hsl(210 90% 60%)",
      nav: "hsl(200 70% 90%)",
    },
  },
  {
    id: "forest",
    labelKey: "theme.forestGreen",
    descriptionKey: "theme.forestGreenDesc",
    preview: {
      primary: "hsl(140 55% 45%)",
      secondary: "hsl(110 45% 40%)",
      accent: "hsl(80 60% 55%)",
      nav: "hsl(130 45% 90%)",
    },
  },
  {
    id: "sunset",
    labelKey: "theme.sunsetOrange",
    descriptionKey: "theme.sunsetOrangeDesc",
    preview: {
      primary: "hsl(4 85% 70%)",
      secondary: "hsl(171 55% 55%)",
      accent: "hsl(48 100% 70%)",
      nav: "hsl(18 80% 92%)",
    },
  },
  {
    id: "rose",
    labelKey: "theme.rosePink",
    descriptionKey: "theme.rosePinkDesc",
    preview: {
      primary: "hsl(330 80% 70%)",
      secondary: "hsl(340 70% 60%)",
      accent: "hsl(20 90% 75%)",
      nav: "hsl(340 75% 92%)",
    },
  },
  {
    id: "midnight",
    labelKey: "theme.midnightBlue",
    descriptionKey: "theme.midnightBlueDesc",
    preview: {
      primary: "hsl(220 70% 60%)",
      secondary: "hsl(260 60% 60%)",
      accent: "hsl(200 80% 60%)",
      nav: "hsl(220 35% 18%)",
    },
  },
];

export const THEME_VARIANT_STORAGE_KEY = "spendsmart:theme-variant";
export const DEFAULT_THEME_VARIANT: ThemeVariant = "sunset";
