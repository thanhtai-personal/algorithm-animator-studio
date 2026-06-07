import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import {
  GENERATED_PUBLIC_PATH,
  PROJECT_ROOT,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedDir,
} from "../config/paths";
import type { VieneuConfigStatus, VieneuGenerateBody } from "../models/Vieneu";
import {
  ensureDirectoryExists,
  getLocalDateFolderName,
  getUniqueOutputFileWithExtension,
  sanitizeFileBaseName,
} from "../utils/audioOutput";
import { getAudioDurationSeconds } from "../utils/ffmpeg";
import { stripAnsi } from "../utils/text";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { resolveRuntimeExecutable } from "./RuntimeEnvService";

const HEALTH_PATH = path.join(PROJECT_ROOT, "scripts", "vieneu-health.py");
const BRIDGE_PATH = path.join(PROJECT_ROOT, "scripts", "vieneu-generate.py");
const DEFAULT_SOURCE_DIR = path.join(PROJECT_ROOT, "libs", "VieNeu-TTS");
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;
const CONFIG_TIMEOUT_MS = 8000;

export async function getVieneuConfigStatus(envOverrides: RuntimeEnvValues = {}): Promise<VieneuConfigStatus> {
  const env = readEnvValues(envOverrides);
  const config = readVieneuConfig(env);
  const baseStatus: VieneuConfigStatus = {
    enabled: false,
    sdkInstalled: false,
    pythonExe: config.pythonExe,
    pythonExists: commandLooksExecutable(config.pythonExe),
    bridgeExists: fs.existsSync(BRIDGE_PATH) && fs.existsSync(HEALTH_PATH),
    mode: config.mode,
    emotion: config.emotion,
    defaultVoiceId: config.defaultVoiceId,
    referenceAudioPath: config.referenceAudioPath,
    referenceAudioExists: Boolean(config.referenceAudioPath && fs.existsSync(config.referenceAudioPath)),
    referenceTextConfigured: Boolean(config.referenceText.trim()),
    remoteApiBase: config.remoteApiBase,
    remoteModel: config.remoteModel,
    timeoutMs: config.timeoutMs,
  };

  if (!baseStatus.pythonExists) {
    return { ...baseStatus, error: "Không tìm thấy Python để chạy VieNeu-TTS." };
  }
  if (!baseStatus.bridgeExists) {
    return { ...baseStatus, error: "Thiếu scripts/vieneu-health.py hoặc scripts/vieneu-generate.py." };
  }

  try {
    const result = await runProcess(config.pythonExe, [HEALTH_PATH], CONFIG_TIMEOUT_MS, config);
    const payload = parseJsonLine(result.stdout);
    return {
      ...baseStatus,
      enabled: Boolean(payload.sdkInstalled ?? payload.ok),
      sdkInstalled: Boolean(payload.sdkInstalled ?? payload.ok),
      version: stringValue(payload.version),
      error: payload.ok ? undefined : stringValue(payload.error) || result.stderr,
    };
  } catch (error) {
    return {
      ...baseStatus,
      error: error instanceof Error ? error.message : "Không kiểm tra được SDK VieNeu-TTS.",
    };
  }
}

