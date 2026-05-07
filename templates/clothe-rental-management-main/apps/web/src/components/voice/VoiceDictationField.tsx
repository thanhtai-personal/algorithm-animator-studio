"use client";

import { useCallback, useEffect } from "react";
import type { AppLocale } from "@/constants/locale";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { useVoiceDictationPrimitive } from "@/components/voice/hooks/useVoiceDictationPrimitive";
import { cn } from "@/utils/className";

interface VoiceDictationFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  language: string;
  placeholder?: string;
  inputType?: "text" | "tel" | "number";
  fieldType?: "input" | "textarea";
  rows?: number;
  disabled?: boolean;
  active?: boolean;
  autoStop?: boolean;
  locale?: AppLocale;
  className?: string;
  onDictationResult?: (transcript: string) => void;
  labels?: {
    idleButton?: string;
    listeningButton?: string;
    processingButton?: string;
    errorButton?: string;
    unsupportedButton?: string;
    idleHint?: string;
    listeningHint?: string;
    processingHint?: string;
    unsupportedHint?: string;
    permissionDeniedHint?: string;
    errorHint?: string;
  };
}

export function VoiceDictationField({
  label,
  value,
  onValueChange,
  language,
  placeholder,
  inputType = "text",
  fieldType = "textarea",
  rows = 4,
  disabled,
  active = true,
  autoStop = true,
  locale = "vi",
  className,
  onDictationResult,
  labels,
}: VoiceDictationFieldProps) {
  const appendTranscript = useCallback(
    (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed) return;

      const nextValue = autoStop
        ? value
          ? `${value.trimEnd()} ${trimmed}`
          : trimmed
        : trimmed;
      onValueChange(nextValue);
      onDictationResult?.(trimmed);
    },
    [autoStop, onDictationResult, onValueChange, value]
  );

  const { state, error, liveTranscript, start, stop, abort, resetError } = useVoiceDictationPrimitive({
    language,
    disabled,
    autoStop,
    onResult: appendTranscript,
  });

  const trimmedLiveTranscript = liveTranscript.trim();
  const showLiveOverlay = state === "listening" && trimmedLiveTranscript.length > 0;
  const livePrefix = locale === "vi" ? "Đang nghe: " : "Listening: ";

  useEffect(() => {
    if (!active) {
      abort();
    }
  }, [abort, active]);

  const statusHint = (() => {
    if (state === "unsupported") {
      if (error?.code === "permission-denied") {
        return (
          labels?.permissionDeniedHint ??
          (locale === "vi" ? "Bạn đã từ chối quyền microphone." : "Microphone permission denied.")
        );
      }
      return (
        labels?.unsupportedHint ??
        (locale === "vi" ? "Trình duyệt chưa hỗ trợ nhập giọng nói." : "Voice input is not supported.")
      );
    }

    if (state === "listening") {
      return labels?.listeningHint ?? (locale === "vi" ? "Đang nghe..." : "Listening...");
    }

    if (state === "processing") {
      return (
        labels?.processingHint ??
        (locale === "vi" ? "Đang nhận kết quả giọng nói..." : "Processing transcript...")
      );
    }

    if (state === "error") {
      return (
        labels?.errorHint ??
        (error?.message ??
          (locale === "vi"
            ? "Nhập giọng nói bị lỗi, vui lòng thử lại."
            : "Voice input failed."))
      );
    }

    return labels?.idleHint ?? "";
  })();

  const buttonLabels = {
    idle: labels?.idleButton ?? (locale === "vi" ? "Bật ghi âm" : "Start voice"),
    listening: labels?.listeningButton ?? (locale === "vi" ? "Dừng" : "Stop"),
    processing: labels?.processingButton ?? (locale === "vi" ? "Đang xử lý..." : "Processing..."),
    error: labels?.errorButton ?? (locale === "vi" ? "Thử lại" : "Try again"),
    unsupported: labels?.unsupportedButton ?? (locale === "vi" ? "Không hỗ trợ" : "Unsupported"),
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>

      {fieldType === "input" ? (
        <div className="relative">
          <input
            type={inputType}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(event) => {
              resetError();
              onValueChange(event.target.value);
            }}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-12 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
          {showLiveOverlay ? (
            <div className="pointer-events-none absolute left-2 right-12 top-1/2 z-[1] -translate-y-1/2 truncate rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] text-primary">
              {livePrefix}
              {trimmedLiveTranscript}
            </div>
          ) : null}
          <VoiceInputButton
            state={state}
            onStart={() => {
              resetError();
              void start();
            }}
            onStop={stop}
            disabled={disabled}
            locale={locale}
            labels={buttonLabels}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          />
        </div>
      ) : (
        <div className="relative">
          <textarea
            rows={rows}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(event) => {
              resetError();
              onValueChange(event.target.value);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-12 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
          {showLiveOverlay ? (
            <div className="pointer-events-none absolute left-2 right-12 top-2 z-[1] max-h-16 overflow-hidden rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] leading-4 text-primary">
              {livePrefix}
              {trimmedLiveTranscript}
            </div>
          ) : null}
          <VoiceInputButton
            state={state}
            onStart={() => {
              resetError();
              void start();
            }}
            onStop={stop}
            disabled={disabled}
            locale={locale}
            labels={buttonLabels}
            className="absolute right-2 top-2"
          />
        </div>
      )}

      {statusHint ? (
        <p
          className={cn(
            "text-xs",
            state === "error" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {statusHint}
        </p>
      ) : null}
    </div>
  );
}
