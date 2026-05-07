import type { User } from "@supabase/supabase-js";
import { readStoredThemeMode, readStoredThemeVariant, resolveThemeMode, resolveThemeVariant } from "@/lib/themePreferences";
import type { UserSettings } from "@/types/userSettings";

export function buildAuthUserSettings(user: User, fallback: UserSettings | null): UserSettings {
  const modeFromFallback = fallback?.theme_mode ? resolveThemeMode(fallback.theme_mode) : null;
  const variantFromFallback = fallback?.theme_variant
    ? resolveThemeVariant(fallback.theme_variant)
    : null;
  const resolvedMode = modeFromFallback ?? readStoredThemeMode();
  const resolvedVariant = variantFromFallback ?? readStoredThemeVariant();

  return {
    currency: fallback?.currency ?? null,
    ...fallback,
    theme_mode: resolvedMode,
    theme: fallback?.theme ? resolveThemeMode(fallback.theme) : resolvedMode,
    theme_variant: resolvedVariant,
    displayName: user.user_metadata?.display_name ?? fallback?.displayName ?? null,
    email: user.email ?? fallback?.email ?? null,
    phone: user.phone ?? fallback?.phone ?? null,
    provider: user.app_metadata?.provider ?? fallback?.provider ?? null,
    providerType: user.app_metadata?.provider_type ?? fallback?.providerType ?? null,
    role:
      typeof user.app_metadata?.role === "string"
        ? user.app_metadata.role
        : fallback?.role ?? null,
  };
}

export function createAnonymousSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}
