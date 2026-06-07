import type { EndpointCheckStatus } from "./EndpointHealth";

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

export type ElevenLabsGenerateBody = {
  text?: string;
  modelId?: string;
  voiceId?: string;
  fileName?: string;
};

export type ElevenLabsConfigStatus = {
  hasApiKey: boolean;
  models: ElevenLabsModel[];
  voices: ElevenLabsVoice[];
  endpointChecks: EndpointCheckStatus[];
  endpointsOk: boolean;
  pricing: { sourceLabel: string; sourceUrl: string; disclaimer: string };
};
