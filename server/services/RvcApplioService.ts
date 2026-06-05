import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
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
import type { RvcApplioConfigStatus, RvcApplioGenerateBody } from "../models/RvcApplio";
import {
  clampSentenceSilence,
  ensureDirectoryExists,
  getLocalDateFolderName,
  getUniqueOutputFileWithExtension,
  sanitizeFileBaseName,
} from "../utils/audioOutput";
import { getAudioDurationSeconds, runFfmpeg } from "../utils/ffmpeg";
import { stripAnsi } from "../utils/text";
import { runPiper } from "./PiperService";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { resolveRuntimeExecutable } from "./RuntimeEnvService";
import { validateGenerateRequest } from "./TtsGenerationService";

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

export async function generateRvcApplioAudio(body: RvcApplioGenerateBody, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const config = readRvcConfig(env);
  const argTemplate = parseArgTemplate(env.RVC_APPLIO_ARG_TEMPLATE_JSON);
  const validation = validateGenerateRequest({
    text: body.text,
    segments: body.segments,
    modelKey: body.piperModelKey || env.RVC_APPLIO_SOURCE_PIPER_MODEL || "vi_vais1000",
    fileName: body.fileName,
    sentenceSilence: body.sentenceSilence,
    speechRate: body.speechRate,
  }, envOverrides);

  if ("status" in validation) {
    throw new Error(String(validation.body?.error || validation.body?.message || "Yêu cầu Piper nguồn không hợp lệ."));
  }

  const segments = validation.cleanedSegments?.length ? validation.cleanedSegments : [validation.cleanedText];
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kata-rvc-applio-"));
  const convertedSegmentPaths: string[] = [];
  const sourceSegmentPaths: string[] = [];
  const segmentDurationsSec: number[] = [];

  try {
    const piperExe = resolveRuntimeExecutable(env.PIPER_EXE || "models/.venv/Scripts/piper.exe");
    const sentenceSilence = clampSentenceSilence(body.sentenceSilence ?? 0.08);
    const speechRate = clampSpeechRate(body.speechRate);

    for (let index = 0; index < segments.length; index += 1) {
      const indexLabel = String(index).padStart(5, "0");
      const sourcePath = path.join(tempDir, `${indexLabel}-source.wav`);
      const convertedPath = path.join(tempDir, `${indexLabel}-rvc.wav`);
      sourceSegmentPaths.push(sourcePath);
      convertedSegmentPaths.push(convertedPath);

      await runPiper({
        text: segments[index],
        modelPath: validation.selectedModel.modelPath,
        outputPath: sourcePath,
        sentenceSilence: 0,
        speechRate,
        piperExe,
      });

      await convertSegmentWithApplio({
        config,
        inputPath: sourcePath,
        outputPath: convertedPath,
        argTemplate,
        pitch: clampPitch(body.pitch ?? config.pitch),
        f0Method: normalizeF0Method(body.f0Method || config.f0Method),
        indexRate: clampRatio(body.indexRate ?? config.indexRate),
        protect: clampRatio(body.protect ?? config.protect),
        filterRadius: clampInteger(body.filterRadius ?? config.filterRadius, 0, 7),
        timeoutMs: Number(env.RVC_APPLIO_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
      });

      const measured = await readDurationOrZero(convertedPath, envOverrides);
      segmentDurationsSec.push(measured + (index < segments.length - 1 ? sentenceSilence : 0));
    }

    const dateFolderName = getLocalDateFolderName();
    const outputDir = path.join(getGeneratedDir(env.SERVER_DATA_DIR), "rvc-applio", dateFolderName);
    ensureDirectoryExists(outputDir);

    const { outputFileName, outputPath } = getUniqueOutputFileWithExtension({
      baseName: sanitizeFileBaseName(body.fileName || `rvc-applio-${crypto.randomUUID()}`),
      extension: "wav",
      outputDir,
    });

    if (convertedSegmentPaths.length === 1) {
      fs.copyFileSync(convertedSegmentPaths[0], outputPath);
    } else {
      await concatenateWithSilence(convertedSegmentPaths, outputPath, sentenceSilence, tempDir, envOverrides);
    }

    const relativePath = `rvc-applio/${dateFolderName}/${outputFileName}`;
    return {
      ok: true,
      fileName: outputFileName,
      folderName: dateFolderName,
      relativePath,
      audioPath: outputPath,
      audioUrl: buildGeneratedFileUrl(GENERATED_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
      model: `RVC/Applio · ${config.modelName || "selected model"}`,
      lang: validation.selectedModel.lang,
      speechRate,
      inputCharacters: validation.cleanedText.length,
      sourceModel: validation.selectedModel.label,
      rvcModelName: config.modelName,
      segmentDurationsSec: segmentDurationsSec.some(Boolean) ? segmentDurationsSec : undefined,
      sourceSegments: sourceSegmentPaths.length,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
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

async function concatenateWithSilence(
  inputPaths: string[],
  outputPath: string,
  silenceSeconds: number,
  tempDir: string,
  envOverrides: RuntimeEnvValues
) {
  const concatPaths = [...inputPaths];
  if (silenceSeconds > 0) {
    const silencePath = path.join(tempDir, "silence.wav");
    await runFfmpeg(["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", silenceSeconds.toFixed(3), silencePath], envOverrides);
    concatPaths.length = 0;
    inputPaths.forEach((item, index) => {
      concatPaths.push(item);
      if (index < inputPaths.length - 1) concatPaths.push(silencePath);
    });
  }

  const listPath = path.join(tempDir, "concat.txt");
  fs.writeFileSync(listPath, concatPaths.map((item) => `file '${escapeConcatPath(item)}'`).join("\n"), "utf8");
  await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c:a", "pcm_s16le", outputPath], envOverrides);
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

function escapeConcatPath(filePath: string) {
  return filePath.replace(/'/g, "'\\''").replace(/\\/g, "/");
}

function clampSpeechRate(value: unknown) {
  const speed = Number(value);
  if (!Number.isFinite(speed)) return 0.96;
  return Math.min(1.2, Math.max(0.7, speed));
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
