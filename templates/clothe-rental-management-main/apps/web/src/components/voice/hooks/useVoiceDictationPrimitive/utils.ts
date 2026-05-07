import type {
  MediaRecorderConstructor,
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
  WindowWithMediaRecorder,
  WindowWithSpeechRecognition,
} from "./types";
import type { VoiceDictationError } from "@/types/voiceDictation";
import { VoiceTranscriptionClientError } from "@/components/voice/services/voiceTranscriptionClient";

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const browserWindow = window as WindowWithSpeechRecognition;
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

export function getMediaRecorderConstructor(): MediaRecorderConstructor | null {
  if (typeof window === "undefined") return null;

  const browserWindow = window as WindowWithMediaRecorder;
  return browserWindow.MediaRecorder ?? null;
}

export function supportsAudioCapture(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  return Boolean(getMediaRecorderConstructor());
}

export function isIosLikeDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function shouldPreferAudioCapture(): boolean {
  if (!supportsAudioCapture()) return false;
  return isIosLikeDevice() || !getSpeechRecognitionConstructor();
}

export function selectPreferredMimeType(): string | undefined {
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

export function mapVoiceError(errorCode: string): VoiceDictationError {
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

export function detachRecognitionHandlers(recognition: SpeechRecognitionLike): void {
  recognition.onstart = null;
  recognition.onend = null;
  recognition.onerror = null;
  recognition.onresult = null;
}

export function mapStartFailure(error: unknown): VoiceDictationError {
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

export function mapMediaCaptureFailure(error: unknown): VoiceDictationError {
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

export function mapTranscriptionFailure(error: unknown): VoiceDictationError {
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
