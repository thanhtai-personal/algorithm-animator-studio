import { Loader2, Mic, MicOff } from "lucide-react";
import type { VoiceDictationState } from "@/lib/voice/types";

interface VoiceInputButtonProps {
  state: VoiceDictationState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

const LABELS: Record<VoiceDictationState, string> = {
  idle: "Bật ghi âm",
  listening: "Dừng ghi âm",
  processing: "Đang xử lý...",
  error: "Thử lại",
  unsupported: "Không hỗ trợ",
};

export function VoiceInputButton({
  state,
  onStart,
  onStop,
  disabled,
  className,
}: VoiceInputButtonProps) {
  const isListening = state === "listening";
  const isBusy = state === "processing";
  const isUnsupported = state === "unsupported";
  const isError = state === "error";
  const label = LABELS[state];

  const icon = (() => {
    if (state === "processing") {
      return <Loader2 className="icon spin" />;
    }

    if (isListening) {
      return <MicOff className="icon" />;
    }

    return <Mic className="icon" />;
  })();

  const classes = [
    "voice-icon-button",
    isListening ? "is-listening" : "",
    isError ? "is-error" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={disabled || isBusy || isUnsupported}
      aria-pressed={isListening}
      aria-label={label}
      title={label}
      className={classes}
    >
      {icon}
    </button>
  );
}
