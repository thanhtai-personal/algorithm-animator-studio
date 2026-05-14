import fs from "node:fs";
import type { PiperModel } from "../models/PiperModel";

export function modelJsonPath(modelPath: string): string {
  return `${modelPath}.json`;
}

export function isModelAvailable(model: PiperModel): boolean {
  return fs.existsSync(model.modelPath) && fs.existsSync(modelJsonPath(model.modelPath));
}

export function toModelResponse(model: PiperModel) {
  return {
    key: model.key,
    label: model.label,
    lang: model.lang,
    available: isModelAvailable(model),
    modelPath: model.modelPath,
    jsonPath: modelJsonPath(model.modelPath),
  };
}
