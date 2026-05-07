import { useCallback, useRef, useState } from "react";
import type { VoiceCaptureAdapter } from "@/features/transactions/hooks/useVoiceTransactionFlow";

interface StartOptions {
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (message?: string) => void;
}

export function useVoiceCaptureWeb(lang: string): VoiceCaptureAdapter {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Mic permission denied or failed:", error);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setLiveTranscript("");
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setLiveTranscript("");
  }, []);

  const start = useCallback(
    ({ onPartial, onFinal, onError }: StartOptions) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        onError?.("Speech recognition is not supported on this browser");
        return;
      }

      if (isListening) return;

      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        recognitionRef.current = null;
        onError?.(event?.message || "Voice recognition error");
      };

      recognition.onresult = (event: any) => {
        const combinedTranscript = Array.from(event.results ?? [])
          .map((result: any) => result?.[0]?.transcript ?? "")
          .join(" ")
          .trim();

        onPartial?.(combinedTranscript);
        const isFinal = event.results?.[event.resultIndex]?.isFinal;
        if (isFinal) {
          onFinal(combinedTranscript);
        }
      };

      recognition.start();
    },
    [isListening, lang]
  );

  return {
    isListening,
    liveTranscript,
    requestPermission,
    start,
    stop,
    reset,
  };
}
