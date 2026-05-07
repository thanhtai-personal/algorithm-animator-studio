"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { authStore } from "@/store/authStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { updateUserSettings } from "@/features/app-shell/services/user";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();
  const isDark = resolvedTheme === "dark";

  const handleToggle = async () => {
    const nextMode = isDark ? "light" : "dark";
    setTheme(nextMode);
    if (isAnonymous) {
      authStore.upsert({ theme_mode: nextMode });
      return;
    }
    if (!isOnline) {
      authStore.upsert({ theme_mode: nextMode });
      const id = authStore.userId || authStore.anonId || Math.random().toString(36).substring(2);
      offlineQueueStore.enqueue({
        id,
        entity: "settings",
        action: "update",
        payload: { updates: { theme_mode: nextMode } },
      });
      return;
    }
    authStore.upsert({ theme_mode: nextMode });
    try {
      const updated = await updateUserSettings({ theme_mode: nextMode });
      authStore.upsert(updated);
    } catch {
      // fallback to local update
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-xl"
      aria-label={t("actions.toggleTheme")}
      onClick={handleToggle}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
}
