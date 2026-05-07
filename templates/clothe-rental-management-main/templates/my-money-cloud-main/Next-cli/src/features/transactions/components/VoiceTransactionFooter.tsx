import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/utils";
import type { VoiceTransactionStep } from "@/features/transactions/hooks/useVoiceTransactionFlow";

interface DrawerFooterProps {
  step: VoiceTransactionStep;
  isSubmitting: boolean;
  transactionType: "income" | "expense";
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  t: (key: string) => string | undefined;
}

export function VoiceTransactionFooter({
  step,
  isSubmitting,
  transactionType,
  onNext,
  onPrevious,
  onSubmit,
  t,
}: DrawerFooterProps) {
  return (
    <div className="relative z-10 flex gap-3 px-5 pb-5 pt-3 bg-background/90 backdrop-blur border-t">
      {step !== "type" && (
        <Button variant="outline" onClick={onPrevious} size="lg">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("common.back")}
        </Button>
      )}

      {step !== "review" ? (
        <Button onClick={onNext} className="flex-1" size="lg">
          {t("common.next")}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={cn(
            "flex-1",
            transactionType === "income" ? "bg-green-500 hover:bg-green-600" : ""
          )}
          size="lg"
        >
          <Check className="h-4 w-4 mr-1" />
          {isSubmitting ? t("common.loading") : t("common.done")}
        </Button>
      )}
    </div>
  );
}
