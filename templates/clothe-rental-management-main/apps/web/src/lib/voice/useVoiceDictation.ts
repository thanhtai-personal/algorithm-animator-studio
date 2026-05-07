"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceDictationPrimitive } from "@/components/voice/hooks/useVoiceDictationPrimitive";

type VoiceField = "amount" | "notes";

type UseVoiceDictationParams = {
  audioLanguage: string;
  onResult: (field: VoiceField, transcript: string) => void;
  toast: (message: string, variant?: "info" | "error") => void;
  messages?: {
    unsupported?: string;
    ready?: string;
  };
};

export function useVoiceDictation({
  audioLanguage,
  onResult,
  toast,
  messages,
}: UseVoiceDictationParams) {
  const [listeningField, setListeningField] = useState<VoiceField | null>(null);
  const listeningFieldRef = useRef<VoiceField | null>(null);

  useEffect(() => {
    listeningFieldRef.current = listeningField;
  }, [listeningField]);

  const { state, start, stop, abort } = useVoiceDictationPrimitive({
    language: audioLanguage,
    autoStop: true,
    onResult: (transcript) => {
      const activeField = listeningFieldRef.current;
      if (!activeField) return;
      onResult(activeField, transcript);
    },
    onError: (error) => {
      if (error.code === "permission-denied" || error.code === "insecure-context") {
        toast(messages?.unsupported ?? "Voice input is not supported in this browser", "error");
        return;
      }

      toast(error.message, "error");
    },
  });

  const stopListening = useCallback(() => {
    setListeningField(null);
    stop();
  }, [stop]);

  const startListening = useCallback(
    (field: VoiceField) => {
      if (state === "listening" && listeningFieldRef.current === field) {
        stopListening();
        return;
      }

      if (state === "listening" && listeningFieldRef.current !== field) {
        abort();
      }

      setListeningField(field);
      toast(messages?.ready ?? "Voice input ready", "info");
      void start();
    },
    [abort, messages, start, state, stopListening, toast]
  );

  const effectiveListeningField =
    state === "listening" || state === "processing" ? listeningField : null;

  return {
    isListening: state === "listening",
    listeningField: effectiveListeningField,
    startListening,
    stopListening,
  };
}
