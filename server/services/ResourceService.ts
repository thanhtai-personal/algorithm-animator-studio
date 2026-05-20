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

export function deleteGeneratedResource(
  params: { kind: GeneratedResourceKind; relativePath: string },
  envOverrides: RuntimeEnvValues = {}
) {
  if (params.kind === "music") {
    throw new Error("Không hỗ trợ xóa nhạc nền từ màn hình quản lý này.");
  }

  const resolved = resolveGeneratedResource(params, envOverrides);
  if (!fs.existsSync(resolved.absolutePath)) {
    return { ok: true, deleted: 0, relativePath: resolved.relativePath };
  }

  fs.rmSync(resolved.absolutePath, { force: true });
  removeEmptyParents(path.dirname(resolved.absolutePath), path.resolve(getResourceRootPath(params.kind, readEnvValues(envOverrides).SERVER_DATA_DIR)));
  return { ok: true, deleted: 1, relativePath: resolved.relativePath };
}

export function deleteGeneratedResourcesByKind(kind: GeneratedResourceKind, envOverrides: RuntimeEnvValues = {}) {
  if (kind === "music") {
    throw new Error("Không hỗ trợ xóa nhạc nền từ màn hình quản lý này.");
  }

  const env = readEnvValues(envOverrides);
  const rootPath = path.resolve(getResourceRootPath(kind, env.SERVER_DATA_DIR));
  const extensions = getResourceExtensions(kind);
  if (!fs.existsSync(rootPath)) return { ok: true, deleted: 0, kind };

  const deleted = deleteFilesByExtension(rootPath, rootPath, extensions);
  removeEmptyParents(rootPath, rootPath);
  return { ok: true, deleted, kind };
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

function deleteFilesByExtension(rootPath: string, currentDirectory: string, extensions: Set<string>) {
  let deleted = 0;
  for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
    const entryPath = path.join(currentDirectory, entry.name);
    if (entry.isDirectory()) {
      deleted += deleteFilesByExtension(rootPath, entryPath, extensions);
      removeEmptyParents(entryPath, rootPath);
    } else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      fs.rmSync(entryPath, { force: true });
      deleted += 1;
    }
  }
  return deleted;
}

function removeEmptyParents(startDirectory: string, rootPath: string) {
  let current = path.resolve(startDirectory);
  const root = path.resolve(rootPath);
  while (current.startsWith(root) && current !== root && fs.existsSync(current)) {
    if (fs.readdirSync(current).length > 0) break;
    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}