export async function generateVieneuAudio(body: VieneuGenerateBody, envOverrides: RuntimeEnvValues = {}) {
  const text = normalizeText(body);
  if (!text) throw new Error("Chưa có text để tạo voice bằng VieNeu-TTS.");

  const env = readEnvValues(envOverrides);
  const config = readVieneuConfig(env);
  if (!fs.existsSync(BRIDGE_PATH)) throw new Error("Thiếu scripts/vieneu-generate.py.");
  if (!commandLooksExecutable(config.pythonExe)) throw new Error(`Không tìm thấy Python: ${config.pythonExe}`);

  const dateFolderName = getLocalDateFolderName();
  const outputDir = path.join(getGeneratedDir(env.SERVER_DATA_DIR), "vieneu", dateFolderName);
  ensureDirectoryExists(outputDir);

  const { outputFileName, outputPath } = getUniqueOutputFileWithExtension({
    baseName: sanitizeFileBaseName(body.fileName || "vieneu-voice"),
    extension: "wav",
    outputDir,
  });

  const mode = normalizeMode(body.mode || config.mode);
  const emotion = normalizeEmotion(body.emotion || config.emotion);
  const referenceAudioPath = resolveReferenceAudioPath(body.referenceAudioPath || config.referenceAudioPath);
  const payloadPath = path.join(outputDir, `${outputFileName}.payload.json`);
  fs.writeFileSync(payloadPath, JSON.stringify({
    text,
    outputPath,
    mode,
    emotion,
    voiceId: body.voiceId?.trim() || config.defaultVoiceId,
    referenceAudioPath,
    referenceText: body.referenceText?.trim() || config.referenceText,
    remoteApiBase: config.remoteApiBase,
    remoteModel: config.remoteModel,
  }, null, 2), "utf8");

  const result = await runProcess(config.pythonExe, [BRIDGE_PATH, "--payload", payloadPath], config.timeoutMs, config);
  if (!fs.existsSync(outputPath)) {
    throw new Error(JSON.stringify({
      message: "VieNeu-TTS chạy xong nhưng không tạo tệp âm thanh.",
      stdout: result.stdout,
      stderr: result.stderr,
    }, null, 2));
  }

  const relativePath = `vieneu/${dateFolderName}/${outputFileName}`;
  const durationSec = await readDurationOrZero(outputPath, envOverrides);

  return {
    ok: true,
    fileName: outputFileName,
    folderName: dateFolderName,
    relativePath,
    audioPath: outputPath,
    audioUrl: buildGeneratedFileUrl(GENERATED_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
    model: `VieNeu-TTS · ${mode}${emotion ? ` · ${emotion}` : ""}`,
    provider: "vieneu",
    mode,
    emotion,
    voiceId: body.voiceId?.trim() || config.defaultVoiceId,
    inputCharacters: text.length,
    segmentDurationsSec: durationSec > 0 ? [durationSec] : undefined,
    warning: result.stderr || "",
  };
}

type VieneuRuntimeConfig = {
  pythonExe: string;
  sourceDir: string;
  mode: string;
  emotion: string;
  defaultVoiceId: string;
  referenceAudioPath: string;
  referenceText: string;
  remoteApiBase: string;
  remoteModel: string;
  timeoutMs: number;
};

function readVieneuConfig(env: RuntimeEnvValues): VieneuRuntimeConfig {
  const sourceDir = resolveRuntimePath(env.VIENEU_SOURCE_DIR || DEFAULT_SOURCE_DIR);

  return {
    sourceDir,
    pythonExe: resolveVieneuPython(env.VIENEU_PYTHON || "", sourceDir),
    mode: normalizeMode(env.VIENEU_MODE || "turbo"),
    emotion: normalizeEmotion(env.VIENEU_EMOTION || "natural"),
    defaultVoiceId: env.VIENEU_DEFAULT_VOICE_ID || "",
    referenceAudioPath: resolveReferenceAudioPath(env.VIENEU_REFERENCE_AUDIO || ""),
    referenceText: env.VIENEU_REFERENCE_TEXT || "",
    remoteApiBase: (env.VIENEU_REMOTE_API_BASE || "http://127.0.0.1:23333/v1").replace(/\/+$/g, ""),
    remoteModel: env.VIENEU_REMOTE_MODEL || "pnnbao-ump/VieNeu-TTS-v2",
    timeoutMs: clampTimeout(env.VIENEU_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  };
}

function normalizeText(body: VieneuGenerateBody) {
  const fromSegments = Array.isArray(body.segments)
    ? body.segments.map((segment) => String(segment || "").trim()).filter(Boolean).join("\n")
    : "";
  return (fromSegments || body.text || "").trim();
}

function normalizeMode(value: string) {
  const mode = value.trim().toLowerCase();
  if (!mode) return "turbo";
  return ["standard", "turbo", "remote"].includes(mode) ? mode : "turbo";
}

function normalizeEmotion(value: string) {
  return value.trim().toLowerCase() || "natural";
}

function resolveVieneuPython(value: string, sourceDir: string) {
  const defaultVenvPython = getDefaultVenvPython(sourceDir);
  const requested = value.trim();
  const configured = resolveRuntimeExecutable(requested || defaultVenvPython);

  if (commandLooksExecutable(configured)) return configured;

  // Khi chưa tạo .venv trong libs/VieNeu-TTS, vẫn fallback sang Python global để
  // health-check báo đúng lỗi thiếu SDK/dependencies thay vì báo mất Python.
  if (!requested || samePath(configured, defaultVenvPython)) {
    return process.platform === "win32" ? "python" : "python3";
  }

  return configured;
}

function getDefaultVenvPython(sourceDir: string) {
  return process.platform === "win32"
    ? path.join(sourceDir, ".venv", "Scripts", "python.exe")
    : path.join(sourceDir, ".venv", "bin", "python");
}

function resolveRuntimePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(PROJECT_ROOT, trimmed);
}

function samePath(left: string, right: string) {
  return path.normalize(left).toLowerCase() === path.normalize(right).toLowerCase();
}

function resolveReferenceAudioPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(PROJECT_ROOT, trimmed);
}

