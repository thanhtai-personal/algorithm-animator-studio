"use client";

import { Mic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils";
import { useI18n } from "@/lib/i18n";
import { useVoiceDictation } from "@/lib/voice/useVoiceDictation";
import { cleanTranscript } from "@/lib/voice/voiceUtils";
import { toast as notify } from "sonner";
import { useEffect, useRef } from "react";

type NotesStepProps = {
  notes: string;
  onChangeNotes: (value: string) => void;
};

export function NotesStep({ notes, onChangeNotes }: NotesStepProps) {
  const { t, audioLanguage } = useI18n();

  const { isListening, listeningField, startListening, stopListening } = useVoiceDictation({
    audioLanguage,
    onResult: (_, transcript) => {
      const cleaned = cleanTranscript(transcript);
      if (!cleaned) {
        notify.error(t("toast.voiceNoText"));
        return;
      }
      onChangeNotes(cleaned);
      notify.success(t("toast.voiceCaptured"));
    },
    toast: (message: string, variant?: "info" | "error") => {
      if (variant === "error") notify.error(message);
      else notify(message);
    },
    messages: {
      unsupported: t("toast.voiceUnsupported"),
      ready: t("toast.voiceReady"),
    },
  });

  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;
    startListening("notes");
  }, [startListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          {t("common.descriptionOptional")}
        </label>
        <Textarea
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder={t("common.descriptionPlaceholder")}
          className="rounded-lg min-h-[100px] resize-none"
        />
      </div>

      <button
        onClick={() => startListening("notes")}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
          "bg-primary text-white font-semibold transition-all",
          "hover:bg-primary/90 active:scale-95",
          isListening && listeningField === "notes" ? "animate-pulse" : "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        <Mic className="h-5 w-5" />
        {isListening && listeningField === "notes" ? t("common.stop") || "Dừng" : t("addTransaction.voiceInput")}
      </button>
    </div>
  );
}
