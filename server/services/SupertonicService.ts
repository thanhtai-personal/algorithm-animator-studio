import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_PUBLIC_PATH,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedDir,
} from "../config/paths";
import type { SupertonicConfigStatus, SupertonicGenerateBody, SupertonicVoice } from "../models/Supertonic";
import { ensureDirectoryExists, getLocalDateFolderName, getUniqueOutputFileWithExtension, sanitizeFileBaseName } from "../utils/audioOutput";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";

const REQUEST_TIMEOUT_MS = 120_000;
const SUPPORTED_FORMATS = ["wav", "flac", "ogg"] as const;
const SUPERTONIC_LANGS = new Set([
  "ar", "bg", "hr", "cs", "da", "nl", "en", "et", "fi", "fr", "de", "el", "hi", "hu", "id", "it",
  "ja", "ko", "lv", "lt", "pl", "pt", "ro", "ru", "sk", "sl", "es", "sv", "tr", "uk", "vi", "na",
]);

type HealthPayload = {
  status?: string;
  model?: string;
  sample_rate?: number;
  version?: string;
  voices_loaded?: number;
};

export async function getSupertonicConfigStatus(envOverrides: RuntimeEnvValues = {}): Promise<SupertonicConfigStatus> {
  const env = readEnvValues(envOverrides);
  const baseUrl = getSupertonicBaseUrl(env);
  const fallbackVoice = env.SUPERTONIC_DEFAULT_VOICE || "M1";

  try {
    const [health, voices] = await Promise.all([
      fetchJson<HealthPayload>(`${baseUrl}/v1/health`, "GET"),
      fetchJson<unknown>(`${baseUrl}/v1/styles`, "GET"),
    ]);

    return {
      enabled: true,
      serverOk: true,
      baseUrl,
      model: health.model || env.SUPERTONIC_MODEL || "supertonic-3",
      defaultVoice: fallbackVoice,
      defaultLang: env.SUPERTONIC_DEFAULT_LANG || "en",
      defaultTotalSteps: clampTotalSteps(Number(env.SUPERTONIC_TOTAL_STEPS || 8)),
      voices: normalizeVoices(voices, fallbackVoice),
      sampleRate: health.sample_rate,
      version: health.version,
    };
  } catch (error) {
    return {
      enabled: false,
      serverOk: false,
      baseUrl,
      model: env.SUPERTONIC_MODEL || "supertonic-3",
      defaultVoice: fallbackVoice,
      defaultLang: env.SUPERTONIC_DEFAULT_LANG || "en",
      defaultTotalSteps: clampTotalSteps(Number(env.SUPERTONIC_TOTAL_STEPS || 8)),
      voices: defaultVoices(),
      error: error instanceof Error ? error.message : "Không kết nối được Supertonic server.",
    };
  }
}

export async function generateSupertonicAudio(body: SupertonicGenerateBody, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const text = normalizeText(body);
  if (!text) throw new Error("Text không được để trống.");

  const responseFormat = normalizeFormat(body.responseFormat);
  const baseUrl = getSupertonicBaseUrl(env);
  const voice = body.voice?.trim() || env.SUPERTONIC_DEFAULT_VOICE || "M1";
  const lang = normalizeLang(body.lang || env.SUPERTONIC_DEFAULT_LANG || "en");
  const speed = clampSpeed(body.speed);
  const totalSteps = clampTotalSteps(body.totalSteps ?? Number(env.SUPERTONIC_TOTAL_STEPS || 8));

  const response = await fetchWithTimeout(`${baseUrl}/v1/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice,
      lang,
      speed,
      total_steps: totalSteps,
      response_format: responseFormat,
    }),
  });

  if (!response.ok) {
    throw new Error(await readSupertonicError(response));
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error("Supertonic chạy xong nhưng không trả về âm thanh.");

  const dateFolderName = getLocalDateFolderName();
  const outputDir = path.join(getGeneratedDir(env.SERVER_DATA_DIR), "supertonic", dateFolderName);
  const baseFileName = sanitizeFileBaseName(body.fileName || "supertonic-voice");
  ensureDirectoryExists(outputDir);

  const { outputFileName, outputPath } = getUniqueOutputFileWithExtension({
    baseName: baseFileName,
    extension: responseFormat,
    outputDir,
  });

  fs.writeFileSync(outputPath, buffer);

  const relativePath = `supertonic/${dateFolderName}/${outputFileName}`;

  return {
    ok: true,
    fileName: outputFileName,
    folderName: dateFolderName,
    relativePath,
    audioPath: outputPath,
    audioUrl: buildGeneratedFileUrl(GENERATED_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
    model: env.SUPERTONIC_MODEL || "supertonic-3",
    voiceId: voice,
    lang,
    speechRate: speed,
    totalSteps,
    responseFormat,
    inputCharacters: text.length,
  };
}

function getSupertonicBaseUrl(env: RuntimeEnvValues) {
  return (env.SUPERTONIC_BASE_URL || "http://127.0.0.1:7788").replace(/\/+$/g, "");
}

function normalizeText(body: SupertonicGenerateBody) {
  const fromSegments = Array.isArray(body.segments)
    ? body.segments.map((segment) => String(segment || "").trim()).filter(Boolean).join("\n")
    : "";
  return (fromSegments || body.text || "").trim();
}

function normalizeLang(value: string) {
  const lang = value.trim().toLowerCase();
  if (!SUPERTONIC_LANGS.has(lang)) throw new Error(`Ngôn ngữ Supertonic không hỗ trợ: ${value}`);
  return lang;
}

function normalizeFormat(value: SupertonicGenerateBody["responseFormat"]) {
  return SUPPORTED_FORMATS.includes(value as typeof SUPPORTED_FORMATS[number]) ? value! : "wav";
}

function clampSpeed(value: unknown) {
  const speed = Number(value);
  if (!Number.isFinite(speed)) return 1.05;
  return Math.min(2, Math.max(0.7, speed));
}

function clampTotalSteps(value: unknown) {
  const steps = Number(value);
  if (!Number.isFinite(steps)) return 8;
  return Math.round(Math.min(12, Math.max(5, steps)));
}

async function fetchJson<T>(url: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const response = await fetchWithTimeout(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) throw new Error(await readSupertonicError(response));
  return response.json() as Promise<T>;
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Supertonic server phản hồi quá lâu.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readSupertonicError(response: Response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed.error?.message || text || "Yêu cầu Supertonic thất bại.";
  } catch {
    return text || "Yêu cầu Supertonic thất bại.";
  }
}

function normalizeVoices(payload: unknown, fallbackVoice: string): SupertonicVoice[] {
  const candidates = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { voices?: unknown[] })?.voices)
      ? (payload as { voices: unknown[] }).voices
      : Array.isArray((payload as { styles?: unknown[] })?.styles)
        ? (payload as { styles: unknown[] }).styles
        : [];

  const voices = candidates.map((item) => {
    const record = item as Record<string, unknown>;
    const id = String(record.id || record.name || record.voice || record.style || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(record.label || record.display_name || record.name || id),
      description: typeof record.description === "string" ? record.description : undefined,
    } satisfies SupertonicVoice;
  }).filter(Boolean) as SupertonicVoice[];

  return voices.length ? voices : defaultVoices(fallbackVoice);
}

function defaultVoices(firstVoice = "M1") {
  return Array.from(new Set([firstVoice, "M1", "M2", "M3", "M4", "M5", "F1", "F2", "F3", "F4", "F5"])).map((id) => ({
    id,
    label: id.startsWith("F") ? `Female ${id.slice(1)}` : id.startsWith("M") ? `Male ${id.slice(1)}` : id,
  }));
}
