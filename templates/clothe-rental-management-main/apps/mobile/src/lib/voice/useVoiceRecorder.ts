import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

export type VoiceErrorType = "denied" | "unsupported" | "error";

type UseVoiceRecorderParams = {
  audioLanguage?: string;
  onFinal?: (transcript: string) => void;
  onError?: (message: string, type: VoiceErrorType) => void;
  silenceTimeoutMs?: number;
  maxDurationMs?: number;
  enableSilenceStop?: boolean;
  enableMaxDuration?: boolean;
};

export function useVoiceRecorder({
  audioLanguage,
  onFinal,
  onError,
  silenceTimeoutMs = 1200,
  maxDurationMs = 8000,
  enableSilenceStop = true,
  enableMaxDuration = true,
}: UseVoiceRecorderParams = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef("");
  const lastTranscriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const abortRequestedRef = useRef(false);
  const hasFinalRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  const finalize = useCallback((text: string) => {
    if (hasFinalRef.current) return;
    const cleaned = text.trim();
    if (!cleaned) return;
    hasFinalRef.current = true;
    onFinalRef.current?.(cleaned);
  }, []);

  const scheduleNoResultCheck = useCallback(() => {
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
    }
    endTimerRef.current = setTimeout(() => {
      if (hasFinalRef.current) return;
      const latestTranscript = lastTranscriptRef.current || transcriptRef.current;
      if (latestTranscript.trim().length > 0) {
        if (isMountedRef.current) {
          setTranscript(latestTranscript);
        }
        finalize(latestTranscript);
        return;
      }
      if (isMountedRef.current) {
        setError("No speech detected");
      }
      onErrorRef.current?.("No speech detected", "error");
    }, 500);
  }, [finalize]);

  const stopListening = useCallback(
    async (reason: "manual" | "silence" | "max" = "manual") => {
      const latestTranscript = lastTranscriptRef.current || transcriptRef.current;
      if (latestTranscript && isMountedRef.current) {
        setTranscript(latestTranscript);
      }
      const hasTranscript = latestTranscript.trim().length > 0;
      clearTimers();
      isStartingRef.current = false;
      if (!hasTranscript) {
        scheduleNoResultCheck();
      }
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // ignore
      }
      isListeningRef.current = false;
      if (isMountedRef.current) {
        setIsListening(false);
      }
      finalize(latestTranscript);
    },
    [clearTimers, finalize, scheduleNoResultCheck],
  );

  const abortListening = useCallback(() => {
    clearTimers();
    isStartingRef.current = false;
    abortRequestedRef.current = true;
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // ignore
    }
    isListeningRef.current = false;
    if (isMountedRef.current) {
      setIsListening(false);
    }
  }, [clearTimers]);

  const scheduleSilenceStop = useCallback(() => {
    if (!enableSilenceStop) return;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      void stopListening("silence");
    }, silenceTimeoutMs);
  }, [enableSilenceStop, silenceTimeoutMs, stopListening]);

  const scheduleMaxStop = useCallback(() => {
    if (!enableMaxDuration) return;
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
    }
    maxTimerRef.current = setTimeout(() => {
      void stopListening("max");
    }, maxDurationMs);
  }, [enableMaxDuration, maxDurationMs, stopListening]);

  const setTranscriptValue = useCallback((value: string) => {
    const next = value ?? "";
    transcriptRef.current = next;
    lastTranscriptRef.current = next;
    if (isMountedRef.current) {
      setTranscript(next);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const startSubscription = ExpoSpeechRecognitionModule.addListener("start", () => {
      abortRequestedRef.current = false;
      isListeningRef.current = true;
      if (isMountedRef.current) {
        setIsListening(true);
      }
      scheduleMaxStop();
    });

    const endSubscription = ExpoSpeechRecognitionModule.addListener("end", () => {
      clearTimers();
      isListeningRef.current = false;
      if (isMountedRef.current) {
        setIsListening(false);
      }
      if (abortRequestedRef.current) {
        abortRequestedRef.current = false;
        return;
      }
      scheduleNoResultCheck();
    });

    const errorSubscription = ExpoSpeechRecognitionModule.addListener("error", (event) => {
      clearTimers();
      isListeningRef.current = false;
      if (isMountedRef.current) {
        setIsListening(false);
      }
      if (event?.error === "aborted") {
        return;
      }
      const mappedMessage =
        event?.error === "no-speech"
          ? "No speech detected"
          : event?.message || "Speech recognition error";
      if (isMountedRef.current) {
        setError(mappedMessage);
      }
      if (event?.error === "not-allowed") {
        onErrorRef.current?.(mappedMessage, "denied");
        return;
      }
      if (
        event?.error === "service-not-allowed" ||
        event?.error === "language-not-supported" ||
        event?.error === "audio-capture"
      ) {
        onErrorRef.current?.(mappedMessage, "unsupported");
        return;
      }
      onErrorRef.current?.(mappedMessage, "error");
    });

    const resultSubscription = ExpoSpeechRecognitionModule.addListener("result", (event) => {
      const values = event?.results ?? [];
      const text = values.reduce(
        (best, value) => (value?.transcript && value.transcript.length > best.length ? value.transcript : best),
        ""
      );
      if (!text) return;
      const current = transcriptRef.current || "";
      const next = text.length >= current.length ? text : current;
      lastTranscriptRef.current = next;
      transcriptRef.current = next;
      if (isMountedRef.current) {
        setTranscript(next);
      }
      if (event?.isFinal) {
        clearTimers();
        isListeningRef.current = false;
        if (isMountedRef.current) {
          setIsListening(false);
        }
        finalize(next);
        return;
      }
      scheduleSilenceStop();
    });

    return () => {
      isMountedRef.current = false;
      abortListening();
      startSubscription.remove();
      endSubscription.remove();
      errorSubscription.remove();
      resultSubscription.remove();
    };
  }, [abortListening, clearTimers, finalize, scheduleMaxStop, scheduleNoResultCheck, scheduleSilenceStop]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && isListeningRef.current) {
        abortListening();
      }
    });
    return () => subscription.remove();
  }, [abortListening]);

  const startListening = useCallback(async () => {
    if (isStartingRef.current || isListeningRef.current) return false;
    abortRequestedRef.current = false;
    isStartingRef.current = true;
    clearTimers();
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      isStartingRef.current = false;
      const unsupportedMessage = "Voice input is not supported on this device";
      if (isMountedRef.current) {
        setError(unsupportedMessage);
      }
      onErrorRef.current?.(unsupportedMessage, "unsupported");
      return false;
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      isStartingRef.current = false;
      if (isMountedRef.current) {
        setError("Microphone permission denied");
      }
      onErrorRef.current?.("Microphone permission denied", "denied");
      return false;
    }

    if (isMountedRef.current) {
      setError(null);
      setTranscript("");
    }
    transcriptRef.current = "";
    lastTranscriptRef.current = "";
    hasFinalRef.current = false;
    try {
      ExpoSpeechRecognitionModule.start({
        lang: audioLanguage || "vi-VN",
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: silenceTimeoutMs,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: silenceTimeoutMs,
        },
      });
      isListeningRef.current = true;
      if (isMountedRef.current) {
        setIsListening(true);
      }
      scheduleMaxStop();
      return true;
    } catch (err) {
      clearTimers();
      isListeningRef.current = false;
      const mappedMessage = err instanceof Error ? err.message : "Speech recognition error";
      if (isMountedRef.current) {
        setError(mappedMessage);
        setIsListening(false);
      }
      onErrorRef.current?.(mappedMessage, "unsupported");
      return false;
    } finally {
      isStartingRef.current = false;
    }
  }, [audioLanguage, clearTimers, scheduleMaxStop, silenceTimeoutMs]);

  const clearTranscript = useCallback(() => {
    clearTimers();
    setTranscriptValue("");
    hasFinalRef.current = false;
  }, [clearTimers, setTranscriptValue]);

  const cancelListening = useCallback(() => {
    abortListening();
    hasFinalRef.current = false;
  }, [abortListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
    setTranscript: setTranscriptValue,
  };
}
