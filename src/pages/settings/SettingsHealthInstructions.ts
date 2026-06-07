import type { Lang } from "@/lib/i18n";
import applioEn from "./health-instructions/en/applio.md?raw";
import elevenLabsEn from "./health-instructions/en/elevenlabs.md?raw";
import piperEn from "./health-instructions/en/piper.md?raw";
import supertonicEn from "./health-instructions/en/supertonic.md?raw";
import systemEn from "./health-instructions/en/system.md?raw";
import vieneuEn from "./health-instructions/en/vieneu.md?raw";
import applioVi from "./health-instructions/vi/applio.md?raw";
import elevenLabsVi from "./health-instructions/vi/elevenlabs.md?raw";
import piperVi from "./health-instructions/vi/piper.md?raw";
import supertonicVi from "./health-instructions/vi/supertonic.md?raw";
import systemVi from "./health-instructions/vi/system.md?raw";
import vieneuVi from "./health-instructions/vi/vieneu.md?raw";
import type { HealthResponse, RvcApplioConfigResponse, SupertonicConfigResponse, VieneuConfigResponse } from "./SettingsTypes";

type InstructionId = "system" | "piper" | "applio" | "supertonic" | "vieneu" | "elevenlabs";

export type HealthInstruction = {
  description: string;
  markdown: string;
};

const HEALTH_INSTRUCTION_MARKDOWN: Record<Lang, Record<InstructionId, string>> = {
  en: {
    system: systemEn,
    piper: piperEn,
    applio: applioEn,
    supertonic: supertonicEn,
    vieneu: vieneuEn,
    elevenlabs: elevenLabsEn,
  },
  vi: {
    system: systemVi,
    piper: piperVi,
    applio: applioVi,
    supertonic: supertonicVi,
    vieneu: vieneuVi,
    elevenlabs: elevenLabsVi,
  },
};

export function systemInstruction(lang: Lang, health: HealthResponse | null): HealthInstruction {
  return buildInstruction(lang, "system", {
    GENERATED_DIR: health?.generatedDir || "SERVER_DATA_DIR/generated",
  });
}

export function piperInstruction(lang: Lang, health: HealthResponse | null, modelCount: number): HealthInstruction {
  return buildInstruction(lang, "piper", {
    MODEL_COUNT: String(modelCount),
    PIPER_EXE: health?.piperExe || "models/.venv/Scripts/piper.exe",
  });
}

export function applioInstruction(lang: Lang, config: RvcApplioConfigResponse | null): HealthInstruction {
  const failedApis = config?.endpointChecks?.filter((check) => !check.ok).map((check) => check.apiName || check.url).join(", ") || "none";
  return buildInstruction(lang, "applio", {
    APPLIO_BASE_URL: config?.baseUrl || "http://127.0.0.1:6969",
    APPLIO_PYTHON: config?.pythonExe || "python",
    APPLIO_START_COMMAND: config?.startCommand || "C:\\TOOLS\\ApplioV3.6.2\\run-applio.bat",
    FAILED_APIS: failedApis,
  });
}

export function supertonicInstruction(lang: Lang, config: SupertonicConfigResponse | null): HealthInstruction {
  return buildInstruction(lang, "supertonic", {
    SUPERTONIC_BASE_URL: config?.baseUrl || "http://127.0.0.1:6688",
    SUPERTONIC_HEALTH_ENDPOINT: config?.endpoints?.health || "/v1/health",
    SUPERTONIC_STYLES_ENDPOINT: config?.endpoints?.styles || "/v1/styles",
    SUPERTONIC_IMPORT_STYLE_ENDPOINT: config?.endpoints?.importStyle || "/v1/styles/import",
    SUPERTONIC_TTS_ENDPOINT: config?.endpoints?.tts || "/v1/tts",
  });
}

export function vieneuInstruction(lang: Lang, config: VieneuConfigResponse | null): HealthInstruction {
  return buildInstruction(lang, "vieneu", {
    VIENEU_PYTHON: config?.pythonExe || "libs/VieNeu-TTS/.venv/Scripts/python.exe",
  });
}

export function elevenLabsInstruction(lang: Lang): HealthInstruction {
  return buildInstruction(lang, "elevenlabs");
}

function buildInstruction(lang: Lang, id: InstructionId, values: Record<string, string> = {}): HealthInstruction {
  const markdown = applyValues(HEALTH_INSTRUCTION_MARKDOWN[lang][id].trim(), values);
  return { description: extractDescription(markdown), markdown };
}

function applyValues(markdown: string, values: Record<string, string>) {
  return markdown.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key: string) => values[key] || "");
}

function extractDescription(markdown: string) {
  return markdown.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith("#")) || "";
}
