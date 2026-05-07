import { resolveApiBaseUrl } from "@/lib/voice/voiceTranscriptionRuntime";

export class VoiceTranscriptionClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "VoiceTranscriptionClientError";
    this.status = status;
    this.code = code;
  }
}

interface VoiceTranscriptionResponse {
  transcript?: string;
  error?: string;
  message?: string;
}

export interface RequestVoiceTranscriptionOptions {
  audio: Blob;
  language: string;
  signal?: AbortSignal;
}

function resolveFileExtension(audioType: string): string {
  const normalized = audioType.toLowerCase();
  if (normalized.includes("mp4")) return "m4a";
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("ogg")) return "ogg";
  return "webm";
}

export async function requestVoiceTranscription({
  audio,
  language,
  signal,
}: RequestVoiceTranscriptionOptions): Promise<string> {
  const formData = new FormData();
  const fileName = `voice-input.${resolveFileExtension(audio.type)}`;
  formData.append("audio", audio, fileName);
  formData.append("language", language);

  let response: Response;
  try {
    response = await fetch(`${resolveApiBaseUrl()}/api/v1/media/voice/transcriptions`, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new VoiceTranscriptionClientError(
      0,
      "VOICE_TRANSCRIPTION_NETWORK_ERROR",
      error instanceof Error ? error.message : "Network error while transcribing."
    );
  }

  let payload: VoiceTranscriptionResponse | null = null;
  try {
    payload = (await response.json()) as VoiceTranscriptionResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new VoiceTranscriptionClientError(
      response.status,
      payload?.error ?? "VOICE_TRANSCRIPTION_FAILED",
      payload?.message ?? payload?.error ?? `Voice transcription failed (${response.status}).`
    );
  }

  const transcript = payload?.transcript?.trim() ?? "";
  if (!transcript) {
    throw new VoiceTranscriptionClientError(
      response.status,
      "VOICE_TRANSCRIPTION_EMPTY",
      "No speech detected."
    );
  }

  return transcript;
}
