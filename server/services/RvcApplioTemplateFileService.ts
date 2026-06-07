import fs from "node:fs";
import path from "node:path";
import { resolveConfiguredDataDir } from "../config/paths";
import type { RuntimeEnvValues } from "./EnvFileService";

export type RvcApplioTemplateFile = {
  convertTemplates: unknown[];
  ttsTemplates: unknown[];
};

export type RvcApplioTemplateFileText = {
  filePath: string;
  convertTemplatesJson: string;
  ttsTemplatesJson: string;
};

const CONFIG_DIR_NAME = "config";
const TEMPLATES_FILE_NAME = "rvc-applio-templates.json";

const DEFAULT_TEMPLATE_FILE: RvcApplioTemplateFile = {
  convertTemplates: [
    {
      id: "kai-voice-v1-convert",
      label: "Kai voice v1 - Applio voice conversion",
      apiName: "/enforce_terms",
      modelName: "logs\\kai-voice-v1\\kai-voice-v1_100e_3400s.pth",
      indexPath: "logs\\kai-voice-v1\\kai-voice-v1.index",
      pitch: 0,
      f0Method: "rmvpe",
      indexRate: 0.75,
      protect: 0.5,
      filterRadius: 3,
      argTemplate: [
        true, "${pitch}", "${index_rate}", 1, "${protect}", "${f0_method}", "${input_path}", "${output}", "${model}", "${index}",
        false, false, 1, false, 155, false, 0.5, "WAV", "contentvec", null,
        false, 1, 1, false, false, false, false, false, false, false,
        false, false, false, false, 0.5, 0.5, 0.33, 0.4, 1, 0,
        0, -6, 0.05, 0, 25, 1, 0.25, 7, 0, 0.5,
        8, -6, 0, 1, 1, 100, 0.5, 0, 0.5, 0,
      ],
    },
  ],
  ttsTemplates: [
    {
      id: "vi-hoaimy-edge",
      label: "Vietnamese HoaiMy - Applio EdgeTTS/RVC",
      apiName: "/enforce_terms_2",
      ttsVoice: "vi-VN-HoaiMyNeural",
      ttsSpeed: 0,
      modelName: "logs\\kai-voice-v1\\kai-voice-v1_100e_3400s.pth",
      indexPath: "logs\\kai-voice-v1\\kai-voice-v1.index",
      pitch: 0,
      f0Method: "rmvpe",
      indexRate: 0.75,
      protect: 0.5,
      filterRadius: 3,
      argTemplate: [
        true, "", "${text}", "${tts_voice}", "${tts_speed}", "${pitch}", "${index_rate}", 1, "${protect}", "${f0_method}",
        "${tts_output}", "${output}", "${model}", "${index}", false, false, 1, false, 155, false,
        0.5, "WAV", "contentvec", null, 0,
      ],
    },
    {
      id: "vi-namminh-edge",
      label: "Vietnamese NamMinh - Applio EdgeTTS/RVC",
      apiName: "/enforce_terms_2",
      ttsVoice: "vi-VN-NamMinhNeural",
      ttsSpeed: 0,
      modelName: "logs\\kai-voice-v1\\kai-voice-v1_100e_3400s.pth",
      indexPath: "logs\\kai-voice-v1\\kai-voice-v1.index",
      pitch: 0,
      f0Method: "rmvpe",
      indexRate: 0.75,
      protect: 0.5,
      filterRadius: 3,
      argTemplate: [
        true, "", "${text}", "${tts_voice}", "${tts_speed}", "${pitch}", "${index_rate}", 1, "${protect}", "${f0_method}",
        "${tts_output}", "${output}", "${model}", "${index}", false, false, 1, false, 155, false,
        0.5, "WAV", "contentvec", null, 0,
      ],
    },
  ],
};

export function readRvcApplioTemplateFile(env: RuntimeEnvValues): RvcApplioTemplateFile {
  const filePath = getRvcApplioTemplateFilePath(env);
  if (!fs.existsSync(filePath)) {
    writeTemplateFile(filePath, DEFAULT_TEMPLATE_FILE);
    return DEFAULT_TEMPLATE_FILE;
  }

  try {
    return normalizeTemplateFile(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch (error) {
    throw new Error(`Không đọc được Applio templates file ${filePath}: ${error instanceof Error ? error.message : "JSON không hợp lệ."}`);
  }
}

export function readRvcApplioTemplateFileText(env: RuntimeEnvValues): RvcApplioTemplateFileText {
  const filePath = getRvcApplioTemplateFilePath(env);
  const data = readRvcApplioTemplateFile(env);
  return {
    filePath,
    convertTemplatesJson: JSON.stringify(data.convertTemplates, null, 2),
    ttsTemplatesJson: JSON.stringify(data.ttsTemplates, null, 2),
  };
}

export function saveRvcApplioTemplateFileText(env: RuntimeEnvValues, text: Omit<RvcApplioTemplateFileText, "filePath">) {
  const data = normalizeTemplateFile({
    convertTemplates: parseJsonArray(text.convertTemplatesJson, "convertTemplatesJson"),
    ttsTemplates: parseJsonArray(text.ttsTemplatesJson, "ttsTemplatesJson"),
  });
  const filePath = getRvcApplioTemplateFilePath(env);
  writeTemplateFile(filePath, data);
  return readRvcApplioTemplateFileText(env);
}

export function getRvcApplioTemplateFilePath(env: RuntimeEnvValues) {
  return path.join(resolveConfiguredDataDir(env.SERVER_DATA_DIR), CONFIG_DIR_NAME, TEMPLATES_FILE_NAME);
}

function normalizeTemplateFile(value: unknown): RvcApplioTemplateFile {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    convertTemplates: Array.isArray(record.convertTemplates) ? record.convertTemplates : [],
    ttsTemplates: Array.isArray(record.ttsTemplates) ? record.ttsTemplates : [],
  };
}

function parseJsonArray(value: string, label: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Friendly error below.
  }
  throw new Error(`${label} phải là JSON array hợp lệ.`);
}

function writeTemplateFile(filePath: string, data: RvcApplioTemplateFile) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
