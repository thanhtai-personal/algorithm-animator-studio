import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_PUBLIC_PATH,
  GENERATED_PREVIEW_PUBLIC_PATH,
  PIPER_EXE,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedDir,
  getGeneratedPreviewDir,
} from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { resolveRuntimeExecutable } from "./RuntimeEnvService";
import { MODELS } from "../config/piperModels";
import type { GenerateBody, PiperModel } from "../models/PiperModel";
import {
  clampSentenceSilence,
  ensureDirectoryExists,
  getLocalDateFolderName,
  getUniqueOutputFile,
  sanitizeFileBaseName,
} from "../utils/audioOutput";
import { modelJsonPath } from "../utils/modelFiles";
import { prepareText } from "../utils/text";
import { runPiper } from "./PiperService";

const PREVIEW_WORD_LIMIT = 350;

export type ValidatedTtsRequest = {
  cleanedText: string;
  fileName?: string;
  selectedModel: PiperModel;
  sentenceSilence?: number;
  speechRate?: number;
};

export type TtsValidationResult =
  | ValidatedTtsRequest
  | {
      status: number;
      body: Record<string, unknown>;
    };

export function validateGenerateRequest(
  body: GenerateBody,
  envOverrides: RuntimeEnvValues = {}
): TtsValidationResult {
  const { text, modelKey } = body;

  if (!text?.trim()) {
    return badRequest("Text không được để trống.");
  }

  if (!modelKey) {
    return badRequest("Chưa chọn mẫu giọng.");
  }

  const selectedModel = MODELS[modelKey];

  if (!selectedModel) {
    return badRequest("Mẫu giọng không hợp lệ.");
  }

  const modelFileError = validateModelFiles(selectedModel, envOverrides);
  if (modelFileError) {
    return modelFileError;
  }

  const cleanedText = prepareText(text, selectedModel.lang);

  if (!cleanedText.trim()) {
    return badRequest("Text sau khi xử lý bị rỗng.");
  }

  return {
    cleanedText,
    fileName: body.fileName,
    selectedModel,
    sentenceSilence: body.sentenceSilence,
    speechRate: body.speechRate,
  };
}

export function validatePreviewRequest(
  body: GenerateBody,
  envOverrides: RuntimeEnvValues = {}
): TtsValidationResult {
  const previewText = limitTextWords(body.text || "", PREVIEW_WORD_LIMIT);

  return validateGenerateRequest(
    {
      ...body,
      text: previewText,
      fileName: body.fileName || "piper-preview",
    },
    envOverrides
  );
}

export async function generateAudioFile(
  params: ValidatedTtsRequest,
  envOverrides: RuntimeEnvValues = {}
) {
  const env = readEnvValues(envOverrides);
  const generatedDir = getGeneratedDir(env.SERVER_DATA_DIR);
  const dateFolderName = getLocalDateFolderName();
  const dateOutputDir = path.join(generatedDir, dateFolderName);
  const baseFileName = sanitizeFileBaseName(params.fileName || `audio-${crypto.randomUUID()}`);
  const finalSentenceSilence = clampSentenceSilence(params.sentenceSilence);
  const finalSpeechRate = clampSpeechRate(params.speechRate);
  const piperExe = resolveRuntimeExecutable(env.PIPER_EXE || process.env.PIPER_EXE || PIPER_EXE);

  ensureDirectoryExists(dateOutputDir);

  const { outputFileName, outputPath } = getUniqueOutputFile({
    baseName: baseFileName,
    outputDir: dateOutputDir,
  });

  const result = await runPiper({
    text: params.cleanedText,
    modelPath: params.selectedModel.modelPath,
    outputPath,
    sentenceSilence: finalSentenceSilence,
    speechRate: finalSpeechRate,
    piperExe,
  });

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      JSON.stringify(
        {
          message: "Giọng local chạy xong nhưng không tạo tệp âm thanh.",
          stdout: result.stdout,
          stderr: result.stderr,
        },
        null,
        2
      )
    );
  }

  const relativeAudioPath = `${dateFolderName}/${outputFileName}`;

  return {
    ok: true,
    fileName: outputFileName,
    folderName: dateFolderName,
    relativePath: relativeAudioPath,
    audioPath: outputPath,
    audioUrl: buildGeneratedFileUrl(GENERATED_PUBLIC_PATH, relativeAudioPath, env.SERVER_ORIGIN || SERVER_ORIGIN),
    model: params.selectedModel.label,
    lang: params.selectedModel.lang,
    sentenceSilence: finalSentenceSilence,
    speechRate: finalSpeechRate,
    warning: result.stderr || "",
  };
}

