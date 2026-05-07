"use client";

import { Mic, MicOff } from "lucide-react";
import { cn } from "@/utils";
import { useI18n } from "@/lib/i18n";

interface VoiceButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  isListening,
  onToggle,
  disabled,
}: VoiceButtonProps) {
  const { t } = useI18n();

  return (
    <button
      className={cn(
        "w-full group relative flex flex-col items-center justify-center gap-4 rounded-3xl",
        "p-6 transition-all duration-300",
        "bg-transparent",
        "text-foreground dark:text-white",
        "border border-primary/15 dark:border-primary/25 shadow-lg active:scale-95",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer"
      )}
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.85), hsl(var(--secondary, var(--primary)) / 0.92))",
      }}
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      aria-label={isListening ? t("voice.listening") || "Đang ghi âm..." : t("voice.tapToSpeak")}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-foreground/15 transition-all">
        {isListening ? (
          <Mic className="h-8 w-8 text-red-500" />
        ) : (
          <MicOff className="h-8 w-8 text-primary-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="font-bold text-primary-foreground text-lg">
          {isListening ? (t("voice.listening") || "Đang ghi âm...") : (t("voice.tapToSpeak"))}
        </p>
        <p className="text-xs text-primary-foreground/80 mt-1">
          {t("voice.example")}
        </p>
      </div>
    </button>
  );
}
