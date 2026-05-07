"use client";

import { useCallback, useRef, useState } from "react";

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

export function useVoiceDictation({ audioLanguage, onResult, toast, messages }: UseVoiceDictationParams) {
  const [isListening, setIsListening] = useState(false);
  const [listeningField, setListeningField] = useState<VoiceField | null>(null);
  const recognitionRef = useRef<any | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Prevent stale callbacks from toggling state after we switch fields
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
    }
    recognitionRef.current = null;
    setIsListening(false);
    setListeningField(null);
  }, []);

  const startListening = useCallback(
    (field: VoiceField) => {
      if (isListening && listeningField === field) {
        stopListening();
        return;
      }
      if (recognitionRef.current && listeningField !== field) {
        stopListening();
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast(messages?.unsupported ?? "Voice input is not supported in this browser", "error");
        return;
      }

      const recognition = new SpeechRecognition() as any;
      recognition.lang = audioLanguage;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListeningField(field);
        setIsListening(true);
        toast(messages?.ready ?? "Voice input ready", "info");
      };
      recognition.onend = () => {
        setIsListening(false);
        setListeningField(null);
        recognitionRef.current = null;
      };
      recognition.onerror = () => {
        setIsListening(false);
        setListeningField(null);
        recognitionRef.current = null;
      };
      recognition.onresult = (event: any) => {
        const transcript = String(event.results?.[0]?.[0]?.transcript ?? "");
        onResult(field, transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [audioLanguage, isListening, listeningField, onResult, stopListening, toast, messages],
  );

  return {
    isListening,
    listeningField,
    startListening,
    stopListening,
  };
}
