export const SETTINGS_FEATURE_KEY = "settings";

export const SETTINGS_TABS = [
  { key: "general", segment: "general" },
  { key: "showroomPages", segment: "showroom-pages" },
  { key: "showrooms", segment: "showrooms" },
  { key: "users", segment: "users" },
  { key: "branches", segment: "branches" },
] as const;

export type SettingsTabKey = (typeof SETTINGS_TABS)[number]["key"];

export const SETTINGS_TAB_LABEL_KEYS: Record<SettingsTabKey, string> = {
  general: "settings.tabs.general",
  showroomPages: "settings.tabs.showroomPages",
  showrooms: "settings.tabs.showrooms",
  users: "settings.tabs.users",
  branches: "settings.tabs.branches",
};

export * from "./showroomTheme3DFields.constants";
export * from "./showroomThemeCharmFields.constants";
export * from "./showroomThemeModernFields.constants";
