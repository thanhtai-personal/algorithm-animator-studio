"use client";

import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_OPTIONS, type Language } from "@/lib/constants/i18n";
import { useI18n } from "@/lib/i18n";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { authStore } from "@/store/authStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { updateUserSettings } from "@/features/app-shell/services/user";

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();
  const currentOption = LANGUAGE_OPTIONS.find((option) => option.value === language);
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();

  const handleSelect = async (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    authStore.upsert({ language: nextLanguage });
    if (isAnonymous) {
      return;
    }
    if (!isOnline) {
      const id = authStore.userId || authStore.anonId || Math.random().toString(36).substring(2);
      offlineQueueStore.enqueue({
        id,
        entity: "settings",
        action: "update",
        payload: { updates: { language: nextLanguage } },
      });
      return;
    }
    try {
      const updated = await updateUserSettings({ language: nextLanguage });
      authStore.upsert(updated);
    } catch {
      // fallback to local update
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-xl px-2"
          aria-label={t("actions.toggleLanguage")}
        >
          <div className="flex items-center gap-1 text-xs font-semibold">
            <Globe className="w-4 h-4" />
            <span>{currentOption?.value.toUpperCase() ?? language.toUpperCase()}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => void handleSelect(option.value)}
            className="flex items-center justify-between"
          >
            <span className="text-sm">{t(option.labelKey)}</span>
            {language === option.value ? <Check className="h-4 w-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
