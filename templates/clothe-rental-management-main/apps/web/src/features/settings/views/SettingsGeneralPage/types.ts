import type { AppLocale } from "@/constants/locale";
import type { useSettingsGeneralPage } from "@/features/settings/hooks/useSettingsGeneralPage";

export interface SettingsGeneralPageProps {
  locale: AppLocale;
}

export type SettingsGeneralPageState = ReturnType<typeof useSettingsGeneralPage>;
