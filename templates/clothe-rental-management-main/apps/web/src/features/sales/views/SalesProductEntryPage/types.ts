import type { AppLocale } from "@/constants/locale";
import type { useSalesProductEntryPage } from "@/features/sales/hooks/useSalesProductEntryPage";

export interface SalesProductEntryPageProps {
  locale: AppLocale;
}

export type SalesProductEntryPageModel = ReturnType<typeof useSalesProductEntryPage>;
