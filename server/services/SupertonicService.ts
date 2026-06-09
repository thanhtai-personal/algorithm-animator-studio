import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_PUBLIC_PATH,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedDir,
} from "../config/paths";
import { DEFAULT_SUPERTONIC_LANG, DEFAULT_SUPERTONIC_TOTAL_STEPS, DEFAULT_SUPERTONIC_VOICE } from "../config/supertonicDefaults";
import type { EndpointCheckStatus } from "../models/EndpointHealth";
import type { SupertonicConfigStatus, SupertonicGenerateBody, SupertonicImportStyleBody, SupertonicVoice } from "../models/Supertonic";
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
  const endpoints = getSupertonicEndpoints(env);
  const fallbackVoice = DEFAULT_SUPERTONIC_VOICE;
  const endpointChecks: EndpointCheckStatus[] = [];

  let health: HealthPayload;
  try {
    health = await fetchJson<HealthPayload>(buildEndpointUrl(baseUrl, endpoints.health), "GET", undefined, endpointChecks, endpoints.health);
  } catch (error) {
    return {
      enabled: false,
      serverOk: false,
      endpointChecks,
      endpointsOk: false,
      baseUrl,
      endpoints,
      model: env.SUPERTONIC_MODEL || "supertonic-3",
      defaultVoice: fallbackVoice,
      defaultLang: DEFAULT_SUPERTONIC_LANG,
      defaultTotalSteps: DEFAULT_SUPERTONIC_TOTAL_STEPS,
      voices: defaultVoices(),
      error: error instanceof Error ? error.message : "Không kết nối được Supertonic server.",
    };
  }

  let voices: unknown = [];
  let stylesError = "";
  try {
    voices = await fetchJson<unknown>(buildEndpointUrl(baseUrl, endpoints.styles), "GET", undefined, endpointChecks, endpoints.styles);
  } catch (error) {
    stylesError = error instanceof Error ? error.message : "Không kiểm tra được endpoint styles.";
  }

  return {
    enabled: true,
    serverOk: true,
    endpointChecks,
    endpointsOk: endpointChecks.every((check) => check.ok),
    baseUrl,
    endpoints,
    model: health.model || env.SUPERTONIC_MODEL || "supertonic-3",
    defaultVoice: fallbackVoice,
    defaultLang: DEFAULT_SUPERTONIC_LANG,
    defaultTotalSteps: DEFAULT_SUPERTONIC_TOTAL_STEPS,
    voices: normalizeVoices(voices, fallbackVoice),
    sampleRate: health.sample_rate,
    version: health.version,
    error: stylesError || undefined,
  };
}

export async function importSupertonicStyle(body: SupertonicImportStyleBody, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const baseUrl = getSupertonicBaseUrl(env);
  const endpoints = getSupertonicEndpoints(env);
  const styleJson = normalizeStyleJson(body.styleJson);

  const response = await fetchWithTimeout(buildEndpointUrl(baseUrl, endpoints.importStyle), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(styleJson),
  });

  if (!response.ok) {
    throw new Error(await readSupertonicError(response));
  }

  const imported = await response.json().catch(() => ({ ok: true }));
  const config = await getSupertonicConfigStatus(envOverrides);

  return {
    ok: true,
    imported,
    voices: config.voices,
    model: config.model,
  };
}

