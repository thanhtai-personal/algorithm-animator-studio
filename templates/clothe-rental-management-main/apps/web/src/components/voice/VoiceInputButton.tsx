"use client";

import { Loader2, Mic, MicOff } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import type { VoiceDictationState } from "@/types/voiceDictation";
import { cn } from "@/utils/className";

interface VoiceInputButtonProps {
  state: VoiceDictationState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  labels?: Partial<Record<VoiceDictationState, string>>;
  locale?: AppLocale;
  className?: string;
}

const DEFAULT_LABELS: Record<AppLocale, Record<VoiceDictationState, string>> = {
  vi: {
    idle: "Bật ghi âm",
    listening: "Dừng",
    processing: "Đang xử lý...",
    error: "Thử lại",
    unsupported: "Không hỗ trợ",
  },
  en: {
    idle: "Start voice",
    listening: "Stop",
    processing: "Processing...",
    error: "Try again",
    unsupported: "Unsupported",
  },
};

export function VoiceInputButton({
  state,
  onStart,
  onStop,
  disabled,
  labels,
  locale = "vi",
  className,
}: VoiceInputButtonProps) {
  const mergedLabels = {
    ...DEFAULT_LABELS[locale],
    ...labels,
  };

  const isListening = state === "listening";
  const isBusy = state === "processing";
  const isUnsupported = state === "unsupported";
  const isError = state === "error";
  const buttonLabel = mergedLabels[state];

  const icon = (() => {
    if (state === "processing") {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (isListening) {
      return <MicOff className="h-4 w-4" />;
    }

    return <Mic className="h-4 w-4" />;
  })();

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={disabled || isBusy || isUnsupported}
      aria-pressed={isListening}
      aria-label={buttonLabel}
      title={buttonLabel}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
        isListening
          ? "border-destructive bg-destructive/10 text-destructive"
          : isError
            ? "border-destructive/60 bg-destructive/5 text-destructive"
            : "border-border bg-background text-muted-foreground hover:text-foreground",
        (disabled || isBusy || isUnsupported) && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {icon}
    </button>
  );
}
