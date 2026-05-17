import fs from "node:fs";
import path from "node:path";
import { GENERATED_PUBLIC_PATH, SERVER_ORIGIN, buildGeneratedFileUrl, getGeneratedDir } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import {
  getConfiguredElevenLabsModels,
  getConfiguredElevenLabsVoices,
  getElevenLabsApiKey,
  getElevenLabsModel,
} from "../config/elevenLabsConfig";
import type { ElevenLabsGenerateBody } from "../models/ElevenLabs";
import {
  ensureDirectoryExists,
  getLocalDateFolderName,
  getUniqueOutputFileWithExtension,
  sanitizeFileBaseName,
} from "../utils/audioOutput";

const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";

export function getElevenLabsConfigStatus(envOverrides: RuntimeEnvValues = {}) {
  return {
    hasApiKey: Boolean(getElevenLabsApiKey(envOverrides)),
    models: getConfiguredElevenLabsModels(envOverrides),
    voices: getConfiguredElevenLabsVoices(envOverrides),
    pricing: {
      sourceLabel: "Bảng giá API",
      sourceUrl: "https://elevenlabs.io/pricing/api",
      disclaimer:
        "Giá hiển thị chưa gồm thuế và có thể thay đổi theo gói sử dụng, tuỳ chọn giọng hoặc bảng giá mới.",
    },
  };
}

export async function generateElevenLabsAudio(
  body: ElevenLabsGenerateBody,
  envOverrides: RuntimeEnvValues = {}
) {
  const env = readEnvValues(envOverrides);
  const apiKey = getElevenLabsApiKey(env);

  if (!apiKey) {
    throw new Error("Thiếu ELEVENLABS_API_KEY. Hãy nhập API key trong Settings hoặc file .env.");
  }

  const text = body.text?.trim();
  if (!text) {
    throw new Error("Nội dung không được để trống.");
  }

  const model = getElevenLabsModel(body.modelId || "", env);
  if (!model) {
    throw new Error("Mẫu giọng PRO không hợp lệ.");
  }

  if (text.length > model.characterLimit) {
    throw new Error(`Nội dung vượt giới hạn ${model.characterLimit.toLocaleString()} ký tự của mẫu giọng.`);
  }

  const voiceId = body.voiceId?.trim();
  if (!voiceId) {
    throw new Error("Chưa chọn giọng PRO.");
  }

  const response = await fetch(
    `${ELEVENLABS_API_BASE_URL}/text-to-speech/${encodeURIComponent(
      voiceId
    )}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: model.id,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Tạo âm thanh PRO thất bại.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const dateFolderName = getLocalDateFolderName();
  const dateOutputDir = path.join(getGeneratedDir(env.SERVER_DATA_DIR), "elevenlabs", dateFolderName);
  const baseFileName = sanitizeFileBaseName(body.fileName || "am-thanh-pro");

  ensureDirectoryExists(dateOutputDir);

  const { outputFileName, outputPath } = getUniqueOutputFileWithExtension({
    baseName: baseFileName,
    extension: "mp3",
    outputDir: dateOutputDir,
  });

  fs.writeFileSync(outputPath, buffer);

  const relativePath = `elevenlabs/${dateFolderName}/${outputFileName}`;
  const billedCharacters = Number(response.headers.get("x-character-count") || text.length);

  return {
    ok: true,
    fileName: outputFileName,
    folderName: dateFolderName,
    relativePath,
    audioUrl: buildGeneratedFileUrl(GENERATED_PUBLIC_PATH, relativePath, env.SERVER_ORIGIN || SERVER_ORIGIN),
    model: model.label,
    voiceId,
    inputCharacters: text.length,
    billedCharacters,
    estimatedUsd: (billedCharacters / 1000) * model.priceUsdPerThousandCharacters,
    pricingSourceUrl: "https://elevenlabs.io/pricing/api",
  };
}
