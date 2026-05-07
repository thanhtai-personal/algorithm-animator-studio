import { useCallback, useEffect, useRef, useState } from "react";
import type {
  VoiceDictationError,
  VoiceDictationErrorCode,
  VoiceDictationState,
} from "@/lib/voice/types";
import {
  requestVoiceTranscription,
  VoiceTranscriptionClientError,
} from "@/lib/voice/voiceTranscriptionClient";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type MediaRecorderConstructor = typeof MediaRecorder;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type WindowWithMediaRecorder = Window & {
  MediaRecorder?: MediaRecorderConstructor;
};

interface MediaRecorderErrorEventLike extends Event {
  readonly error?: DOMException;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const browserWindow = window as WindowWithSpeechRecognition;
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

function getMediaRecorderConstructor(): MediaRecorderConstructor | null {
  if (typeof window === "undefined") return null;

  const browserWindow = window as WindowWithMediaRecorder;
  return browserWindow.MediaRecorder ?? null;
}

function supportsAudioCapture(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  return Boolean(getMediaRecorderConstructor());
}

function shouldPreferAudioCapture(): boolean {
  // kata-rental-order uses local browser recognition only.
  // Do not fallback to remote transcription API.
  return false;
}

function selectPreferredMimeType(): string | undefined {
  const MediaRecorderApi = getMediaRecorderConstructor();
  if (!MediaRecorderApi) return undefined;

  const preferredTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];

  if (typeof MediaRecorderApi.isTypeSupported !== "function") {
    return preferredTypes[0];
  }

  return preferredTypes.find((candidate) => MediaRecorderApi.isTypeSupported(candidate));
}

function mapVoiceError(errorCode: string): VoiceDictationError {
  const normalized = errorCode.toLowerCase();

  const errorMap: Record<string, VoiceDictationError> = {
    "audio-capture": {
      code: "audio-capture",
      message: "Audio capture failed.",
    },
    network: {
      code: "network",
      message: "Network error while transcribing.",
    },
    "no-speech": {
      code: "no-speech",
      message: "No speech detected.",
    },
    aborted: {
      code: "aborted",
      message: "Voice capture was aborted.",
    },
    "not-allowed": {
      code: "permission-denied",
      message: "Microphone permission denied.",
    },
    "service-not-allowed": {
      code: "permission-denied",
      message: "Microphone access is not allowed in this browser context.",
    },
    "insecure-context": {
      code: "insecure-context",
      message: "Voice input requires a secure context.",
    },
    "transcription-unavailable": {
      code: "transcription-unavailable",
      message: "Voice transcription is not available.",
    },
  };

  return (
    errorMap[normalized] ?? {
      code: "unknown",
      message: "Unknown voice recognition error.",
    }
  );
}

function detachRecognitionHandlers(recognition: SpeechRecognitionLike): void {
  recognition.onstart = null;
  recognition.onend = null;
  recognition.onerror = null;
  recognition.onresult = null;
}

function mapStartFailure(error: unknown): VoiceDictationError {
  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: string }).name ?? "").toLowerCase()
      : "";

  if (
    name.includes("notallowed") ||
    normalizedMessage.includes("notallowed") ||
    normalizedMessage.includes("permission")
  ) {
    return {
      code: "permission-denied",
      message: "Microphone permission denied.",
    };
  }

  if (
    name.includes("security") ||
    normalizedMessage.includes("secure context") ||
    normalizedMessage.includes("insecure")
  ) {
    return {
      code: "insecure-context",
      message: "Voice input requires a secure context.",
    };
  }

  return {
    code: "unknown",
    message: "Could not start voice recognition.",
  };
}

function mapMediaCaptureFailure(error: unknown): VoiceDictationError {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: string }).name ?? "").toLowerCase()
      : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (name.includes("notallowed") || message.includes("permission")) {
    return mapVoiceError("not-allowed");
  }

  if (name.includes("security") || message.includes("secure context") || message.includes("insecure")) {
    return mapVoiceError("insecure-context");
  }

  if (name.includes("notfound") || name.includes("notreadable") || name.includes("overconstrained")) {
    return mapVoiceError("audio-capture");
  }

  return mapVoiceError("unknown");
}

