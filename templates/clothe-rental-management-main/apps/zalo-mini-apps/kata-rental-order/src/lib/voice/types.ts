export type VoiceDictationState =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

export type VoiceDictationErrorCode =
  | "permission-denied"
  | "audio-capture"
  | "network"
  | "no-speech"
  | "aborted"
  | "insecure-context"
  | "not-allowed"
  | "service-not-allowed"
  | "transcription-unavailable"
  | "unknown";

export interface VoiceDictationError {
  code: VoiceDictationErrorCode;
  message: string;
}
