import path from "node:path";
import { MODEL_DIR } from "./paths";
import type { PiperModel } from "../models/PiperModel";

export const MODELS: Record<string, PiperModel> = {
  vi_vais1000: {
    key: "vi_vais1000",
    label: "Tiếng Việt - vi_VN-vais1000-medium",
    lang: "vi",
    modelPath: path.join(MODEL_DIR, "vi_VN-vais1000-medium.onnx"),
  },
  en_lessac: {
    key: "en_lessac",
    label: "Tiếng Anh - en_US-lessac-medium",
    lang: "en",
    modelPath: path.join(MODEL_DIR, "en_US-lessac-medium.onnx"),
  },
  en_ryan: {
    key: "en_ryan",
    label: "Tiếng Anh - en_US-ryan-medium",
    lang: "en",
    modelPath: path.join(MODEL_DIR, "en_US-ryan-medium.onnx"),
  },
  en_libritts: {
    key: "en_libritts",
    label: "Tiếng Anh - en_US-libritts_r-medium",
    lang: "en",
    modelPath: path.join(MODEL_DIR, "en_US-libritts_r-medium.onnx"),
  },
};
