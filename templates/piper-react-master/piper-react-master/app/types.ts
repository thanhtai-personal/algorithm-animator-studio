export type TtsLanguage = "vi" | "en";

export type TtsModel = {
  key: string;
  label: string;
  lang: TtsLanguage;
  available: boolean;
  modelPath: string;
  jsonPath: string;
};

export type HealthResponse = {
  ok: boolean;
  piperExe: string;
  piperExists: boolean;
  modelDir: string;
  generatedDir: string;
  serverOrigin?: string;
  clientOrigin?: string;
};

export type ModelsResponse = {
  models: TtsModel[];
};

export type GenerateResponse = {
  ok: boolean;
  fileName: string;
  folderName: string;
  relativePath: string;
  audioUrl: string;
  model: string;
  lang: TtsLanguage;
  sentenceSilence: number;
  warning?: string;
  preview?: boolean;
  wordLimit?: number;
  wordCount?: number;
};

export type ApiErrorResponse = {
  error: string;
  detail?: string;
};
