

import { DEFAULT_THEME_VARIANT, THEME_VARIANTS } from "@/constants/themeVariant";
import type { ThemeVariant } from "@/types/themeVariant";
import { authStore } from "@/store/authStore";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { isThemeVariant } from "@/utils/themeVariant";
import { updateUserSettings } from "@/features/app-shell/services/user";

export function useThemeVariant() {
  // Lấy theme variant từ authStore.userSettings
  const storedVariant = authStore.userSettings?.theme_variant;
  const variant = isThemeVariant(storedVariant) ? storedVariant : DEFAULT_THEME_VARIANT;
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();

  const setVariant = async (nextVariant: ThemeVariant) => {
    if (isAnonymous) {
      authStore.upsert({ theme_variant: nextVariant });
      return;
    }
    if (!isOnline) {
      authStore.upsert({ theme_variant: nextVariant });
      const id = authStore.userId || authStore.anonId || Math.random().toString(36).substring(2);
      offlineQueueStore.enqueue({
        id,
        entity: "settings",
        action: "update",
        payload: { updates: { theme_variant: nextVariant } },
      });
      return;
    }
    authStore.upsert({ theme_variant: nextVariant });
    try {
      const updated = await updateUserSettings({ theme_variant: nextVariant });
      authStore.upsert(updated);
    } catch {
      // fallback to local update
    }
  };
  return {
    variant,
    setVariant,
    options: THEME_VARIANTS,
  };
}

// Re-export variants for consumers that need the option list
export { THEME_VARIANTS };
export type { ThemeVariant };
