import type { TtsModel } from "../types";

export const DEFAULT_MODEL_KEY = "vi_vais1000";
export const DEFAULT_SENTENCE_SILENCE = 1.2;

export function getSuggestedFileName(model: TtsModel | null): string {
  if (!model) {
    return "nghe-thu";
  }

  if (model.lang === "vi") {
    return "than-mo-tap-1";
  }

  if (model.key === "en_ryan") {
    return "truyen-tieng-anh-ryan";
  }

  if (model.key === "en_lessac") {
    return "truyen-tieng-anh-lessac";
  }

  return "truyen-tieng-anh";
}

export function getFirstAvailableModel(models: TtsModel[]): TtsModel | null {
  return (
    models.find((model) => model.key === DEFAULT_MODEL_KEY && model.available) ||
    models.find((model) => model.available) ||
    null
  );
}
