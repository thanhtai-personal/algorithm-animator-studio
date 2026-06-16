import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_PUBLIC_PATH,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedDir,
} from "../config/paths";
import type { EndpointCheckStatus } from "../models/EndpointHealth";
import type { GptSoVitsConfigStatus, GptSoVitsGenerateBody } from "../models/GptSoVits";
import {
  ensureDirectoryExists,
  getLocalDateFolderName,
  getUniqueOutputFileWithExtension,
  sanitizeFileBaseName,
} from "../utils/audioOutput";
import { getAudioDurationSeconds } from "../utils/ffmpeg";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { isProviderStartupEnabled } from "./ProviderStartupService";

const CONFIG_TIMEOUT_MS = 3500;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const SUPPORTED_MEDIA_TYPES = ["wav", "raw", "ogg", "aac"] as const;

type GptSoVitsRuntimeConfig = Omit<GptSoVitsConfigStatus, "serverOk" | "endpointChecks" | "endpointsOk" | "error" | "restartNote">;

export async function getGptSoVitsConfigStatus(envOverrides: RuntimeEnvValues = {}): Promise<GptSoVitsConfigStatus> {
  const env = readEnvValues(envOverrides);
  const config = readGptSoVitsConfig(env);
  const endpointChecks: EndpointCheckStatus[] = [];
  const restartNote = "Thay đổi bật/tắt provider cần restart app/dev server mới có hiệu lực.";

  if (!config.enabled) {
    return {
      ...config,
      serverOk: false,
      endpointChecks,
      endpointsOk: false,
      restartNote,
      error: "GPT-SoVITS đang tắt trong Provider Manager.",
    };
  }

  try {
    await fetchJsonOrText(buildEndpointUrl(config.baseUrl, "/docs"), "GET", undefined, endpointChecks, "/docs", CONFIG_TIMEOUT_MS);
    return { ...config, serverOk: true, endpointChecks, endpointsOk: endpointChecks.every((check) => check.ok), restartNote };
  } catch (error) {
    return {
      ...config,
      serverOk: false,
      endpointChecks,
      endpointsOk: false,
      restartNote,
      error: error instanceof Error ? error.message : "Không kết nối được GPT-SoVITS API.",
    };
  }
}

export async function generateGptSoVitsAudio(body: GptSoVitsGenerateBody, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const config = readGptSoVitsConfig(env);
  if (!config.enabled) throw new Error("GPT-SoVITS đang tắt. Bật trong Provider Manager rồi restart app/dev server.");

  const text = normalizeText(body);
  if (!text) throw new Error("Chưa có text để tạo voice bằng GPT-SoVITS.");

  const referenceAudioPath = resolveRuntimePath(body.referenceAudioPath || config.referenceAudioPath);
  const promptText = String(body.promptText ?? env.GPT_SOVITS_PROMPT_TEXT ?? "").trim();
  const textLang = normalizeLang(body.textLang || config.defaultTextLang);
  const promptLang = normalizeLang(body.promptLang || config.defaultPromptLang);
  const mediaType = normalizeMediaType(body.mediaType || config.mediaType);
  const timeoutMs = clampTimeout(config.timeoutMs);

  const response = await fetchWithTimeout(buildEndpointUrl(config.baseUrl, config.ttsEndpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      text_lang: textLang,
      ref_audio_path: referenceAudioPath,
      prompt_text: promptText,
      prompt_lang: promptLang,
      top_k: clampInteger(body.topK, 1, 100, 15),
      top_p: clampFloat(body.topP, 0.01, 1, 1),
      temperature: clampFloat(body.temperature, 0.01, 2, 1),
      text_split_method: String(body.textSplitMethod || config.textSplitMethod || "cut5"),
      batch_size: clampInteger(body.batchSize, 1, 32, 1),
      media_type: mediaType,
      streaming_mode: false,
      speed_factor: clampFloat(body.speedFactor, 0.5, 2, 1),
    }),
  }, timeoutMs, "GPT-SoVITS tạo voice quá lâu.");

  if (!response.ok) throw new Error(await readGptSoVitsError(response));

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error("GPT-SoVITS chạy xong nhưng không trả về audio.");

  const dateFolderName = getLocalDateFolderName();
  const outputDir = path.join(getGeneratedDir(env.SERVER_DATA_DIR), "gpt-sovits", dateFolderName);
  ensureDirectoryExists(outputDir);

  const { outputFileName, outputPath } = getUniqueOutputFileWithExtension({
    baseName: sanitizeFileBaseName(body.fileName || "gpt-sovits-voice"),
    extension: mediaType === "raw" ? "wav" : mediaType,
    outputDir,
  });

  fs.writeFileSync(outputPath, buffer);
  const relativePath = `gpt-sovits/${dateFolderName}/${outputFileName}`;
  const durationSec = await readDurationOrZero(outputPath, envOverrides);

  return {
    ok: true,
    fileName: outputFileName,
    folderName: dateFolderName,
    relativePath,
    audioPath: outputPath,
    audioUrl: buildGeneratedFileUrl(GENERATED_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
    model: "GPT-SoVITS local",
    lang: textLang,
    promptLang,
    inputCharacters: text.length,
    segmentDurationsSec: durationSec > 0 ? [durationSec] : undefined,
    warning: promptText && referenceAudioPath ? "" : "Nên cấu hình reference audio và prompt text để GPT-SoVITS clone giọng ổn định hơn.",
  };
}

