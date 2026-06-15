import path from "node:path";
import { APP_ROOT, KATA_STUDIO_HOME, PROJECT_ROOT } from "../config/paths";
import { pickKnownEnv, type RuntimeEnvValues } from "./EnvFileService";

type HeaderReader = {
  header(name: string): string | undefined;
};

export function readRuntimeEnvFromRequest(req: HeaderReader): RuntimeEnvValues {
  const headerValue = req.header("X-Kata-Settings") || req.header("x-kata-settings") || "";
  return readRuntimeEnvFromEncodedSettings(headerValue);
}

export function readRuntimeEnvFromEncodedSettings(headerValue: string): RuntimeEnvValues {
  if (!headerValue.trim()) {
    return {};
  }

  try {
    const normalized = headerValue.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return normalizeRuntimePaths(pickKnownEnv(parsed));
  } catch {
    return {};
  }
}

export function resolveRuntimeExecutable(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (path.isAbsolute(trimmed) || !looksLikePath(trimmed)) {
    return trimmed;
  }

  return path.resolve(PROJECT_ROOT, trimmed);
}

function normalizeRuntimePaths(env: RuntimeEnvValues): RuntimeEnvValues {
  const normalized = { ...env };

  for (const key of ["MODEL_DIR", "SERVER_DATA_DIR", "MUSIC_LIBRARY_DIR"]) {
    if (normalized[key]) {
      normalized[key] = resolveRuntimePath(normalized[key], getWritableRelativeRoot());
    }
  }

  for (const key of ["PIPER_EXE", "FFMPEG_EXE", "FFPROBE_EXE", "RVC_APPLIO_PYTHON", "VIENEU_PYTHON", "YOUTUBE_TOOLS_PYTHON", "YOUTUBE_DLP_EXE", "WHISPER_EXE"]) {
    if (normalized[key]) {
      normalized[key] = resolveRuntimeExecutable(normalized[key]);
    }
  }

  if (normalized.VIENEU_REFERENCE_AUDIO && looksLikePath(normalized.VIENEU_REFERENCE_AUDIO)) {
    normalized.VIENEU_REFERENCE_AUDIO = resolveRuntimePath(normalized.VIENEU_REFERENCE_AUDIO, getWritableRelativeRoot());
  }

  if (normalized.YOUTUBE_COOKIES_FILE && looksLikePath(normalized.YOUTUBE_COOKIES_FILE)) {
    normalized.YOUTUBE_COOKIES_FILE = resolveRuntimePath(normalized.YOUTUBE_COOKIES_FILE, getWritableRelativeRoot());
  }

  return normalized;
}

function getWritableRelativeRoot(): string {
  return process.env.KATA_DESKTOP_RUNTIME === "true" ? KATA_STUDIO_HOME : APP_ROOT;
}

function resolveRuntimePath(value: string, rootPath: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  return path.isAbsolute(trimmed) ? trimmed : path.resolve(rootPath, trimmed);
}

function looksLikePath(value: string): boolean {
  return value.includes("/") || value.includes("\\");
}
