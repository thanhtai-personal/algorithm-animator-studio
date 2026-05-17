import path from "node:path";
import { APP_ROOT, PROJECT_ROOT } from "../config/paths";
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
      normalized[key] = resolveRuntimePath(normalized[key], APP_ROOT);
    }
  }

  for (const key of ["PIPER_EXE", "FFMPEG_EXE", "FFPROBE_EXE"]) {
    if (normalized[key]) {
      normalized[key] = resolveRuntimeExecutable(normalized[key]);
    }
  }

  return normalized;
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
