import path from "node:path";
import { MODEL_DIR } from "./paths";
import type { Language, PiperModel } from "../models/PiperModel";

type PiperModelDefinition = {
  key: string;
  label: string;
  lang: Language;
  fileName: string;
  modelUrl: string;
  jsonUrl: string;
};

export const MODEL_DEFINITIONS: Record<string, PiperModelDefinition> = {
  vi_vais1000: {
    key: "vi_vais1000",
    label: "Tiếng Việt - vi_VN-vais1000-medium",
    lang: "vi",
    fileName: "vi_VN-vais1000-medium.onnx",
    modelUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
    jsonUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx.json",
  },
  en_lessac: {
    key: "en_lessac",
    label: "Tiếng Anh - en_US-lessac-medium",
    lang: "en",
    fileName: "en_US-lessac-medium.onnx",
    modelUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    jsonUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
  },
  en_ryan: {
    key: "en_ryan",
    label: "Tiếng Anh - en_US-ryan-medium",
    lang: "en",
    fileName: "en_US-ryan-medium.onnx",
    modelUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx",
    jsonUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json",
  },
  en_libritts: {
    key: "en_libritts",
    label: "Tiếng Anh - en_US-libritts_r-medium",
    lang: "en",
    fileName: "en_US-libritts_r-medium.onnx",
    modelUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx",
    jsonUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx.json",
  },
};

export function getPiperModels(modelDir = MODEL_DIR): Record<string, PiperModel> {
  return Object.fromEntries(
    Object.values(MODEL_DEFINITIONS).map((definition) => [
      definition.key,
      {
        key: definition.key,
        label: definition.label,
        lang: definition.lang,
        modelPath: path.join(modelDir, definition.fileName),
        modelUrl: definition.modelUrl,
        jsonUrl: definition.jsonUrl,
      },
    ])
  );
}

export const MODELS = getPiperModels();