function readGptSoVitsConfig(env: RuntimeEnvValues): GptSoVitsRuntimeConfig {
  const referenceAudioPath = resolveRuntimePath(env.GPT_SOVITS_REFERENCE_AUDIO || "");
  return {
    enabled: isProviderStartupEnabled("gpt-sovits", env),
    baseUrl: (env.GPT_SOVITS_BASE_URL || "http://127.0.0.1:9880").replace(/\/+$/g, ""),
    ttsEndpoint: normalizeEndpoint(env.GPT_SOVITS_TTS_ENDPOINT || "/tts"),
    defaultTextLang: normalizeLang(env.GPT_SOVITS_TEXT_LANG || "en"),
    defaultPromptLang: normalizeLang(env.GPT_SOVITS_PROMPT_LANG || "en"),
    referenceAudioPath,
    referenceAudioExists: Boolean(referenceAudioPath && fs.existsSync(referenceAudioPath)),
    promptTextConfigured: Boolean(String(env.GPT_SOVITS_PROMPT_TEXT || "").trim()),
    mediaType: normalizeMediaType(env.GPT_SOVITS_MEDIA_TYPE || "wav"),
    textSplitMethod: String(env.GPT_SOVITS_TEXT_SPLIT_METHOD || "cut5").trim() || "cut5",
    timeoutMs: clampTimeout(env.GPT_SOVITS_TIMEOUT_MS),
  };
}

function normalizeText(body: GptSoVitsGenerateBody) {
  const fromSegments = Array.isArray(body.segments)
    ? body.segments.map((segment) => String(segment || "").trim()).filter(Boolean).join("\n")
    : "";
  return (fromSegments || body.text || "").trim();
}

function normalizeEndpoint(value: string) {
  const trimmed = value.trim() || "/tts";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function buildEndpointUrl(baseUrl: string, endpoint: string) {
  return `${baseUrl}${normalizeEndpoint(endpoint)}`;
}

function normalizeLang(value: string) {
  const lang = value.trim().toLowerCase();
  return lang || "en";
}

function normalizeMediaType(value: string): GptSoVitsConfigStatus["mediaType"] {
  return SUPPORTED_MEDIA_TYPES.includes(value as typeof SUPPORTED_MEDIA_TYPES[number])
    ? value as GptSoVitsConfigStatus["mediaType"]
    : "wav";
}

function resolveRuntimePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
}

function clampTimeout(value: unknown) {
  const timeout = Number(value);
  if (!Number.isFinite(timeout)) return DEFAULT_TIMEOUT_MS;
  return Math.round(Math.min(60 * 60 * 1000, Math.max(15_000, timeout)));
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.round(Math.min(max, Math.max(min, numberValue)));
}

function clampFloat(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

async function fetchJsonOrText(
  url: string,
  method: "GET" | "POST",
  body: unknown,
  endpointChecks: EndpointCheckStatus[],
  label: string,
  timeoutMs: number,
) {
  try {
    const response = await fetchWithTimeout(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }, timeoutMs, "GPT-SoVITS API phản hồi quá lâu.");
    if (!response.ok) throw new Error(await readGptSoVitsError(response));
    endpointChecks.push({ label, method, url, ok: true });
    return response.headers.get("content-type")?.includes("application/json") ? response.json() : response.text();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Endpoint request failed.";
    endpointChecks.push({ label, method, url, ok: false, detail });
    throw error;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number, timeoutMessage: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error(timeoutMessage);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readGptSoVitsError(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null) as { message?: string; detail?: string; error?: string } | null;
    return data?.message || data?.detail || data?.error || `GPT-SoVITS HTTP ${response.status}`;
  }
  const text = await response.text().catch(() => "");
  return text || `GPT-SoVITS HTTP ${response.status}`;
}

async function readDurationOrZero(audioPath: string, envOverrides: RuntimeEnvValues) {
  try {
    return await getAudioDurationSeconds(audioPath, envOverrides);
  } catch {
    return 0;
  }
}