function mapTranscriptionFailure(error: unknown): VoiceDictationError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return mapVoiceError("aborted");
  }

  if (error instanceof VoiceTranscriptionClientError) {
    if (error.code === "VOICE_TRANSCRIPTION_UNAVAILABLE") {
      return mapVoiceError("transcription-unavailable");
    }

    if (error.code === "VOICE_TRANSCRIPTION_EMPTY") {
      return mapVoiceError("no-speech");
    }

    if (error.code === "VOICE_TRANSCRIPTION_NETWORK_ERROR") {
      return mapVoiceError("network");
    }
  }

  return mapVoiceError("network");
}

const AUTO_STOP_RECORDING_MS = 8_000;

export interface UseVoiceDictationPrimitiveOptions {
  language: string;
  disabled?: boolean;
  autoStop?: boolean;
  onResult: (transcript: string) => void;
  onError?: (error: VoiceDictationError) => void;
}

export interface UseVoiceDictationPrimitiveResult {
  state: VoiceDictationState;
  error: VoiceDictationError | null;
  liveTranscript: string;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
  resetError: () => void;
}

export function useVoiceDictationPrimitive({
  language,
  disabled,
  autoStop = true,
  onResult,
  onError,
}: UseVoiceDictationPrimitiveOptions): UseVoiceDictationPrimitiveResult {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureChunksRef = useRef<Blob[]>([]);
  const transcriptionAbortControllerRef = useRef<AbortController | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizedTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const lastEmittedTranscriptRef = useRef("");
  const stopRequestedRef = useRef(false);
  const abortRequestedRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createRecognitionSessionRef = useRef<(resetTranscript: boolean) => void>(() => {});
  const hasRecognitionErrorRef = useRef(false);
  const sessionVersionRef = useRef(0);
  const [isSupported] = useState<boolean>(() => supportsAudioCapture() || Boolean(getSpeechRecognitionConstructor()));
  const [state, setState] = useState<VoiceDictationState>(() => (isSupported ? "idle" : "unsupported"));
  const [error, setError] = useState<VoiceDictationError | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");

  const clearRestartTimer = useCallback(() => {
    if (!restartTimerRef.current) return;
    clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
  }, []);

  const clearAutoStopTimer = useCallback(() => {
    if (!autoStopTimerRef.current) return;
    clearTimeout(autoStopTimerRef.current);
    autoStopTimerRef.current = null;
  }, []);

  const clearTranscriptState = useCallback(() => {
    finalizedTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    lastEmittedTranscriptRef.current = "";
    setLiveTranscript("");
  }, []);

  const emitTranscript = useCallback(
    (value: string) => {
      const transcript = value.trim();
      if (!transcript) return;
      if (transcript === lastEmittedTranscriptRef.current) return;
      lastEmittedTranscriptRef.current = transcript;
      onResult(transcript);
    },
    [onResult]
  );

  const buildTranscriptSnapshot = useCallback(() => {
    const parts = [finalizedTranscriptRef.current, interimTranscriptRef.current]
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return parts.join(" ").trim();
  }, []);

  const cleanupMediaResources = useCallback(() => {
    clearAutoStopTimer();
    transcriptionAbortControllerRef.current?.abort();
    transcriptionAbortControllerRef.current = null;

    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;
    }

    const stream = mediaStreamRef.current;
    mediaStreamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());
    captureChunksRef.current = [];
  }, [clearAutoStopTimer]);

  const commitError = useCallback(
    (nextError: VoiceDictationError) => {
      setError(nextError);
      setLiveTranscript("");
      setState(
        nextError.code === "permission-denied" ||
          nextError.code === "service-not-allowed" ||
          nextError.code === "transcription-unavailable" ||
          nextError.code === "insecure-context"
          ? "unsupported"
          : "error"
      );
      onError?.(nextError);
    },
    [onError]
  );

  const abort = useCallback(() => {
    clearRestartTimer();
    cleanupMediaResources();
    sessionVersionRef.current += 1;
    stopRequestedRef.current = true;
    abortRequestedRef.current = true;
    const recognition = recognitionRef.current;
    if (!recognition) {
      clearTranscriptState();
      setState((previousState) => (previousState === "unsupported" ? "unsupported" : "idle"));
      return;
    }

    detachRecognitionHandlers(recognition);
    recognition.abort();
    recognitionRef.current = null;
    clearTranscriptState();
    setState((previousState) => (previousState === "unsupported" ? "unsupported" : "idle"));
  }, [cleanupMediaResources, clearRestartTimer, clearTranscriptState]);

  const stop = useCallback(() => {
    clearRestartTimer();
    clearAutoStopTimer();
    stopRequestedRef.current = true;
    abortRequestedRef.current = false;

    if (mediaRecorderRef.current) {
      setState("processing");
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      setState((previousState) => (previousState === "unsupported" ? "unsupported" : "idle"));
      return;
    }

    recognition.stop();
    setState("processing");
  }, [clearAutoStopTimer, clearRestartTimer]);

  const startAudioCaptureSession = useCallback(
    async (version: number) => {
      if (disabled) return;
      if (!supportsAudioCapture()) {
        commitError(
          typeof window !== "undefined" && window.isSecureContext
            ? mapVoiceError("service-not-allowed")
            : mapVoiceError("insecure-context")
        );
        return;
      }

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (captureError) {
        if (version !== sessionVersionRef.current) return;
        commitError(mapMediaCaptureFailure(captureError));
        return;
      }

      if (version !== sessionVersionRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      const MediaRecorderApi = getMediaRecorderConstructor();
      if (!MediaRecorderApi) {
        mediaStream.getTracks().forEach((track) => track.stop());
        commitError(mapVoiceError("service-not-allowed"));
        return;
      }

      const preferredMimeType = selectPreferredMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = preferredMimeType
          ? new MediaRecorderApi(mediaStream, { mimeType: preferredMimeType })
          : new MediaRecorderApi(mediaStream);
        recorder.start();
      } catch (recorderError) {
        mediaStream.getTracks().forEach((track) => track.stop());
        commitError(mapMediaCaptureFailure(recorderError));
        return;
      }

      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = mediaStream;
      captureChunksRef.current = [];
      abortRequestedRef.current = false;
      setError(null);
      setState("listening");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          captureChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event: MediaRecorderErrorEventLike) => {
        if (version !== sessionVersionRef.current) return;
        cleanupMediaResources();
        commitError(mapMediaCaptureFailure(event.error));
      };

      recorder.onstop = async () => {
        if (version !== sessionVersionRef.current) {
          cleanupMediaResources();
          return;
        }

        const wasAborted = abortRequestedRef.current;
        const audioChunks = [...captureChunksRef.current];
        const mimeType = recorder.mimeType || preferredMimeType || "audio/webm";
        cleanupMediaResources();

        if (wasAborted) {
          setState((previousState) => (previousState === "unsupported" ? "unsupported" : "idle"));
          return;
        }

        if (audioChunks.length === 0) {
          commitError(mapVoiceError("no-speech"));
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const controller = new AbortController();
        transcriptionAbortControllerRef.current = controller;
        setState("processing");

        try {
          const transcript = await requestVoiceTranscription({
            audio: audioBlob,
            language,
            signal: controller.signal,
          });
          if (version !== sessionVersionRef.current) return;
          emitTranscript(transcript);
          clearTranscriptState();
          setState("idle");
          setError(null);
        } catch (transcriptionError) {
          if (version !== sessionVersionRef.current) return;
          if (transcriptionError instanceof DOMException && transcriptionError.name === "AbortError") {
            setState("idle");
            return;
          }
          const mappedError = mapTranscriptionFailure(transcriptionError);
          const canFallbackToBrowserRecognition = Boolean(getSpeechRecognitionConstructor());
          if (
            mappedError.code === "transcription-unavailable" &&
            canFallbackToBrowserRecognition &&
            !disabled
          ) {
            setState("idle");
            setError(null);
            clearTranscriptState();
            createRecognitionSessionRef.current(true);
            return;
          }
          commitError(mappedError);
        } finally {
          transcriptionAbortControllerRef.current = null;
        }
      };

      if (autoStop) {
        autoStopTimerRef.current = setTimeout(() => {
          if (version !== sessionVersionRef.current) return;
          stopRequestedRef.current = true;
          abortRequestedRef.current = false;
          setState("processing");
          const activeRecorder = mediaRecorderRef.current;
          if (activeRecorder && activeRecorder.state !== "inactive") {
            activeRecorder.stop();
          }
        }, AUTO_STOP_RECORDING_MS);
      }
    },
    [
      autoStop,
      cleanupMediaResources,
      clearTranscriptState,
      commitError,
      disabled,
      emitTranscript,
      language,
    ]
  );

  const createRecognitionSession = useCallback(
    (resetTranscript: boolean) => {
      if (disabled) return;

      const SpeechRecognition = getSpeechRecognitionConstructor();
      if (!SpeechRecognition) {
        setState("unsupported");
        return;
      }

      clearRestartTimer();
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.interimResults = true;
      recognition.continuous = !autoStop;
      recognition.maxAlternatives = 1;
      hasRecognitionErrorRef.current = false;

      if (resetTranscript) {
        clearTranscriptState();
      } else {
        interimTranscriptRef.current = "";
      }

      recognition.onstart = () => {
        setError(null);
        setState("listening");
      };

      recognition.onresult = (event) => {
        let hasFinalChunk = false;
        let latestInterim = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (!result || result.length === 0) continue;

          const chunk = result[0]?.transcript?.trim() ?? "";
          if (!chunk) continue;

          if (result.isFinal) {
            hasFinalChunk = true;
            latestInterim = "";
            const previous = finalizedTranscriptRef.current.trim();
            finalizedTranscriptRef.current = previous
              ? `${previous} ${chunk}`.replace(/\s+/g, " ").trim()
              : chunk;
            continue;
          }

          latestInterim = chunk;
        }

        interimTranscriptRef.current = latestInterim;
        const transcript = buildTranscriptSnapshot();
        if (transcript) {
          setLiveTranscript(transcript);
        }

        if (autoStop && hasFinalChunk) {
          if (!transcript) return;
          setState("processing");
          emitTranscript(transcript);
          clearTranscriptState();
          return;
        }

        if (!autoStop && transcript) {
          emitTranscript(transcript);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "aborted") {
          return;
        }

        if (!autoStop && event.error === "no-speech") {
          hasRecognitionErrorRef.current = false;
          return;
        }

        hasRecognitionErrorRef.current = true;
        commitError(mapVoiceError(event.error));
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        const transcript = buildTranscriptSnapshot();
        if (transcript && !hasRecognitionErrorRef.current) {
          emitTranscript(transcript);
        }

        if (!autoStop && !stopRequestedRef.current && !hasRecognitionErrorRef.current && !disabled) {
          interimTranscriptRef.current = "";
          restartTimerRef.current = setTimeout(() => {
            restartTimerRef.current = null;
            createRecognitionSessionRef.current(false);
          }, 120);
          return;
        }

        clearTranscriptState();
        setState((previousState) =>
          previousState === "unsupported" || previousState === "error" ? previousState : "idle"
        );
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (startError) {
        commitError(mapStartFailure(startError));
        recognitionRef.current = null;
      }
    },
    [
      autoStop,
      buildTranscriptSnapshot,
      clearRestartTimer,
      clearTranscriptState,
      commitError,
      disabled,
      emitTranscript,
      language,
    ]
  );

  useEffect(() => {
    createRecognitionSessionRef.current = createRecognitionSession;
  }, [createRecognitionSession]);

  const start = useCallback(async () => {
    if (disabled) return;

    abort();
    sessionVersionRef.current += 1;
    stopRequestedRef.current = false;
    abortRequestedRef.current = false;
    hasRecognitionErrorRef.current = false;

    const currentVersion = sessionVersionRef.current;
    if (shouldPreferAudioCapture()) {
      await startAudioCaptureSession(currentVersion);
      return;
    }

    createRecognitionSession(true);
  }, [abort, createRecognitionSession, disabled, startAudioCaptureSession]);

  useEffect(() => () => abort(), [abort]);

  const resetError = useCallback(() => {
    setError(null);
    setLiveTranscript("");
    setState((previousState) => (previousState === "unsupported" ? "unsupported" : "idle"));
  }, []);

  return {
    state,
    error,
    liveTranscript,
    isSupported,
    start,
    stop,
    abort,
    resetError,
  };
}

export function mapVoiceErrorCode(errorCode: VoiceDictationErrorCode): VoiceDictationError {
  return mapVoiceError(errorCode);
}
