import type { UserSettings } from "@/types/userSettings";

export const LEGACY_OFFLINE_SETTINGS_KEY = "spendsmart:offline-settings";
export const LEGACY_OFFLINE_SETTINGS_KEY_2 = "spendsmartoffline-settings";

export const settingsCacheKey = (userId: string) => `spendsmart:user-settings:${userId}`;

export const defaultUserSettings: UserSettings = {
  user_id: undefined,
  currency: null,
  theme: "light",
  theme_mode: "light",
  theme_variant: null,
  language: "en",
  background_type: "default",
  background_value: null,
  pro_mode: true,
  ai_trial_used: false,
  ai_requests_remaining: 0,
  ignore_voice_verify: false,
  screen_lock_enabled: false,
  screen_lock_method: null,
  screen_lock_pin_hash: null,
};
