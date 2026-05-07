import type { AppLocale } from "@/constants/locale";
import type { MakeupCalendarPageModel } from "@/features/makeup/hooks/useMakeupCalendarPage";

export interface MakeupCalendarPageProps {
  locale: AppLocale;
}

export type MakeupCalendarViewModel = MakeupCalendarPageModel;
