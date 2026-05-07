import type { AppLocale } from "@/constants/locale";
import type { useReturnOrderModal } from "@/features/orders/hooks/useReturnOrderModal";

export interface ReturnOrderModalProps {
  locale: AppLocale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type ReturnOrderModalModel = ReturnType<typeof useReturnOrderModal>;
