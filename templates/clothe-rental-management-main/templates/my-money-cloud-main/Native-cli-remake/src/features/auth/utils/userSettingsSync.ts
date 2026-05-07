import type { UserSettings } from "@/types/userSettings";
import { DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";

export function buildSettingsUpdates(settings: UserSettings | null): Partial<UserSettings> {
  const updates: Partial<UserSettings> = {};
  if (settings?.currency) updates.currency = settings.currency;
  if (settings?.language) updates.language = settings.language;
  if (settings?.theme_mode) updates.theme_mode = settings.theme_mode;
  if (settings?.theme_variant) updates.theme_variant = settings.theme_variant;
  if (settings?.background_type) updates.background_type = settings.background_type;
  if (settings?.background_value) updates.background_value = settings.background_value;
  if (typeof settings?.ai_trial_used === "boolean") updates.ai_trial_used = settings.ai_trial_used;
  if (typeof settings?.ai_requests_remaining === "number") updates.ai_requests_remaining = settings.ai_requests_remaining;
  if (typeof settings?.ignore_voice_verify === "boolean") updates.ignore_voice_verify = settings.ignore_voice_verify;
  if (typeof settings?.use_ai === "boolean") updates.use_ai = settings.use_ai;
  if (typeof settings?.pro_mode === "boolean") updates.pro_mode = settings.pro_mode;
  return updates;
}

export function mergeUserSettings(
  userId: string,
  localSettings: UserSettings | null,
  remoteSettings: UserSettings | null
): UserSettings {
  return {
    ...(localSettings ?? {}),
    ...(remoteSettings ?? {}),
    currency: remoteSettings?.currency ?? localSettings?.currency ?? null,
    theme_variant: remoteSettings?.theme_variant ?? localSettings?.theme_variant ?? DEFAULT_THEME_VARIANT,
    ai_trial_used: remoteSettings?.ai_trial_used ?? localSettings?.ai_trial_used ?? false,
    ai_requests_remaining: remoteSettings?.ai_requests_remaining ?? localSettings?.ai_requests_remaining ?? 0,
    use_ai: remoteSettings?.use_ai ?? localSettings?.use_ai ?? true,
    user_id: userId,
  } as UserSettings;
}
