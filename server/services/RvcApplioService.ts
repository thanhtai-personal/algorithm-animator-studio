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
import { DEFAULT_RVC_APPLIO_TEMPLATE_VALUES, DEFAULT_RVC_APPLIO_TIMEOUT_MS } from "../config/rvcApplioDefaults";
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
import { readRvcTemplates, readRvcTtsTemplates, type RvcRuntimeTemplate } from "./RvcApplioTemplateParser";
import { assertApplioTemplateReady } from "./RvcApplioTemplateValidation";
import { buildPythonPackageInstallCommand, checkPythonPackage } from "./PythonPackageCheckService";

const CONFIG_TIMEOUT_MS = 3500;
const BRIDGE_PATH = path.join(PROJECT_ROOT, "scripts", "rvc-applio-gradio-bridge.py");

export async function getRvcApplioConfigStatus(envOverrides: RuntimeEnvValues = {}): Promise<RvcApplioConfigStatus> {
  const env = readEnvValues(envOverrides);
  let config: RvcRuntimeConfig;
  try {
    config = readRvcConfig(env);
  } catch (error) {
    const fallbackConfig = await withGradioClientStatus(readRvcConfigWithoutTemplates(env));
    return {
      ...fallbackConfig,
      enabled: false,
      serverOk: false,
      error: error instanceof Error ? error.message : "Cấu hình RVC/Applio không hợp lệ.",
    };
  }

  config = await withGradioClientStatus(config);

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
    timeoutMs: DEFAULT_RVC_APPLIO_TIMEOUT_MS,
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
    timeoutMs: DEFAULT_RVC_APPLIO_TIMEOUT_MS,
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
  assertApplioTemplateReady(params.template, { ttsVoice: params.ttsVoice });
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
  const ttsRuntimeTemplates = readRvcTtsTemplates(env);
  const primaryTemplate = runtimeTemplates[0];
  return {
    baseUrl: (env.RVC_APPLIO_BASE_URL || "http://127.0.0.1:6969").replace(/\/+$/g, ""),
    startCommand,
    startCommandConfigured: Boolean(startCommand.trim()),
    apiName: primaryTemplate?.apiName || env.RVC_APPLIO_API_NAME || "/infer_convert",
    modelName: primaryTemplate?.modelName || DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.modelName,
    indexPath: primaryTemplate?.indexPath || DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.indexPath,
    pythonExe,
    pythonExists: commandLooksExecutable(pythonExe),
    bridgeExists: fs.existsSync(BRIDGE_PATH),
    ...getDefaultGradioClientStatus(pythonExe),
    argTemplateConfigured: runtimeTemplates.some((template) => template.argTemplateConfigured),
    ttsTemplateConfigured: ttsRuntimeTemplates.some((template) => template.argTemplateConfigured),
    f0Method: primaryTemplate?.f0Method || DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.f0Method,
    pitch: primaryTemplate?.pitch ?? DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.pitch,
    indexRate: primaryTemplate?.indexRate ?? DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.indexRate,
    protect: primaryTemplate?.protect ?? DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.protect,
    filterRadius: primaryTemplate?.filterRadius ?? DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.filterRadius,
    templates: runtimeTemplates.map(toTemplateStatus),
    ttsTemplates: ttsRuntimeTemplates.map(toTemplateStatus),
    runtimeTemplates,
    ttsRuntimeTemplates,
  };
}

function readRvcConfigWithoutTemplates(env: RuntimeEnvValues): RvcRuntimeConfig {
  const startCommand = env.RVC_APPLIO_START_COMMAND || "";
  const pythonExe = resolveRuntimeExecutable(env.RVC_APPLIO_PYTHON || "python");
  return {
    baseUrl: (env.RVC_APPLIO_BASE_URL || "http://127.0.0.1:6969").replace(/\/+$/g, ""),
    startCommand,
    startCommandConfigured: Boolean(startCommand.trim()),
    apiName: env.RVC_APPLIO_API_NAME || "/infer_convert",
    modelName: DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.modelName,
    indexPath: DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.indexPath,
    pythonExe,
    pythonExists: commandLooksExecutable(pythonExe),
    bridgeExists: fs.existsSync(BRIDGE_PATH),
    ...getDefaultGradioClientStatus(pythonExe),
    argTemplateConfigured: false,
    ttsTemplateConfigured: false,
    f0Method: DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.f0Method,
    pitch: DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.pitch,
    indexRate: DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.indexRate,
    protect: DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.protect,
    filterRadius: DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.filterRadius,
    templates: [],
    ttsTemplates: [],
    runtimeTemplates: [],
    ttsRuntimeTemplates: [],
  };
}

function selectRvcTemplate(config: RvcRuntimeConfig, templateId?: string, mode: "convert" | "tts" = "convert") {
  const templates = mode === "tts" ? config.ttsRuntimeTemplates : config.runtimeTemplates;
  const selected = templateId
    ? templates.find((template) => template.id === templateId)
    : templates[0];
  if (selected) return selected;
  if (templateId) throw new Error(`Không tìm thấy Applio template: ${templateId}`);
  throw new Error(mode === "tts"
    ? "Chưa cấu hình Applio TTS template. Thêm ttsTemplates trong Settings -> Voice -> Applio."
    : "Chưa cấu hình Applio template. Thêm convertTemplates trong Settings -> Voice -> Applio.");
}

function toTemplateStatus(template: RvcRuntimeTemplate): RvcApplioTemplateStatus {
  const { argTemplate: _argTemplate, ...status } = template;
  return status;
}

function getDefaultGradioClientStatus(pythonExe: string) {
  return {
    gradioClientInstalled: false,
    gradioClientInstallCommand: buildPythonPackageInstallCommand(pythonExe, "gradio_client"),
  };
}

async function withGradioClientStatus(config: RvcRuntimeConfig): Promise<RvcRuntimeConfig> {
  const status = await checkPythonPackage(config.pythonExe, "gradio_client", CONFIG_TIMEOUT_MS);
  return {
    ...config,
    gradioClientInstalled: status.installed,
    gradioClientInstallCommand: status.installCommand,
    gradioClientCheckError: status.error,
  };
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
        reject(new Error(formatRvcBridgeError(command, code, cleanStderr, cleanStdout)));
        return;
      }
      resolve({ stdout: cleanStdout, stderr: cleanStderr });
    });
  });
}

function formatRvcBridgeError(command: string, code: number | null, stderr: string, stdout: string) {
  if (/No module named ['"]gradio_client['"]|Missing gradio_client/i.test(stderr)) {
    return JSON.stringify({
      message: "Python bridge RVC/Applio thiếu package gradio_client.",
      code,
      installCommand: `${command} -m pip install -U gradio_client`,
      hint: "Cài gradio_client vào đúng Python đang cấu hình trong RVC_APPLIO_PYTHON, hoặc trỏ RVC_APPLIO_PYTHON tới Python env của Applio.",
      stderr,
      stdout,
    }, null, 2);
  }

  return JSON.stringify({ message: "Python bridge RVC/Applio thất bại.", code, stderr, stdout }, null, 2);
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
