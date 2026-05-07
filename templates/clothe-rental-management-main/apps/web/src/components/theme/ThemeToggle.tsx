"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useThemeMode } from "@/lib/themeVariants";

export function ThemeToggle() {
  const { t } = useI18n();
  const { mode, toggleMode } = useThemeMode();
  const label = t("actions.toggleTheme");

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleMode}
      className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {mode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

