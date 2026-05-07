import { useCallback } from "react";
import { useVoiceDictation } from "@/lib/voice/useVoiceDictation";
import { cleanTranscript, extractAmountFromTranscript } from "@/lib/voice/voiceUtils";

type VoiceField = "amount" | "notes";

type Params = {
  audioLanguage: string;
  onAmount: (value: string) => void;
  onNotes: (value: string) => void;
  toast: (message: string, variant?: "info" | "error") => void;
  messages?: {
    unsupported?: string;
    ready?: string;
    denied?: string;
    noAmount?: string;
    noText?: string;
    captured?: string;
  };
};

export function useVoiceInput({ audioLanguage, onAmount, onNotes, toast, messages }: Params) {
  const handleResult = useCallback(
    (field: VoiceField, transcript: string) => {
      if (field === "amount") {
        const parsed = extractAmountFromTranscript(transcript, audioLanguage);
        if (parsed && parsed > 0) {
          onAmount(String(parsed));
          toast(messages?.captured ?? "Voice captured");
        } else {
          toast(messages?.noAmount ?? "Could not recognize amount", "error");
        }
        return;
      }
      const cleaned = cleanTranscript(transcript);
      if (!cleaned) {
        toast(messages?.noText ?? "Could not recognize text", "error");
        return;
      }
      onNotes(cleaned);
      toast(messages?.captured ?? "Voice captured");
    },
    [audioLanguage, messages, onAmount, onNotes, toast],
  );

  return useVoiceDictation({
    audioLanguage,
    onResult: handleResult,
    toast,
    messages: {
      unsupported: messages?.unsupported,
      ready: messages?.ready,
      denied: messages?.denied,
    },
  });
}
