export type Language = "vi" | "en";

export type PiperModel = {
  key: string;
  label: string;
  lang: Language;
  modelPath: string;
};

export type GenerateBody = {
  text?: string;
  modelKey?: string;
  sentenceSilence?: number;
  speechRate?: number;
  fileName?: string;
};
