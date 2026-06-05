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
import type { RvcApplioConfigStatus, RvcApplioConvertBody } from "../models/RvcApplio";
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
  const config = readRvcConfig(env);

  try {
    await fetchWithTimeout(config.baseUrl, { method: "GET" }, CONFIG_TIMEOUT_MS);
    return { ...config, enabled: true, serverOk: true };
  } catch (error) {
    return {
      ...config,
      enabled: Boolean(env.RVC_APPLIO_ARG_TEMPLATE_JSON?.trim()),
      serverOk: false,
      error: error instanceof Error ? error.message : "Không kết nối được RVC/Applio server.",
    };
  }
}

export async function convertRvcApplioAudio(body: RvcApplioConvertBody, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const config = readRvcConfig(env);
  const argTemplate = parseArgTemplate(env.RVC_APPLIO_ARG_TEMPLATE_JSON);
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

  await convertSegmentWithApplio({
    config,
    inputPath: source.absolutePath,
    outputPath,
    argTemplate,
    pitch: clampPitch(body.pitch ?? config.pitch),
    f0Method: normalizeF0Method(body.f0Method || config.f0Method),
    indexRate: clampRatio(body.indexRate ?? config.indexRate),
    protect: clampRatio(body.protect ?? config.protect),
    filterRadius: clampInteger(body.filterRadius ?? config.filterRadius, 0, 7),
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
    model: `RVC/Applio · ${config.modelName || "selected model"}`,
    rvcModelName: config.modelName,
    sourceRelativePath: source.relativePath,
    segmentDurationsSec: durationSec > 0 ? [durationSec] : undefined,
  };
}

type RvcRuntimeConfig = Omit<RvcApplioConfigStatus, "enabled" | "serverOk" | "error">;

type ConvertSegmentParams = {
  config: RvcRuntimeConfig;
  inputPath: string;
  outputPath: string;
  argTemplate: unknown[];
  pitch: number;
  f0Method: string;
  indexRate: number;
  protect: number;
  filterRadius: number;
  timeoutMs: number;
};

async function convertSegmentWithApplio(params: ConvertSegmentParams) {
  const payloadPath = path.join(path.dirname(params.outputPath), `${path.basename(params.outputPath)}.payload.json`);
  fs.writeFileSync(payloadPath, JSON.stringify({
    baseUrl: params.config.baseUrl,
    apiName: params.config.apiName,
    inputPath: params.inputPath,
    outputPath: params.outputPath,
    modelName: params.config.modelName,
    indexPath: params.config.indexPath,
    pitch: params.pitch,
    f0Method: params.f0Method,
    indexRate: params.indexRate,
    protect: params.protect,
    filterRadius: params.filterRadius,
    argTemplate: params.argTemplate,
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
  return {
    baseUrl: (env.RVC_APPLIO_BASE_URL || "http://127.0.0.1:6969").replace(/\/+$/g, ""),
    startCommand,
    startCommandConfigured: Boolean(startCommand.trim()),
    apiName: env.RVC_APPLIO_API_NAME || "/infer_convert",
    modelName: env.RVC_APPLIO_MODEL_NAME || "",
    indexPath: env.RVC_APPLIO_INDEX_PATH || "",
    pythonExe,
    pythonExists: commandLooksExecutable(pythonExe),
    bridgeExists: fs.existsSync(BRIDGE_PATH),
    argTemplateConfigured: Boolean(env.RVC_APPLIO_ARG_TEMPLATE_JSON?.trim()),
    f0Method: normalizeF0Method(env.RVC_APPLIO_F0_METHOD || "rmvpe"),
    pitch: clampPitch(env.RVC_APPLIO_PITCH),
    indexRate: clampRatio(env.RVC_APPLIO_INDEX_RATE || 0.75),
    protect: clampRatio(env.RVC_APPLIO_PROTECT || 0.33),
    filterRadius: clampInteger(env.RVC_APPLIO_FILTER_RADIUS || 3, 0, 7),
  };
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
