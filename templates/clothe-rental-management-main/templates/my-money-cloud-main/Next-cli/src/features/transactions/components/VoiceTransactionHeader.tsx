import { DrawerClose, DrawerTitle } from "@/components/ui/drawer";
import { ChevronLeft, X } from "lucide-react";
import type { VoiceTransactionStep } from "@/features/transactions/hooks/useVoiceTransactionFlow";

interface DrawerHeaderProps {
  step: VoiceTransactionStep;
  getStepNumber: () => number;
  getStepTitle: () => string | undefined;
  onBack: () => void;
}

export function VoiceTransactionHeader({ step, getStepNumber, getStepTitle, onBack }: DrawerHeaderProps) {
  return (
    <div className="sticky top-0 z-20 px-5 pt-5 pb-4 bg-background/90 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10">
          {step !== "type" && (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">
            {getStepNumber()}/5
          </span>
          <DrawerTitle className="text-lg font-bold">
            {getStepTitle()}
          </DrawerTitle>
        </div>
        <DrawerClose asChild>
          <button className="flex items-center justify-center w-10 h-10 rounded-full border border-border/60 text-muted-foreground transition hover:text-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </DrawerClose>
      </div>

      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${(getStepNumber() / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}
