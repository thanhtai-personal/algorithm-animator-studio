export type SupertonicVoice = {
  id: string;
  label: string;
  description?: string;
};

export type SupertonicConfigStatus = {
  enabled: boolean;
  serverOk: boolean;
  baseUrl: string;
  model: string;
  defaultVoice: string;
  defaultLang: string;
  defaultTotalSteps: number;
  voices: SupertonicVoice[];
  sampleRate?: number;
  version?: string;
  error?: string;
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
