"use client";

import { useEffect, useRef } from "react";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import type { AppLocale } from "@/constants/locale";
import type { MakeupProductBookingModel } from "@/features/makeup/hooks/useMakeupProductBooking";

interface MakeupBookingVoiceInputSectionProps {
  model: MakeupProductBookingModel;
  locale: AppLocale;
  onParsedSuccess?: () => void;
}

export function MakeupBookingVoiceInputSection({
  model,
  locale,
  onParsedSuccess,
}: MakeupBookingVoiceInputSectionProps) {
  const lastHandledParseAtRef = useRef(0);
  const isVoiceMode = model.activeInputMode === "VOICE";
  const autoParseHint =
    locale === "vi"
      ? "Voice sẽ tự phân tích khi bạn nói xong."
      : "Voice input will auto-parse when you finish speaking.";
  const isParsing = model.parseMutation.isPending;
  const isSubmitting = model.createMutation.isPending;

  useEffect(() => {
    if (!onParsedSuccess) return;
    if (!model.lastParseSuccessAt) return;
    if (model.activeInputMode !== "VOICE") return;
    if (model.lastParseSuccessAt === lastHandledParseAtRef.current) return;

    lastHandledParseAtRef.current = model.lastParseSuccessAt;
    onParsedSuccess();
  }, [model.activeInputMode, model.lastParseSuccessAt, onParsedSuccess]);

  const voiceStatus = (() => {
    if (model.voice.state === "listening") {
      return model.copy.modeVoice;
    }

    if (model.voice.state === "processing") {
      return model.copy.parseAction;
    }

    if (model.voice.state === "unsupported") {
      return model.copy.modeVoice;
    }

    if (model.voice.state === "error") {
      return model.voice.error?.message ?? model.copy.parseFailed;
    }

    return "";
  })();

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">{model.copy.title}</h2>
        <p className="text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
        {model.copy.inputGuide}
      </p>

      <div className="relative">
        <textarea
          rows={3}
          value={model.commandInput}
          placeholder={model.copy.inputPlaceholder}
          onChange={(event) => model.onCommandInputChange(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-12 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />

        <VoiceInputButton
          state={model.voice.state}
          onStart={model.onStartVoiceInput}
          onStop={model.onStopVoiceInput}
          disabled={isSubmitting || isParsing}
          locale={locale}
          className="absolute right-2 top-2"
        />
      </div>

      {model.voice.liveTranscript ? (
        <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          {model.voice.liveTranscript}
        </p>
      ) : null}

      {voiceStatus ? (
        <p className="text-xs text-muted-foreground">{voiceStatus}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!isVoiceMode ? (
          <button
            type="button"
            onClick={async () => {
              const parsed = await model.onParseInput();
              if (parsed) onParsedSuccess?.();
            }}
            disabled={!model.commandInput.trim() || isSubmitting || isParsing}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {model.copy.parseAction}
          </button>
        ) : (
          <p className="self-center text-xs text-muted-foreground">{autoParseHint}</p>
        )}

        <button
          type="button"
          onClick={model.onClearInput}
          disabled={!model.commandInput && !isParsing}
          className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {model.copy.clearAction}
        </button>
      </div>
    </section>
  );
}
