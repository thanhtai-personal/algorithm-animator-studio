import { buildApiUrl, parseApiResponse } from "./runtimeApi";

export type PiperModel = {
  key: string;
  label: string;
  lang: "vi" | "en";
  available: boolean;
  modelPath: string;
  jsonPath: string;
  canInstall?: boolean;
};

export type PiperRuntimeStatus = {
  ok: boolean;
  piperExe: string;
  piperExists: boolean;
  modelDir: string;
  availableCount: number;
  models: PiperModel[];
  installHint: string[];
};

export type VoiceHealth = {
  ok: boolean;
  piperExe: string;
  piperExists: boolean;
  modelDir: string;
  generatedDir: string;
};

export type ElevenLabsModel = {
  id: string;
  label: string;
  priceUsdPerThousandCharacters: number;
  creditRateLabel: string;
  characterLimit: number;
  languages: string;
  latency: string;
  qualityNote: string;
};

export type ElevenLabsVoice = { id: string; label: string };

export type ElevenLabsConfig = {
  hasApiKey: boolean;
  models: ElevenLabsModel[];
  voices: ElevenLabsVoice[];
  pricing: { sourceLabel: string; sourceUrl: string; disclaimer: string };
};

export type VoiceGenerateResult = {
  ok: boolean;
  fileName: string;
  relativePath: string;
  audioUrl: string;
  model?: string;
  lang?: string;
  warning?: string;
  inputCharacters?: number;
  billedCharacters?: number;
  estimatedUsd?: number;
};

export async function getVoiceHealth() {
  return parseApiResponse<VoiceHealth>(await fetch(buildApiUrl("/api/health")));
}

export async function getPiperModels() {
  const data = await parseApiResponse<{ models: PiperModel[] }>(await fetch(buildApiUrl("/api/models")));
  return data.models;
}

export async function generatePiperVoice(payload: {
  text: string;
  modelKey: string;
  sentenceSilence: number;
  speechRate: number;
  fileName: string;
}) {
  return parseApiResponse<VoiceGenerateResult>(await fetch(buildApiUrl("/api/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export async function getElevenLabsConfig() {
  return parseApiResponse<ElevenLabsConfig>(await fetch(buildApiUrl("/api/elevenlabs/config")));
}

export async function generateElevenLabsVoice(payload: {
  text: string;
  modelId: string;
  voiceId: string;
  fileName: string;
}) {
  return parseApiResponse<VoiceGenerateResult>(await fetch(buildApiUrl("/api/elevenlabs/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export async function getPiperRuntimeStatus() {
  return parseApiResponse<PiperRuntimeStatus>(await fetch(buildApiUrl("/api/piper-runtime/status")));
}

export async function installPiperModel(modelKey: string) {
  return parseApiResponse<{ ok: boolean; model: PiperModel; status: PiperRuntimeStatus }>(await fetch(buildApiUrl("/api/piper-runtime/install-model"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelKey }),
  }));
}
