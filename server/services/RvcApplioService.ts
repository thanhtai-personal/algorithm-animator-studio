import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import {
  GENERATED_PUBLIC_PATH,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedDir,
  PROJECT_ROOT,
} from "../config/paths";
import type { RvcApplioConfigStatus, RvcApplioConvertBody, RvcApplioTemplateStatus, RvcApplioTextToSpeechBody } from "../models/RvcApplio";
import {
  ensureDirectoryExists,
  getLocalDateFolderName,
  getUniqueOutputFileWithExtension,
  sanitizeFileBaseName,
} from "../utils/audioOutput";
import { getAudioDurationSeconds } from "../utils/ffmpeg";
import { stripAnsi } from "../utils/text";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { resolveGeneratedResource } from "./ResourceService";
import { resolveRuntimeExecutable } from "./RuntimeEnvService";

const CONFIG_TIMEOUT_MS = 3500;
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;
const BRIDGE_PATH = path.join(PROJECT_ROOT, "scripts", "rvc-applio-gradio-bridge.py");

export async function getRvcApplioConfigStatus(envOverrides: RuntimeEnvValues = {}): Promise<RvcApplioConfigStatus> {
  const env = readEnvValues(envOverrides);
  let config: RvcRuntimeConfig;
  try {
    config = readRvcConfig(env);
  } catch (error) {
    return {
      ...readRvcConfig({ ...env, RVC_APPLIO_TEMPLATES_JSON: "", RVC_APPLIO_TTS_TEMPLATES_JSON: "", RVC_APPLIO_ARG_TEMPLATE_JSON: "" }),
      enabled: false,
      serverOk: false,
      error: error instanceof Error ? error.message : "Cấu hình RVC/Applio không hợp lệ.",
    };
  }

  try {
    await fetchWithTimeout(config.baseUrl, { method: "GET" }, CONFIG_TIMEOUT_MS);
    return { ...config, enabled: config.argTemplateConfigured || config.ttsTemplateConfigured, serverOk: true };
  } catch (error) {
    return {
      ...config,
      enabled: config.argTemplateConfigured || config.ttsTemplateConfigured,
      serverOk: false,
      error: error instanceof Error ? error.message : "Không kết nối được RVC/Applio server.",
    };
  }
}

