import fs from "node:fs";
import { spawn } from "node:child_process";
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
import { listYoutubeUploadHistory } from "./YoutubeUploadHistoryService";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import {
  ensureDirectoryExists,
  getLocalDateFolderName,
  getUniqueOutputFileWithExtension,
  sanitizeFileBaseName,
} from "../utils/audioOutput";
import { getAudioDurationSeconds } from "../utils/ffmpeg";

const AUDIO_EXTENSIONS = new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg", ".opus"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".webm"]);
const BACKGROUND_MUSIC_EXTENSIONS = AUDIO_EXTENSIONS;
const BACKGROUND_MUSIC_UPLOAD_LIMIT = 300 * 1024 * 1024;

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
      extensions: BACKGROUND_MUSIC_EXTENSIONS,
      kind: "music",
      publicBasePath: GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH,
      serverOrigin,
    }),
    uploads: listYoutubeUploadHistory(envOverrides),
  };
}

export async function saveBackgroundMusicResource(
  file: Express.Multer.File,
  envOverrides: RuntimeEnvValues = {}
) {
  validateBackgroundMusicUpload(file);
  await getAudioDurationSeconds(file.path, envOverrides);

  const env = readEnvValues(envOverrides);
  const dateFolderName = getLocalDateFolderName();
  const outputDir = path.join(getGeneratedBackgroundMusicDir(env.SERVER_DATA_DIR), dateFolderName);
  const extension = path.extname(file.originalname).toLowerCase().replace(".", "") || "mp3";
  const baseName = sanitizeFileBaseName(file.originalname || "background-music");

  ensureDirectoryExists(outputDir);

  const output = getUniqueOutputFileWithExtension({
    baseName,
    extension,
    outputDir,
  });

  fs.renameSync(file.path, output.outputPath);

  const relativePath = `${dateFolderName}/${output.outputFileName}`;
  const stat = fs.statSync(output.outputPath);

  return {
    kind: "music" as const,
    fileName: output.outputFileName,
    relativePath,
    url: buildGeneratedFileUrl(
      GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH,
      relativePath,
      env.SERVER_ORIGIN || SERVER_ORIGIN
    ),
    sizeBytes: stat.size,
    createdAtMs: stat.mtimeMs,
  };
}

export function deleteGeneratedResource(params: {
  kind: GeneratedResource["kind"];
  relativePath: string;
  envOverrides?: RuntimeEnvValues;
}) {
  const resourcePath = resolveGeneratedResourcePath(params, params.envOverrides);

  if (!fs.existsSync(resourcePath.absolutePath)) {
    throw new Error("Không tìm thấy tài nguyên.");
  }

  fs.rmSync(resourcePath.absolutePath, { force: true });

  return { ok: true };
}

export function openGeneratedResourceFolder(params: {
  kind: GeneratedResource["kind"];
  relativePath: string;
  envOverrides?: RuntimeEnvValues;
}) {
  const resourcePath = resolveGeneratedResourcePath(params, params.envOverrides);
  const folderPath = path.dirname(resourcePath.absolutePath);

  if (!fs.existsSync(folderPath)) {
    throw new Error("Không tìm thấy thư mục chứa tài nguyên.");
  }

  openFolder(folderPath);

  return { ok: true };
}

export function resolveGeneratedResource(
  params: {
    kind: GeneratedResource["kind"];
    relativePath: string;
  },
  envOverrides: RuntimeEnvValues = {}
) {
  return resolveGeneratedResourcePath(params, envOverrides);
}

function listGeneratedResources(params: {
  directory: string;
  extensions: Set<string>;
  kind: GeneratedResource["kind"];
  publicBasePath: string;
  serverOrigin: string;
}): GeneratedResource[] {
  if (!fs.existsSync(params.directory)) {
    return [];
  }

  return listResourcesRecursively(params, params.directory).sort(
    (first, second) => second.createdAtMs - first.createdAtMs
  );
}

function resolveGeneratedResourcePath(
  params: {
    kind: GeneratedResource["kind"];
    relativePath: string;
  },
  envOverrides: RuntimeEnvValues = {}
) {
  const env = readEnvValues(envOverrides);
  const rootPath = path.resolve(getResourceRootPath(params.kind, env.SERVER_DATA_DIR));
  const extensionSet = getResourceExtensionSet(params.kind);
  const normalizedRelativePath = path.normalize(params.relativePath || "");

  if (
    !normalizedRelativePath ||
    path.isAbsolute(normalizedRelativePath) ||
    normalizedRelativePath.startsWith("..")
  ) {
    throw new Error("Đường dẫn tài nguyên không hợp lệ.");
  }

  if (!extensionSet.has(path.extname(normalizedRelativePath).toLowerCase())) {
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

function getResourceRootPath(kind: GeneratedResourceKind, serverDataDir?: string) {
  if (kind === "audio") {
    return getGeneratedDir(serverDataDir);
  }

  if (kind === "video") {
    return getGeneratedVideoDir(serverDataDir);
  }

  return getGeneratedBackgroundMusicDir(serverDataDir);
}

function getResourceExtensionSet(kind: GeneratedResourceKind) {
  if (kind === "video") {
    return VIDEO_EXTENSIONS;
  }

  if (kind === "music") {
    return BACKGROUND_MUSIC_EXTENSIONS;
  }

  return AUDIO_EXTENSIONS;
}

function validateBackgroundMusicUpload(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.size > BACKGROUND_MUSIC_UPLOAD_LIMIT) {
    throw new Error("Nhạc nền không được vượt quá 300MB.");
  }

  if (!file.mimetype.startsWith("audio/") || !BACKGROUND_MUSIC_EXTENSIONS.has(extension)) {
    throw new Error("Chỉ hỗ trợ nhạc nền wav, mp3, m4a, aac, ogg hoặc opus.");
  }
}

function openFolder(folderPath: string) {
  const platform = process.platform;
  const command =
    platform === "win32"
      ? "explorer"
      : platform === "darwin"
        ? "open"
        : "xdg-open";

  const child = spawn(command, [folderPath], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

function listResourcesRecursively(
  params: {
    directory: string;
    extensions: Set<string>;
    kind: GeneratedResource["kind"];
    publicBasePath: string;
    serverOrigin: string;
  },
  currentDirectory: string
): GeneratedResource[] {
  return fs.readdirSync(currentDirectory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(currentDirectory, entry.name);

    if (entry.isDirectory()) {
      return listResourcesRecursively(params, entryPath);
    }

    if (!entry.isFile() || !params.extensions.has(path.extname(entry.name).toLowerCase())) {
      return [];
    }

    const stat = fs.statSync(entryPath);
    const relativePath = path.relative(params.directory, entryPath).replaceAll(path.sep, "/");

    return [
      {
        kind: params.kind,
        fileName: entry.name,
        relativePath,
        url: buildGeneratedFileUrl(params.publicBasePath, relativePath, params.serverOrigin),
        sizeBytes: stat.size,
        createdAtMs: stat.mtimeMs,
      },
    ];
  });
}