export async function generateAudioPreviewFile(
  params: ValidatedTtsRequest,
  envOverrides: RuntimeEnvValues = {}
) {
  const env = readEnvValues(envOverrides);
  const generatedPreviewDir = getGeneratedPreviewDir(env.SERVER_DATA_DIR);

  cleanupPreviewFiles(generatedPreviewDir);
  ensureDirectoryExists(generatedPreviewDir);

  const baseFileName = sanitizeFileBaseName(
    `${params.fileName || "piper-preview"}-${crypto.randomUUID()}`
  );
  const finalSentenceSilence = clampSentenceSilence(params.sentenceSilence);
  const finalSpeechRate = clampSpeechRate(params.speechRate);
  const piperExe = resolveRuntimeExecutable(env.PIPER_EXE || process.env.PIPER_EXE || PIPER_EXE);
  const { outputFileName, outputPath } = getUniqueOutputFile({
    baseName: baseFileName,
    outputDir: generatedPreviewDir,
  });

  const result = await runPiper({
    text: params.cleanedText,
    modelPath: params.selectedModel.modelPath,
    outputPath,
    sentenceSilence: finalSentenceSilence,
    speechRate: finalSpeechRate,
    piperExe,
  });

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      JSON.stringify(
        {
          message: "Giọng local chạy xong nhưng không tạo tệp nghe thử.",
          stdout: result.stdout,
          stderr: result.stderr,
        },
        null,
        2
      )
    );
  }

  return {
    ok: true,
    fileName: outputFileName,
    folderName: "generated-previews",
    relativePath: outputFileName,
    audioPath: outputPath,
    audioUrl: buildGeneratedFileUrl(GENERATED_PREVIEW_PUBLIC_PATH, outputFileName, env.SERVER_ORIGIN || SERVER_ORIGIN),
    model: params.selectedModel.label,
    lang: params.selectedModel.lang,
    sentenceSilence: finalSentenceSilence,
    speechRate: finalSpeechRate,
    wordLimit: PREVIEW_WORD_LIMIT,
    wordCount: countWords(params.cleanedText),
    preview: true,
    warning: result.stderr || "",
  };
}

function limitTextWords(text: string, maxWords: number): string {
  return text.trim().split(/\s+/).filter(Boolean).slice(0, maxWords).join(" ");
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function cleanupPreviewFiles(generatedPreviewDir: string) {
  if (!fs.existsSync(generatedPreviewDir)) {
    return;
  }

  for (const entry of fs.readdirSync(generatedPreviewDir, { withFileTypes: true })) {
    if (!entry.isFile() || ![".wav", ".mp3"].includes(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    fs.rmSync(path.join(generatedPreviewDir, entry.name), { force: true });
  }
}

function validateModelFiles(selectedModel: PiperModel, envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const piperExe = resolveRuntimeExecutable(env.PIPER_EXE || process.env.PIPER_EXE || PIPER_EXE);

  if (!fs.existsSync(piperExe)) {
    return serverFileError("Không tìm thấy piper.exe.", { piperExe });
  }

  if (!fs.existsSync(selectedModel.modelPath)) {
    return serverFileError("Không tìm thấy tệp mẫu giọng .onnx.", {
      modelPath: selectedModel.modelPath,
    });
  }

  const jsonPath = modelJsonPath(selectedModel.modelPath);

  if (!fs.existsSync(jsonPath)) {
    return serverFileError("Không tìm thấy tệp mẫu giọng .onnx.json.", { jsonPath });
  }

  return null;
}

function badRequest(error: string) {
  return {
    status: 400,
    body: { error },
  };
}

function serverFileError(error: string, fields: Record<string, unknown>) {
  return {
    status: 500,
    body: {
      error,
      ...fields,
    },
  };
}

function clampSpeechRate(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0.85;
  }

  return Math.min(1.4, Math.max(0.5, value));
}
