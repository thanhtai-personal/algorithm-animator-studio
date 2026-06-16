import type { EndpointCheckStatus } from "./EndpointHealth";

export type GptSoVitsConfigStatus = {
  enabled: boolean;
  serverOk: boolean;
  baseUrl: string;
  ttsEndpoint: string;
  defaultTextLang: string;
  defaultPromptLang: string;
  referenceAudioPath: string;
  referenceAudioExists: boolean;
  promptTextConfigured: boolean;
  mediaType: "wav" | "raw" | "ogg" | "aac";
  textSplitMethod: string;
  timeoutMs: number;
  endpointChecks: EndpointCheckStatus[];
  endpointsOk: boolean;
  restartNote: string;
  error?: string;
};

export type GptSoVitsGenerateBody = {
  text?: string;
  segments?: string[];
  fileName?: string;
  textLang?: string;
  promptLang?: string;
  referenceAudioPath?: string;
  promptText?: string;
  mediaType?: "wav" | "raw" | "ogg" | "aac";
  textSplitMethod?: string;
  speedFactor?: number;
  topK?: number;
  topP?: number;
  temperature?: number;
  batchSize?: number;
};