function clampTimeout(value: unknown) {
  const timeout = Number(value);
  if (!Number.isFinite(timeout)) return DEFAULT_TIMEOUT_MS;
  return Math.round(Math.min(60 * 60 * 1000, Math.max(30_000, timeout)));
}

async function readDurationOrZero(audioPath: string, envOverrides: RuntimeEnvValues) {
  try {
    return await getAudioDurationSeconds(audioPath, envOverrides);
  } catch {
    return 0;
  }
}

function runProcess(command: string, args: string[], timeoutMs: number, config: VieneuRuntimeConfig): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: PROJECT_ROOT,
      env: buildVieneuProcessEnv(config),
      windowsHide: true,
    });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("VieNeu-TTS timeout."));
    }, timeoutMs);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data: Buffer) => { stdout += data.toString("utf8"); });
    child.stderr.on("data", (data: Buffer) => { stderr += data.toString("utf8"); });
    child.on("error", (error) => { clearTimeout(timeout); reject(new Error(`Không chạy được Python VieNeu-TTS: ${error.message}`)); });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const cleanStdout = stripAnsi(stdout);
      const cleanStderr = stripAnsi(stderr);
      if (code !== 0) {
        reject(new Error(JSON.stringify({
          message: "Python bridge VieNeu-TTS thất bại.",
          code,
          stderr: cleanStderr,
          stdout: cleanStdout,
          hint: buildVieneuFailureHint(cleanStdout, cleanStderr),
        }, null, 2)));
        return;
      }
      resolve({ stdout: cleanStdout, stderr: cleanStderr });
    });
  });
}

function parseJsonLine(stdout: string): Record<string, unknown> {
  const line = stdout.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).find((item) => item.startsWith("{"));
  if (!line) return {};
  try {
    const parsed = JSON.parse(line) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildVieneuProcessEnv(config: VieneuRuntimeConfig): NodeJS.ProcessEnv {
  const sourceSrcDir = path.join(config.sourceDir, "src");
  const pythonPath = [
    fs.existsSync(sourceSrcDir) ? sourceSrcDir : "",
    process.env.PYTHONPATH || "",
  ].filter(Boolean).join(path.delimiter);

  return {
    ...process.env,
    VIENEU_SOURCE_DIR: config.sourceDir,
    VIENEU_PYTHON: config.pythonExe,
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    ...(pythonPath ? { PYTHONPATH: pythonPath } : {}),
  };
}

function buildVieneuFailureHint(stdout: string, stderr: string) {
  const output = `${stdout}
${stderr}`;
  if (/No module named|thiếu Python dependency|missingModules/i.test(output)) {
    return "VieNeu import được source nhưng thiếu dependency trong Python/.venv. Chạy npm run vieneu:install rồi thử lại.";
  }
  if (/llama_cpp|llama-cpp-python/i.test(output)) {
    return "VieNeu Turbo/Standard cần llama-cpp-python. Chạy npm run vieneu:install để cài wheel phù hợp.";
  }
  return "Chạy npm run vieneu:health để xem dependency VieNeu đang thiếu.";
}

function commandLooksExecutable(command: string) {
  if (command === "python" || command === "python3" || command === "py") return true;
  return fs.existsSync(command);
}
