import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export const SERVER_ROOT = path.resolve(__dirname, "..");
export const APP_ROOT = path.resolve(SERVER_ROOT, "..");
export const DESKTOP_RESOURCE_ROOT = resolveDesktopResourceRoot();
export const PROJECT_ROOT = resolveProjectRoot();
export const KATA_STUDIO_HOME = resolveKataStudioHome();
export const RUNTIME_TOOLS_DIR = path.join(KATA_STUDIO_HOME, "tools");
export const MODEL_DIR = resolveDefaultModelDir();
function normalizeLegacyLocalUrl(value: string | undefined, legacyValues: string[], fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed || legacyValues.includes(trimmed)) {
    return fallback;
  }

  return trimmed;
}

export const PORT = Number(process.env.PORT || 5050);
export const SERVER_ORIGIN = normalizeLegacyLocalUrl(
  process.env.SERVER_ORIGIN,
  [],
  `http://localhost:${PORT}`
);
export const CLIENT_ORIGIN = normalizeLegacyLocalUrl(
  process.env.CLIENT_ORIGIN,
  [],
  process.env.CLIENT_ORIGIN || "http://localhost:3000"
);

export const PIPER_EXE = process.env.PIPER_EXE || getDefaultPiperExe();
export const FFMPEG_EXE = process.env.FFMPEG_EXE || resolvePackagedExecutable("@ffmpeg-installer/ffmpeg") || "ffmpeg";
export const FFPROBE_EXE = process.env.FFPROBE_EXE || resolvePackagedExecutable("@ffprobe-installer/ffprobe") || "ffprobe";

export const DEFAULT_SERVER_DATA_DIR = path.join(SERVER_ROOT, "data");
export const GENERATED_PUBLIC_PATH = "generated";
export const GENERATED_PREVIEW_PUBLIC_PATH = "generated-previews";
export const GENERATED_VIDEO_PUBLIC_PATH = "generated-videos";
export const GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH = "background-music";

export const SERVER_DATA_DIR = resolveConfiguredDataDir(process.env.SERVER_DATA_DIR);

export const GENERATED_DIR = getGeneratedDir(process.env.SERVER_DATA_DIR);
export const GENERATED_PREVIEW_DIR = getGeneratedPreviewDir(process.env.SERVER_DATA_DIR);
export const GENERATED_VIDEO_DIR = getGeneratedVideoDir(process.env.SERVER_DATA_DIR);
export const GENERATED_BACKGROUND_MUSIC_DIR = getGeneratedBackgroundMusicDir(process.env.SERVER_DATA_DIR);

export function resolveConfiguredDataDir(serverDataDir?: string): string {
  const trimmed = serverDataDir?.trim();

  if (!trimmed) {
    return DEFAULT_SERVER_DATA_DIR;
  }

  return path.isAbsolute(trimmed) ? trimmed : path.resolve(getWritableRelativeRoot(), trimmed);
}

function getWritableRelativeRoot() {
  return process.env.KATA_DESKTOP_RUNTIME === "true" ? KATA_STUDIO_HOME : APP_ROOT;
}

export function getGeneratedDir(serverDataDir?: string): string {
  return path.join(resolveConfiguredDataDir(serverDataDir), GENERATED_PUBLIC_PATH);
}

export function getGeneratedPreviewDir(serverDataDir?: string): string {
  return path.join(resolveConfiguredDataDir(serverDataDir), GENERATED_PREVIEW_PUBLIC_PATH);
}

export function getGeneratedVideoDir(serverDataDir?: string): string {
  return path.join(resolveConfiguredDataDir(serverDataDir), GENERATED_VIDEO_PUBLIC_PATH);
}

export function getGeneratedBackgroundMusicDir(serverDataDir?: string): string {
  return path.join(resolveConfiguredDataDir(serverDataDir), GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH);
}

export function buildGeneratedFileUrl(publicBasePath: string, relativePath: string, serverOrigin = SERVER_ORIGIN): string {
  const encodedRelativePath = relativePath.split(/[\\/]+/).map((part) => encodeURIComponent(part)).join("/");
  return `${serverOrigin}/${publicBasePath}/${encodedRelativePath}`;
}

function resolveDesktopResourceRoot() {
  const configured = process.env.KATA_DESKTOP_RESOURCE_ROOT?.trim();
  return configured ? path.resolve(configured) : "";
}

function resolveProjectRoot() {
  const configured = process.env.KATA_PROJECT_ROOT?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  if (process.env.KATA_DESKTOP_RUNTIME === "true" && DESKTOP_RESOURCE_ROOT) {
    return DESKTOP_RESOURCE_ROOT;
  }

  return APP_ROOT;
}

function resolveKataStudioHome() {
  const configured = process.env.KATA_STUDIO_HOME?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, "KAI STUDIO");
  }

  return path.join(os.homedir(), ".kata-studio");
}

function resolveDefaultModelDir() {
  const configured = process.env.MODEL_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  const localModelDir = path.join(APP_ROOT, "models");

  if (fs.existsSync(localModelDir)) {
    return localModelDir;
  }

  return localModelDir;
}

function getDefaultPiperExe() {
  const scriptsDir = process.platform === "win32" ? "Scripts" : "bin";
  const executableName = process.platform === "win32" ? "piper.exe" : "piper";
  return path.join(MODEL_DIR, ".venv", scriptsDir, executableName);
}

function resolvePackagedExecutable(packageName: string) {
  try {
    const mod = require(packageName) as { path?: string };
    return mod.path && fs.existsSync(mod.path) ? mod.path : "";
  } catch {
    return "";
  }
}