export async function convertRvcApplioAudio(body: RvcApplioConvertBody, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const config = readRvcConfig(env);
  const template = selectRvcTemplate(config, body.templateId);
  const source = resolveGeneratedResource({ kind: "audio", relativePath: body.audioRelativePath }, envOverrides);

  if (!fs.existsSync(source.absolutePath)) {
    throw new Error("Không tìm thấy file audio nguồn để chuyển voice.");
  }

  const dateFolderName = getLocalDateFolderName();
  const outputDir = path.join(getGeneratedDir(env.SERVER_DATA_DIR), "rvc-applio", dateFolderName);
  ensureDirectoryExists(outputDir);

  const sourceBaseName = path.basename(source.relativePath, path.extname(source.relativePath));
  const { outputFileName, outputPath } = getUniqueOutputFileWithExtension({
    baseName: sanitizeFileBaseName(body.fileName || `${sourceBaseName}-custom-voice`),
    extension: "wav",
    outputDir,
  });

  await runApplioBridge({
    config,
    template,
    inputPath: source.absolutePath,
    outputPath,
    pitch: clampPitch(body.pitch ?? template.pitch),
    f0Method: normalizeF0Method(body.f0Method || template.f0Method),
    indexRate: clampRatio(body.indexRate ?? template.indexRate),
    protect: clampRatio(body.protect ?? template.protect),
    filterRadius: clampInteger(body.filterRadius ?? template.filterRadius, 0, 7),
    timeoutMs: Number(env.RVC_APPLIO_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  });

  const relativePath = `rvc-applio/${dateFolderName}/${outputFileName}`;
  const durationSec = await readDurationOrZero(outputPath, envOverrides);
  return {
    ok: true,
    fileName: outputFileName,
    folderName: dateFolderName,
    relativePath,
    audioPath: outputPath,
    audioUrl: buildGeneratedFileUrl(GENERATED_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
    model: `RVC/Applio · ${template.label || template.modelName || "selected model"}`,
    rvcModelName: template.modelName,
    sourceRelativePath: source.relativePath,
    segmentDurationsSec: durationSec > 0 ? [durationSec] : undefined,
  };
}

export async function generateRvcApplioSpeech(body: RvcApplioTextToSpeechBody, envOverrides: RuntimeEnvValues = {}) {
  const text = body.text?.trim();
  if (!text) throw new Error("Chưa có text để tạo voice bằng Applio.");

  const env = readEnvValues(envOverrides);
  const config = readRvcConfig(env);
  const template = selectRvcTemplate(config, body.templateId, "tts");
  const dateFolderName = getLocalDateFolderName();
  const outputDir = path.join(getGeneratedDir(env.SERVER_DATA_DIR), "rvc-applio-tts", dateFolderName);
  ensureDirectoryExists(outputDir);

  const { outputFileName, outputPath } = getUniqueOutputFileWithExtension({ baseName: sanitizeFileBaseName(body.fileName || "applio-tts"), extension: "wav", outputDir });

  await runApplioBridge({
    config,
    template,
    outputPath,
    text,
    ttsVoice: body.ttsVoice || template.ttsVoice || "",
    ttsSpeed: clampInteger(body.ttsSpeed ?? template.ttsSpeed ?? 0, -100, 100),
    timeoutMs: Number(env.RVC_APPLIO_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  });

  const relativePath = `rvc-applio-tts/${dateFolderName}/${outputFileName}`;
  const durationSec = await readDurationOrZero(outputPath, envOverrides);
  return {
    ok: true,
    fileName: outputFileName,
    folderName: dateFolderName,
    relativePath,
    audioPath: outputPath,
    audioUrl: buildGeneratedFileUrl(GENERATED_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
    model: `Applio TTS/RVC · ${template.label || template.modelName || template.ttsVoice || "selected voice"}`,
    rvcModelName: template.modelName,
    segmentDurationsSec: durationSec > 0 ? [durationSec] : undefined,
  };
}

type RvcRuntimeConfig = Omit<RvcApplioConfigStatus, "enabled" | "serverOk" | "error"> & { runtimeTemplates: RvcRuntimeTemplate[]; ttsRuntimeTemplates: RvcRuntimeTemplate[] };

type RvcRuntimeTemplate = RvcApplioTemplateStatus & { argTemplate: unknown[] };

type ConvertSegmentParams = {
  config: RvcRuntimeConfig;
  template: RvcRuntimeTemplate;
  inputPath?: string;
  outputPath: string;
  text?: string;
  pitch?: number;
  f0Method?: string;
  indexRate?: number;
  protect?: number;
  filterRadius?: number;
  ttsVoice?: string;
  ttsSpeed?: number;
  timeoutMs: number;
};

async function runApplioBridge(params: ConvertSegmentParams) {
  const payloadPath = path.join(path.dirname(params.outputPath), `${path.basename(params.outputPath)}.payload.json`);
  fs.writeFileSync(payloadPath, JSON.stringify({
    baseUrl: params.config.baseUrl,
    apiName: params.template.apiName,
    inputPath: params.inputPath || "",
    outputPath: params.outputPath,
    text: params.text || "",
    modelName: params.template.modelName,
    indexPath: params.template.indexPath,
    pitch: params.pitch ?? params.template.pitch,
    f0Method: params.f0Method ?? params.template.f0Method,
    indexRate: params.indexRate ?? params.template.indexRate,
    protect: params.protect ?? params.template.protect,
    filterRadius: params.filterRadius ?? params.template.filterRadius,
    ttsVoice: params.ttsVoice || params.template.ttsVoice || "",
    ttsSpeed: params.ttsSpeed ?? params.template.ttsSpeed ?? 0,
    argTemplate: params.template.argTemplate,
  }, null, 2));

  const result = await runProcess(params.config.pythonExe, [BRIDGE_PATH, "--payload", payloadPath], params.timeoutMs);

  if (!fs.existsSync(params.outputPath)) {
    throw new Error(JSON.stringify({
      message: "RVC/Applio chạy xong nhưng không tạo tệp âm thanh.",
      stdout: result.stdout,
      stderr: result.stderr,
    }, null, 2));
  }
}

function readRvcConfig(env: RuntimeEnvValues): RvcRuntimeConfig {
  const startCommand = env.RVC_APPLIO_START_COMMAND || "";
  const pythonExe = resolveRuntimeExecutable(env.RVC_APPLIO_PYTHON || "python");
  const runtimeTemplates = readRvcTemplates(env);
  const ttsRuntimeTemplates = parseTemplatesJson(env.RVC_APPLIO_TTS_TEMPLATES_JSON, env, "RVC_APPLIO_TTS_TEMPLATES_JSON");
  const primaryTemplate = runtimeTemplates[0];
  return {
    baseUrl: (env.RVC_APPLIO_BASE_URL || "http://127.0.0.1:6969").replace(/\/+$/g, ""),
    startCommand,
    startCommandConfigured: Boolean(startCommand.trim()),
    apiName: primaryTemplate?.apiName || env.RVC_APPLIO_API_NAME || "/infer_convert",
    modelName: primaryTemplate?.modelName || env.RVC_APPLIO_MODEL_NAME || "",
    indexPath: primaryTemplate?.indexPath || env.RVC_APPLIO_INDEX_PATH || "",
    pythonExe,
    pythonExists: commandLooksExecutable(pythonExe),
    bridgeExists: fs.existsSync(BRIDGE_PATH),
    argTemplateConfigured: runtimeTemplates.some((template) => template.argTemplateConfigured),
    ttsTemplateConfigured: ttsRuntimeTemplates.some((template) => template.argTemplateConfigured),
    f0Method: primaryTemplate?.f0Method || normalizeF0Method(env.RVC_APPLIO_F0_METHOD || "rmvpe"),
    pitch: primaryTemplate?.pitch ?? clampPitch(env.RVC_APPLIO_PITCH),
    indexRate: primaryTemplate?.indexRate ?? clampRatio(env.RVC_APPLIO_INDEX_RATE || 0.75),
    protect: primaryTemplate?.protect ?? clampRatio(env.RVC_APPLIO_PROTECT || 0.33),
    filterRadius: primaryTemplate?.filterRadius ?? clampInteger(env.RVC_APPLIO_FILTER_RADIUS || 3, 0, 7),
    templates: runtimeTemplates.map(toTemplateStatus),
    ttsTemplates: ttsRuntimeTemplates.map(toTemplateStatus),
    runtimeTemplates,
    ttsRuntimeTemplates,
  };
}

function readRvcTemplates(env: RuntimeEnvValues): RvcRuntimeTemplate[] {
  const configuredTemplates = parseTemplatesJson(env.RVC_APPLIO_TEMPLATES_JSON, env, "RVC_APPLIO_TEMPLATES_JSON");
  if (configuredTemplates.length > 0) return configuredTemplates;

  if (!env.RVC_APPLIO_ARG_TEMPLATE_JSON?.trim()) return [];
  return [{
    id: "default",
    label: env.RVC_APPLIO_MODEL_NAME || "Default Applio voice",
    apiName: env.RVC_APPLIO_API_NAME || "/infer_convert",
    modelName: env.RVC_APPLIO_MODEL_NAME || "",
    indexPath: env.RVC_APPLIO_INDEX_PATH || "",
    argTemplate: parseArgTemplate(env.RVC_APPLIO_ARG_TEMPLATE_JSON),
    argTemplateConfigured: true,
    f0Method: normalizeF0Method(env.RVC_APPLIO_F0_METHOD || "rmvpe"),
    pitch: clampPitch(env.RVC_APPLIO_PITCH),
    indexRate: clampRatio(env.RVC_APPLIO_INDEX_RATE || 0.75),
    protect: clampRatio(env.RVC_APPLIO_PROTECT || 0.33),
    filterRadius: clampInteger(env.RVC_APPLIO_FILTER_RADIUS || 3, 0, 7),
  }];
}

function parseTemplatesJson(value: string | undefined, env: RuntimeEnvValues, envKey: string): RvcRuntimeTemplate[] {
  if (!value?.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${envKey} phải là JSON array hợp lệ.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${envKey} phải là một JSON array.`);
  }

  return parsed.map((item, index) => normalizeTemplateItem(item, index, env, envKey));
}

function normalizeTemplateItem(item: unknown, index: number, env: RuntimeEnvValues, envKey: string): RvcRuntimeTemplate {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`${envKey} item #${index + 1} phải là object.`);
  }
  const record = item as Record<string, unknown>;
  const rawId = stringValue(record.id) || stringValue(record.name) || `template-${index + 1}`;
  const modelName = stringValue(record.modelName) || stringValue(record.model) || env.RVC_APPLIO_MODEL_NAME || "";
  const label = stringValue(record.label) || stringValue(record.name) || modelName || `Applio template ${index + 1}`;
  return {
    id: sanitizeTemplateId(rawId, index),
    label,
    apiName: stringValue(record.apiName) || env.RVC_APPLIO_API_NAME || "/infer_convert",
    modelName,
    indexPath: stringValue(record.indexPath) || stringValue(record.index) || env.RVC_APPLIO_INDEX_PATH || "",
    argTemplate: readTemplateArgs(record, env),
    argTemplateConfigured: true,
    f0Method: normalizeF0Method(stringValue(record.f0Method) || env.RVC_APPLIO_F0_METHOD || "rmvpe"),
    pitch: clampPitch(record.pitch ?? env.RVC_APPLIO_PITCH),
    indexRate: clampRatio(record.indexRate ?? env.RVC_APPLIO_INDEX_RATE ?? 0.75),
    protect: clampRatio(record.protect ?? env.RVC_APPLIO_PROTECT ?? 0.33),
    filterRadius: clampInteger(record.filterRadius ?? env.RVC_APPLIO_FILTER_RADIUS ?? 3, 0, 7),
    ttsVoice: stringValue(record.ttsVoice) || stringValue(record.voice) || "",
    ttsSpeed: clampInteger(record.ttsSpeed ?? record.speed ?? 0, -100, 100),
  };
}

function readTemplateArgs(record: Record<string, unknown>, env: RuntimeEnvValues) {
  if (Array.isArray(record.argTemplate)) return record.argTemplate;
  if (typeof record.argTemplateJson === "string") return parseArgTemplate(record.argTemplateJson);
  return parseArgTemplate(env.RVC_APPLIO_ARG_TEMPLATE_JSON);
}

function selectRvcTemplate(config: RvcRuntimeConfig, templateId?: string, mode: "convert" | "tts" = "convert") {
  const templates = mode === "tts" ? config.ttsRuntimeTemplates : config.runtimeTemplates;
  const selected = templateId
    ? templates.find((template) => template.id === templateId)
    : templates[0];
  if (selected) return selected;
  if (templateId) throw new Error(`Không tìm thấy Applio template: ${templateId}`);
  throw new Error(mode === "tts"
    ? "Chưa cấu hình Applio TTS template. Thêm RVC_APPLIO_TTS_TEMPLATES_JSON trong Settings."
    : "Chưa cấu hình Applio template. Thêm RVC_APPLIO_TEMPLATES_JSON hoặc RVC_APPLIO_ARG_TEMPLATE_JSON trong Settings.");
}

function toTemplateStatus(template: RvcRuntimeTemplate): RvcApplioTemplateStatus {
  const { argTemplate: _argTemplate, ...status } = template;
  return status;
}

function parseArgTemplate(value?: string): unknown[] {
  if (!value?.trim()) {
    throw new Error("Chưa cấu hình RVC_APPLIO_ARG_TEMPLATE_JSON. Mở docs/rvc-applio-local-voice-provider.md và copy template API từ Applio/Gradio.");
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall through to a friendly error below.
  }

  throw new Error("RVC_APPLIO_ARG_TEMPLATE_JSON phải là một JSON array đúng định dạng Gradio API.");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeTemplateId(value: string, index: number) {
  const sanitized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || `template-${index + 1}`;
}

async function readDurationOrZero(audioPath: string, envOverrides: RuntimeEnvValues) {
  try {
    return await getAudioDurationSeconds(audioPath, envOverrides);
  } catch {
    return 0;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("RVC/Applio server phản hồi quá lâu.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function runProcess(command: string, args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("RVC/Applio conversion timeout."));
    }, timeoutMs);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data: Buffer) => { stdout += data.toString("utf8"); });
    child.stderr.on("data", (data: Buffer) => { stderr += data.toString("utf8"); });
    child.on("error", (error) => { clearTimeout(timeout); reject(new Error(`Không chạy được Python bridge RVC/Applio: ${error.message}`)); });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const cleanStdout = stripAnsi(stdout);
      const cleanStderr = stripAnsi(stderr);
      if (code !== 0) {
        reject(new Error(JSON.stringify({ message: "Python bridge RVC/Applio thất bại.", code, stderr: cleanStderr, stdout: cleanStdout }, null, 2)));
        return;
      }
      resolve({ stdout: cleanStdout, stderr: cleanStderr });
    });
  });
}

function clampPitch(value: unknown) { return clampInteger(value ?? 0, -24, 24); }
function clampInteger(value: unknown, min: number, max: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return min;
  return Math.round(Math.min(max, Math.max(min, numberValue)));
}
function clampRatio(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.min(1, Math.max(0, numberValue));
}
function normalizeF0Method(value: string) { return value.trim() || "rmvpe"; }

function commandLooksExecutable(command: string) {
  if (command === "python" || command === "python3" || command === "py") return true;
  return fs.existsSync(command);
}
