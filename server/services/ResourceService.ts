import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH,
  GENERATED_PUBLIC_PATH,
  GENERATED_VIDEO_PUBLIC_PATH,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedBackgroundMusicDir,
  getGeneratedDir,
  getGeneratedVideoDir,
} from "../config/paths";
import type { GeneratedResource, GeneratedResourceKind } from "../models/Resource";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";

const AUDIO_EXTENSIONS = new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg", ".opus"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".webm"]);

export function getResourceOverview(envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const serverOrigin = env.SERVER_ORIGIN || SERVER_ORIGIN;

  return {
    audio: listGeneratedResources({
      directory: getGeneratedDir(env.SERVER_DATA_DIR),
      extensions: AUDIO_EXTENSIONS,
      kind: "audio",
      publicBasePath: GENERATED_PUBLIC_PATH,
      serverOrigin,
    }),
    video: listGeneratedResources({
      directory: getGeneratedVideoDir(env.SERVER_DATA_DIR),
      extensions: VIDEO_EXTENSIONS,
      kind: "video",
      publicBasePath: GENERATED_VIDEO_PUBLIC_PATH,
      serverOrigin,
    }),
    music: listGeneratedResources({
      directory: getGeneratedBackgroundMusicDir(env.SERVER_DATA_DIR),
      extensions: AUDIO_EXTENSIONS,
      kind: "music",
      publicBasePath: GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH,
      serverOrigin,
    }),
  };
}

export function resolveGeneratedResource(
  params: { kind: GeneratedResourceKind; relativePath: string },
  envOverrides: RuntimeEnvValues = {}
) {
  const env = readEnvValues(envOverrides);
  const rootPath = path.resolve(getResourceRootPath(params.kind, env.SERVER_DATA_DIR));
  const normalizedRelativePath = path.normalize(params.relativePath || "");

  if (!normalizedRelativePath || path.isAbsolute(normalizedRelativePath) || normalizedRelativePath.startsWith("..")) {
    throw new Error("Đường dẫn tài nguyên không hợp lệ.");
  }

  const extension = path.extname(normalizedRelativePath).toLowerCase();
  if (!getResourceExtensions(params.kind).has(extension)) {
    throw new Error("Loại tài nguyên không hợp lệ.");
  }

  const absolutePath = path.resolve(rootPath, normalizedRelativePath);
  if (!absolutePath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error("Đường dẫn tài nguyên không hợp lệ.");
  }

  return {
    absolutePath,
    relativePath: normalizedRelativePath.replaceAll(path.sep, "/"),
  };
}

function listGeneratedResources(params: {
  directory: string;
  extensions: Set<string>;
  kind: GeneratedResourceKind;
  publicBasePath: string;
  serverOrigin: string;
}): GeneratedResource[] {
  if (!fs.existsSync(params.directory)) return [];

  return fs
    .readdirSync(params.directory, { withFileTypes: true })
    .flatMap((entry) => listEntry(params, entry.name, params.directory))
    .sort((first, second) => second.createdAtMs - first.createdAtMs);
}

function listEntry(
  params: {
    directory: string;
    extensions: Set<string>;
    kind: GeneratedResourceKind;
    publicBasePath: string;
    serverOrigin: string;
  },
  name: string,
  currentDirectory: string
): GeneratedResource[] {
  const entryPath = path.join(currentDirectory, name);
  const stat = fs.statSync(entryPath);

  if (stat.isDirectory()) {
    return fs.readdirSync(entryPath).flatMap((child) => listEntry(params, child, entryPath));
  }

  if (!stat.isFile() || !params.extensions.has(path.extname(name).toLowerCase())) {
    return [];
  }

  const relativePath = path.relative(params.directory, entryPath).replaceAll(path.sep, "/");
  return [{
    kind: params.kind,
    fileName: name,
    relativePath,
    url: buildGeneratedFileUrl(params.publicBasePath, relativePath, params.serverOrigin),
    sizeBytes: stat.size,
    createdAtMs: stat.mtimeMs,
  }];
}

function getResourceRootPath(kind: GeneratedResourceKind, serverDataDir?: string) {
  if (kind === "video") return getGeneratedVideoDir(serverDataDir);
  if (kind === "music") return getGeneratedBackgroundMusicDir(serverDataDir);
  return getGeneratedDir(serverDataDir);
}

function getResourceExtensions(kind: GeneratedResourceKind) {
  return kind === "video" ? VIDEO_EXTENSIONS : AUDIO_EXTENSIONS;
}
