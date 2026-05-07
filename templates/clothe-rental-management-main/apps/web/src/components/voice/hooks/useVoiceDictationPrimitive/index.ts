import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceDictationError } from "@/types/voiceDictation";
import { requestVoiceTranscription } from "@/components/voice/services/voiceTranscriptionClient";
import {
  getMediaRecorderConstructor,
  getSpeechRecognitionConstructor,
  supportsAudioCapture,
  shouldPreferAudioCapture,
  selectPreferredMimeType,
  mapVoiceError,
  detachRecognitionHandlers,
  mapStartFailure,
  mapMediaCaptureFailure,
  mapTranscriptionFailure,
} from "./utils";
import { AUTO_STOP_RECORDING_MS } from "./constants";
import type {
  MediaRecorderErrorEventLike,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionLike,
  UseVoiceDictationPrimitiveOptions,
  UseVoiceDictationPrimitiveResult,
} from "./types";

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
  const [isSupported] = useState<boolean>(() =>
    supportsAudioCapture() || Boolean(getSpeechRecognitionConstructor())
  );
  const [state, setState] = useState<"idle" | "listening" | "processing" | "error" | "unsupported">(
    isSupported ? "idle" : "unsupported"
  );
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
      setState((previousState) =>
        previousState === "unsupported" ? "unsupported" : "idle"
      );
      return;
    }

    detachRecognitionHandlers(recognition);
    recognition.abort();
    recognitionRef.current = null;
    clearTranscriptState();
    setState((previousState) =>
      previousState === "unsupported" ? "unsupported" : "idle"
    );
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
      setState((previousState) =>
        previousState === "unsupported" ? "unsupported" : "idle"
      );
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
          setState((previousState) =>
            previousState === "unsupported" ? "unsupported" : "idle"
          );
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
          commitError(mapTranscriptionFailure(transcriptionError));
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
    [autoStop, cleanupMediaResources, commitError, disabled, language, selectPreferredMimeType]
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
      let hasRecognitionError = false;

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

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === "aborted") {
          return;
        }

        if (!autoStop && event.error === "no-speech") {
          hasRecognitionError = false;
          return;
        }

        hasRecognitionError = true;
        commitError(mapVoiceError(event.error));
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        const transcript = buildTranscriptSnapshot();
        if (transcript && !hasRecognitionError) {
          emitTranscript(transcript);
        }

        if (!autoStop && !stopRequestedRef.current && !hasRecognitionError && !disabled) {
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
    [autoStop, buildTranscriptSnapshot, clearRestartTimer, clearTranscriptState, commitError, disabled, emitTranscript, language]
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
    setState((previousState) =>
      previousState === "unsupported" ? "unsupported" : "idle"
    );
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