export async function generateSupertonicAudio(body: SupertonicGenerateBody, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const text = normalizeText(body);
  if (!text) throw new Error("Text không được để trống.");

  const responseFormat = normalizeFormat(body.responseFormat);
  const baseUrl = getSupertonicBaseUrl(env);
  const endpoints = getSupertonicEndpoints(env);
  const voice = body.voice?.trim() || DEFAULT_SUPERTONIC_VOICE;
  const lang = normalizeLang(body.lang || DEFAULT_SUPERTONIC_LANG);
  const speed = clampSpeed(body.speed);
  const totalSteps = clampTotalSteps(body.totalSteps ?? DEFAULT_SUPERTONIC_TOTAL_STEPS);

  const response = await fetchWithTimeout(buildEndpointUrl(baseUrl, endpoints.tts), {
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

function normalizeStyleJson(value: unknown) {
  if (!value) throw new Error("Chưa có nội dung voice JSON để import.");
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error("Voice JSON không hợp lệ.");
    }
  }
  if (typeof value === "object") return value;
  throw new Error("Voice JSON phải là object hoặc chuỗi JSON.");
}

function getSupertonicBaseUrl(env: RuntimeEnvValues) {
  return (env.SUPERTONIC_BASE_URL || "http://127.0.0.1:6688").replace(/\/+$/g, "");
}

function getSupertonicEndpoints(env: RuntimeEnvValues) {
  return {
    health: normalizeEndpoint(env.SUPERTONIC_HEALTH_ENDPOINT || "/v1/health"),
    styles: normalizeEndpoint(env.SUPERTONIC_STYLES_ENDPOINT || "/v1/styles"),
    importStyle: normalizeEndpoint(env.SUPERTONIC_IMPORT_STYLE_ENDPOINT || "/v1/styles/import"),
    tts: normalizeEndpoint(env.SUPERTONIC_TTS_ENDPOINT || "/v1/tts"),
  };
}

function buildEndpointUrl(baseUrl: string, endpoint: string) {
  return `${baseUrl}${endpoint}`;
}

function normalizeEndpoint(value: string) {
  const trimmed = value.trim() || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
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

async function fetchJson<T>(
  url: string,
  method: "GET" | "POST",
  body?: unknown,
  endpointChecks?: EndpointCheckStatus[],
  label?: string
): Promise<T> {
  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Endpoint request failed.";
    endpointChecks?.push({ label: label || url, method, url, ok: false, detail });
    throw error;
  }

  if (!response.ok) {
    const detail = await readSupertonicError(response);
    endpointChecks?.push({ label: label || url, method, url, ok: false, detail });
    throw new Error(detail);
  }
  endpointChecks?.push({ label: label || url, method, url, ok: true });
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
  const candidates = extractVoiceCandidates(payload, 0);

  const voices = candidates.map(({ id: fallbackId, value }) => {
    if (typeof value === "string") {
      const id = value.trim() || fallbackId;
      return id ? { id, label: id } satisfies SupertonicVoice : null;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return fallbackId ? { id: fallbackId, label: fallbackId } satisfies SupertonicVoice : null;
    }
    const record = value as Record<string, unknown>;
    const id = String(record.id || record.key || record.name || record.voice || record.style || fallbackId || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(record.label || record.display_name || record.displayName || record.name || id),
      description: typeof record.description === "string" ? record.description : undefined,
    } satisfies SupertonicVoice;
  }).filter(Boolean) as SupertonicVoice[];

  return dedupeVoices(voices).length ? dedupeVoices(voices) : defaultVoices(fallbackVoice);
}

function extractVoiceCandidates(payload: unknown, depth: number): Array<{ id?: string; value: unknown }> {
  if (Array.isArray(payload)) return payload.map((value) => ({ value }));
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  for (const key of ["voices", "styles", "data", "items", "models"]) {
    const value = record[key];
    if (Array.isArray(value)) return value.map((item) => ({ value: item }));
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (key === "voices" || key === "styles") return objectMapCandidates(value);
      const nested = extractVoiceCandidates(value, depth + 1);
      if (nested.length) return nested;
    }
  }

  if (depth < 2) {
    for (const value of Object.values(record)) {
      const nested = extractVoiceCandidates(value, depth + 1);
      if (nested.length) return nested;
    }
  }

  return objectMapCandidates(record);
}

function objectMapCandidates(value: object): Array<{ id?: string; value: unknown }> {
  return Object.entries(value).map(([id, item]) => ({ id, value: item }));
}

function dedupeVoices(voices: SupertonicVoice[]) {
  const seen = new Set<string>();
  return voices.filter((voice) => {
    if (seen.has(voice.id)) return false;
    seen.add(voice.id);
    return true;
  });
}

function defaultVoices(firstVoice = "M1") {
  return Array.from(new Set([firstVoice, "M1", "M2", "M3", "M4", "M5", "F1", "F2", "F3", "F4", "F5"])).map((id) => ({
    id,
    label: id.startsWith("F") ? `Female ${id.slice(1)}` : id.startsWith("M") ? `Male ${id.slice(1)}` : id,
  }));
}
