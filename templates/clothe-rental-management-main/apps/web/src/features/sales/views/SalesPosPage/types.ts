import type { AppLocale } from "@/constants/locale";
import type { useSalesPosPage } from "@/features/sales/hooks/useSalesPosPage";

export interface SalesPosPageProps {
  locale: AppLocale;
  forcedBranch?: {
    branchId: string;
    branchCode: string;
    branchName: string;
    branchSlug: string;
  } | null;
}

export type SalesPosPageModel = ReturnType<typeof useSalesPosPage>;
