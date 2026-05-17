import { buildApiUrl, withRuntimeSettingsHeaders } from "../utils/appSettingsStorage";

export type ElevenLabsModel = {
  id: string;
  label: string;
  priceUsdPerThousandCharacters: number;
  creditRateLabel: string;
  characterLimit: number;
  languages: string;
  latency: string;
  qualityNote: string;
  previewAudioUrl?: string;
};

export type ElevenLabsVoice = {
  id: string;
  label: string;
};

export type ElevenLabsConfig = {
  hasApiKey: boolean;
  models: ElevenLabsModel[];
  voices: ElevenLabsVoice[];
  pricing: {
    sourceLabel: string;
    sourceUrl: string;
    disclaimer: string;
  };
};

export type ElevenLabsGenerateResult = {
  ok: boolean;
  fileName: string;
  relativePath: string;
  audioUrl: string;
  model: string;
  voiceId: string;
  inputCharacters: number;
  billedCharacters: number;
  estimatedUsd: number;
  pricingSourceUrl: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Yêu cầu âm thanh PRO thất bại.");
  }

  return data;
}

export async function getElevenLabsConfig(): Promise<ElevenLabsConfig> {
  const response = await fetch(buildApiUrl("/api/elevenlabs/config"), { headers: withRuntimeSettingsHeaders() });
  return parseResponse<ElevenLabsConfig>(response);
}

export async function generateElevenLabsAudio(payload: {
  text: string;
  modelId: string;
  voiceId: string;
  fileName: string;
}): Promise<ElevenLabsGenerateResult> {
  const response = await fetch(buildApiUrl("/api/elevenlabs/generate"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return parseResponse<ElevenLabsGenerateResult>(response);
}
