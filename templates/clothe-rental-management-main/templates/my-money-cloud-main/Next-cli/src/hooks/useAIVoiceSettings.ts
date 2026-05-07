"use client";

import { useCallback } from "react";
import { authStore } from "@/store/authStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { updateUserSettings } from "@/features/app-shell/services/user";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";

/**
 * useAIVoiceSettings - Pure observer hook
 * Reads AI settings from authStore.userSettings (already fetched in AuthProvider)
 * NO separate fetching to avoid duplicate requests
 */
export function useAIVoiceSettings() {

  // Read directly from authStore (reactive via MobX)

  const settings = authStore.userSettings;
  // const loading = authStore.settingsLoading; // Not available in AuthStore
  const ignoreVoiceVerify = settings?.ignore_voice_verify ?? false;
  const useAI = settings?.use_ai ?? true;
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();

  // Helper for updating AI settings
  const updateAISetting = async (updates: Partial<import("@/types/userSettings").UserSettings>) => {
    if (isAnonymous || !isOnline) {
      authStore.upsert(updates);
    }
    if (isOnline) {
      try {
        const updated = await updateUserSettings(updates);
        authStore.upsert(updated);
      } catch {
        // Optionally handle error
      }
    } else if (!isAnonymous) {
      offlineQueueStore.enqueue({
        id: Math.random().toString(36).substring(2),
        entity: "settings",
        action: "update",
        payload: { updates },
      });
    }
  };

  const setIgnoreVerify = useCallback(
    async (value: boolean) => {
      await updateAISetting({ ignore_voice_verify: value });
    },
    [isAnonymous, isOnline]
  );

  const setUseAI = useCallback(
    async (value: boolean) => {
      await updateAISetting({ use_ai: value });
    },
    [isAnonymous, isOnline]
  );

  return {
    ignoreVoiceVerify,
    useAI,
    setIgnoreVerify,
    setUseAI,
  };
}
