import type { Lang } from "@/lib/i18n";
import enMarkdown from "./health-instructions/en.md?raw";
import viMarkdown from "./health-instructions/vi.md?raw";
import type { HealthResponse, RvcApplioConfigResponse, SupertonicConfigResponse, VieneuConfigResponse } from "./SettingsTypes";

type InstructionId = "system" | "piper" | "applio" | "supertonic" | "vieneu" | "elevenlabs";

export type HealthInstruction = {
  description: string;
  markdown: string;
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
    VIENEU_PYTHON: config?.pythonExe || "python",
  });
}

export function elevenLabsInstruction(lang: Lang): HealthInstruction {
  return buildInstruction(lang, "elevenlabs");
}

function buildInstruction(lang: Lang, id: InstructionId, values: Record<string, string> = {}): HealthInstruction {
  const markdown = applyValues(extractSection(lang === "vi" ? viMarkdown : enMarkdown, id), values);
  return { description: extractDescription(markdown), markdown };
}

function extractSection(markdown: string, id: InstructionId) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`(^|\\n)## ${escapedId}\\n([\\s\\S]*?)(?=\\n## |$)`, "i"));
  return match?.[2]?.trim() || markdown.trim();
}

function applyValues(markdown: string, values: Record<string, string>) {
  return markdown.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key: string) => values[key] || "");
}

function extractDescription(markdown: string) {
  return markdown.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith("#")) || "";
}
