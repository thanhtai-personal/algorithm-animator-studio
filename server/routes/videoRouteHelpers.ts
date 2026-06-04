import fs from "node:fs";
import path from "node:path";
import type { Response } from "express";
import type { GenerateVideoFromAudioBody, GenerateVideoFromTextBody } from "../models/Video";
import { GENERATED_PUBLIC_PATH, SERVER_ORIGIN, buildGeneratedFileUrl, getGeneratedDir } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "../services/EnvFileService";
import { generateElevenLabsAudio } from "../services/ElevenLabsService";
import { resolveGeneratedResource } from "../services/ResourceService";
import { generateAudioFile, validateGenerateRequest } from "../services/TtsGenerationService";
import { normalizeVideoBackgroundType } from "../services/VideoService";
import { getAudioDurationSeconds } from "../utils/ffmpeg";
import { ensureDirectoryExists, getLocalDateFolderName, getUniqueOutputFileWithExtension, sanitizeFileBaseName } from "../utils/audioOutput";

const BACKGROUND_LIMITS = {
  gif: 50 * 1024 * 1024,
  image: 20 * 1024 * 1024,
  video: 300 * 1024 * 1024,
} as const;
const MAX_BACKGROUND_VIDEO_SECONDS = 5 * 60;
const AUDIO_UPLOAD_LIMIT = 300 * 1024 * 1024;

export function resolveOptionalBackgroundMusic(
  body: {
    backgroundMusicRelativePath?: string;
    backgroundMusicVolume?: string;
    backgroundMusicLoop?: string;
    backgroundMusicFadeIn?: string;
    backgroundMusicFadeOut?: string;
  },
  envOverrides: RuntimeEnvValues = {}
) {
  const relativePath = String(body.backgroundMusicRelativePath || "").trim();

  return {
    backgroundMusicPath: relativePath
      ? resolveGeneratedResource(
          {
            kind: "music",
            relativePath,
          },
          envOverrides
        ).absolutePath
      : undefined,
    backgroundMusicVolume: normalizeNumber(body.backgroundMusicVolume, 0.12, 0, 1),
    backgroundMusicLoop: body.backgroundMusicLoop !== "false",
    backgroundMusicFadeIn: normalizeNumber(body.backgroundMusicFadeIn, 1.5, 0, 30),
    backgroundMusicFadeOut: normalizeNumber(body.backgroundMusicFadeOut, 2, 0, 30),
  };
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

async export function saveUploadedAudio(
  file: Express.Multer.File,
  envOverrides: RuntimeEnvValues = {}
) {
  const validationError = validateUploadedAudio(file);
  if (validationError) {
    throw new Error(validationError);
  }

  await getAudioDurationSeconds(file.path, envOverrides);

  const env = readEnvValues(envOverrides);
  const dateFolderName = getLocalDateFolderName();
  const outputDir = path.join(getGeneratedDir(env.SERVER_DATA_DIR), dateFolderName);
  const extension = path.extname(file.originalname).toLowerCase().replace(".", "") || "wav";
  const baseName = sanitizeFileBaseName(file.originalname);

  ensureDirectoryExists(outputDir);

  const output = getUniqueOutputFileWithExtension({
    baseName,
    extension,
    outputDir,
  });
  fs.renameSync(file.path, output.outputPath);

  return {
    absolutePath: output.outputPath,
    relativePath: `${dateFolderName}/${output.outputFileName}`,
  };
}


async export function generateNarrationAudio(
  body: GenerateVideoFromTextBody,
  envOverrides: RuntimeEnvValues = {}
) {
  if (body.provider === "pro") {
    if (!body.text?.trim()) {
      return { status: 400, body: { error: "Nội dung không được để trống." } };
    }

    if (!body.voiceId?.trim()) {
      return { status: 400, body: { error: "Chưa chọn giọng PRO." } };
    }

    if (!body.proModelId?.trim()) {
      return { status: 400, body: { error: "Chưa chọn chế độ PRO." } };
    }

    const audio = await generateElevenLabsAudio({
      text: body.text,
      modelId: body.proModelId,
      voiceId: body.voiceId,
      fileName: body.fileName || "video-audio-pro",
    }, envOverrides);
    const audioPath = resolveGeneratedResource(
      {
        kind: "audio",
        relativePath: audio.relativePath,
      },
      envOverrides
    );

    return {
      audio,
      audioPath: audioPath.absolutePath,
    };
  }

  const generateRequest = validateGenerateRequest(body, envOverrides);
  if ("status" in generateRequest) {
    return generateRequest;
  }

  const audio = await generateAudioFile(generateRequest, envOverrides);

  return {
    audio,
    audioPath: audio.audioPath,
  };
}

function validateUploadedAudio(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.size > AUDIO_UPLOAD_LIMIT) {
    return "Audio upload không được vượt quá 300MB.";
  }

  if (
    !file.mimetype.startsWith("audio/") ||
    ![".wav", ".mp3", ".m4a", ".aac", ".ogg", ".opus"].includes(extension)
  ) {
    return "Chỉ hỗ trợ upload audio wav, mp3, m4a, aac, ogg hoặc opus.";
  }

  return "";
}

export function sendError(res: Response, error: unknown) {
  return res.status(500).json({
    error: error instanceof Error ? error.message : "Tạo video thất bại.",
  });
}

async export function validateBackgroundFile(
  file: Express.Multer.File,
  backgroundType: keyof typeof BACKGROUND_LIMITS,
  envOverrides: RuntimeEnvValues = {}
) {
  const extension = path.extname(file.originalname).toLowerCase();
  const sizeLimit = BACKGROUND_LIMITS[backgroundType];

  if (file.size > sizeLimit) {
    return {
      status: 400,
      error: `Tệp nền vượt quá giới hạn ${Math.round(sizeLimit / 1024 / 1024)}MB.`,
    };
  }

  if (!isAllowedBackgroundFile(file, extension, backgroundType)) {
    return {
      status: 400,
      error: "Loại tệp nền không khớp với lựa chọn.",
    };
  }

  if (backgroundType === "video") {
    const durationSeconds = await getAudioDurationSeconds(file.path, envOverrides);
    if (durationSeconds > MAX_BACKGROUND_VIDEO_SECONDS) {
      return {
        status: 400,
        error: "Video nền không được dài quá 5 phút.",
      };
    }
  }

  return null;
}

function isAllowedBackgroundFile(
  file: Express.Multer.File,
  extension: string,
  backgroundType: keyof typeof BACKGROUND_LIMITS
) {
  if (backgroundType === "image") {
    return file.mimetype.startsWith("image/") && extension !== ".gif";
  }

  if (backgroundType === "gif") {
    return file.mimetype === "image/gif" || extension === ".gif";
  }

  return file.mimetype.startsWith("video/") && [".mp4", ".mov", ".m4v", ".webm"].includes(extension);
}
