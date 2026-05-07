import type { VoiceDictationError, VoiceDictationState } from "@/types/voiceDictation";

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

export interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}

export interface SpeechRecognitionLike extends EventTarget {
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

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
export type MediaRecorderConstructor = typeof MediaRecorder;

export type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export type WindowWithMediaRecorder = Window & {
  MediaRecorder?: MediaRecorderConstructor;
};

export interface MediaRecorderErrorEventLike extends Event {
  readonly error?: DOMException;
}

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
