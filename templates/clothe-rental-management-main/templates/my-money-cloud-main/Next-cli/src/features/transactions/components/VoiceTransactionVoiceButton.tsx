import { Mic } from "lucide-react";
import { cn } from "@/utils";

interface VoiceButtonProps {
  isListening: boolean;
  onPress: () => void;
  onRelease: () => void;
  label?: string;
  idleLabel?: string;
}

export function VoiceTransactionVoiceButton({
  isListening,
  onPress,
  onRelease,
  label,
  idleLabel,
}: VoiceButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => (isListening ? onRelease() : onPress())}
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center transition-all",
          "border-2",
          isListening
            ? "bg-primary border-primary text-white animate-pulse"
            : "bg-card border-border hover:border-primary hover:bg-primary/5"
        )}
      >
        <Mic className={cn("h-8 w-8", isListening ? "text-white" : "text-primary")} />
        {isListening && <span className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" />}
      </button>
      <p className="text-sm text-muted-foreground">
        {isListening ? label : idleLabel}
      </p>
    </div>
  );
}
