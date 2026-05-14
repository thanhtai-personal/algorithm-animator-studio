import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_VIDEO_PUBLIC_PATH,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedVideoDir,
} from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "../services/EnvFileService";
import {
  ensureDirectoryExists,
  getLocalDateFolderName,
  getUniqueOutputFileWithExtension,
  sanitizeFileBaseName,
} from "./audioOutput";

export function createVideoOutput(videoFileName: string | undefined, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const generatedVideoDir = getGeneratedVideoDir(env.SERVER_DATA_DIR);
  const dateFolderName = getLocalDateFolderName();
  const dateOutputDir = path.join(generatedVideoDir, dateFolderName);
  const baseFileName = sanitizeVideoBaseName(videoFileName || `video-${Date.now()}`);

  ensureDirectoryExists(dateOutputDir);

  const { outputFileName, outputPath } = getUniqueOutputFileWithExtension({
    baseName: baseFileName,
    extension: "mp4",
    outputDir: dateOutputDir,
  });

  const relativePath = `${dateFolderName}/${outputFileName}`;

  return {
    dateFolderName,
    outputFileName,
    outputPath,
    relativePath,
    videoUrl: buildGeneratedFileUrl(GENERATED_VIDEO_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
  };
}

export function resolveGeneratedVideoPath(relativePath: string, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const generatedVideoDir = getGeneratedVideoDir(env.SERVER_DATA_DIR);
  const normalizedRelativePath = normalizeGeneratedVideoRelativePath(relativePath);
  const absolutePath = path.resolve(generatedVideoDir, normalizedRelativePath);
  const rootPath = path.resolve(generatedVideoDir);

  if (!absolutePath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error("Đường dẫn video không hợp lệ.");
  }

  return {
    absolutePath,
    relativePath: normalizedRelativePath.replaceAll(path.sep, "/"),
  };
}

export function listGeneratedVideos(envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const generatedVideoDir = getGeneratedVideoDir(env.SERVER_DATA_DIR);

  if (!fs.existsSync(generatedVideoDir)) {
    return [];
  }

  return fs
    .readdirSync(generatedVideoDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((folder) => listVideosInFolder(folder.name, generatedVideoDir, env))
    .sort((first, second) => second.createdAtMs - first.createdAtMs);
}

function normalizeGeneratedVideoRelativePath(relativePath: string) {
  const normalized = path.normalize(relativePath || "");

  if (!normalized || path.isAbsolute(normalized) || normalized.startsWith("..")) {
    throw new Error("Đường dẫn video không hợp lệ.");
  }

  if (path.extname(normalized).toLowerCase() !== ".mp4") {
    throw new Error("Chỉ hỗ trợ upload video MP4 đã tạo.");
  }

  return normalized;
}

function sanitizeVideoBaseName(fileName: string) {
  return sanitizeFileBaseName(fileName.replace(/\.(mp4|mov|m4v|webm)$/i, ""));
}

function listVideosInFolder(folderName: string, generatedVideoDir: string, env: RuntimeEnvValues) {
  const folderPath = path.join(generatedVideoDir, folderName);

  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp4"))
    .map((entry) => {
      const filePath = path.join(folderPath, entry.name);
      const stat = fs.statSync(filePath);
      const relativePath = `${folderName}/${entry.name}`;

      return {
        fileName: entry.name,
        relativePath,
        videoUrl: buildGeneratedFileUrl(GENERATED_VIDEO_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
        sizeBytes: stat.size,
        createdAtMs: stat.mtimeMs,
      };
    });
}
