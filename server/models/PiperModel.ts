export type Language = "vi" | "en";

export type PiperModel = {
  key: string;
  label: string;
  lang: Language;
  modelPath: string;
  modelUrl?: string;
  jsonUrl?: string;
};

export type GenerateBody = {
  text?: string;
  segments?: string[];
  modelKey?: string;
  sentenceSilence?: number;
  speechRate?: number;
  fileName?: string;
};
