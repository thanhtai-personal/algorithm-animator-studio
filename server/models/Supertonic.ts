import type { EndpointCheckStatus } from "./EndpointHealth";

export type SupertonicVoice = {
  id: string;
  label: string;
  description?: string;
};

export type SupertonicEndpoints = {
  health: string;
  styles: string;
  importStyle: string;
  tts: string;
};

export type SupertonicConfigStatus = {
  enabled: boolean;
  serverOk: boolean;
  baseUrl: string;
  endpoints: SupertonicEndpoints;
  model: string;
  defaultVoice: string;
  defaultLang: string;
  defaultTotalSteps: number;
  voices: SupertonicVoice[];
  sampleRate?: number;
  version?: string;
  endpointChecks: EndpointCheckStatus[];
  endpointsOk: boolean;
  error?: string;
};

export type SupertonicImportStyleBody = {
  styleJson?: unknown;
  fileName?: string;
};

export type SupertonicGenerateBody = {
  text?: string;
  segments?: string[];
  voice?: string;
  lang?: string;
  speed?: number;
  totalSteps?: number;
  fileName?: string;
  responseFormat?: "wav" | "flac" | "ogg";
};
