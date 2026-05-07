import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceRecorder, type VoiceErrorType } from "@/lib/voice/useVoiceRecorder";

type VoiceField = "amount" | "notes";

type UseVoiceDictationParams = {
  audioLanguage: string;
  onResult: (field: VoiceField, transcript: string) => void;
  toast: (message: string, variant?: "info" | "error") => void;
  messages?: {
    unsupported?: string;
    ready?: string;
    denied?: string;
  };
};

export function useVoiceDictation({ audioLanguage, onResult, toast, messages }: UseVoiceDictationParams) {
  const [listeningField, setListeningField] = useState<VoiceField | null>(null);
  const activeFieldRef = useRef<VoiceField | null>(null);
  const onResultRef = useRef(onResult);
  const toastRef = useRef(toast);
  const messagesRef = useRef(messages);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleFinal = useCallback((text: string) => {
    const field = activeFieldRef.current;
    if (!field) return;
    onResultRef.current(field, text);
  }, []);

  const handleError = useCallback(
    (message: string, type: VoiceErrorType) => {
      if (type === "denied") {
        toastRef.current(messagesRef.current?.denied ?? "Microphone permission denied", "error");
        return;
      }
      if (type === "unsupported") {
        toastRef.current(messagesRef.current?.unsupported ?? "Voice input is not supported on this device", "error");
        return;
      }
      toastRef.current(message, "error");
    },
    [],
  );

  const {
    isListening,
    transcript,
    startListening: startRecorder,
    stopListening: stopRecorder,
    clearTranscript,
    setTranscript,
  } = useVoiceRecorder({
    audioLanguage,
    onFinal: handleFinal,
    onError: handleError,
  });

  const startListening = useCallback(
    async (field: VoiceField) => {
      if (isListening && listeningField === field) {
        await stopRecorder();
        return;
      }
      if (isListening && listeningField !== field) {
        await stopRecorder();
      }
      activeFieldRef.current = field;
      setListeningField(field);
      clearTranscript();
      const started = await startRecorder();
      if (started) {
        toastRef.current(messagesRef.current?.ready ?? "Listening...", "info");
      }
    },
    [clearTranscript, isListening, listeningField, startRecorder, stopRecorder],
  );

  const stopListening = useCallback(async () => {
    await stopRecorder();
  }, [stopRecorder]);

  return {
    isListening,
    listeningField,
    transcript,
    setTranscript,
    startListening,
    stopListening,
  };
}
