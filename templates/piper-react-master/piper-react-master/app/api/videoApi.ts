import { buildApiUrl, withRuntimeSettingsHeaders } from "../utils/appSettingsStorage";
import { getBrowserResourceOverview } from "../utils/browserResourceStore";
import { PUBLIC_WEB_BUILD } from "../utils/publicRuntime";
import type { GenerateResponse } from "../types";

export type VideoAspectRatio = "16:9" | "9:16";
export type VideoBackgroundType = "image" | "gif" | "video";
export type VideoFitMode = "cover" | "contain";

export type GenerateVideoResponse = {
  ok: boolean;
  audio: Partial<GenerateResponse> & {
    audioPath?: string;
    audioUrl?: string;
    billedCharacters?: number;
    estimatedUsd?: number;
    fileName?: string;
    inputCharacters?: number;
    model?: string;
    pricingSourceUrl?: string;
    relativePath?: string;
    voiceId?: string;
  };
  video: {
    ok: boolean;
    durationSeconds: number;
    fileName: string;
    relativePath: string;
    videoUrl: string;
    ffmpegWarning?: string;
  };
};

export type GeneratedVideo = {
  fileName: string;
  relativePath: string;
  videoUrl: string;
  sizeBytes: number;
  createdAtMs: number;
};

export async function getGeneratedVideos(): Promise<GeneratedVideo[]> {
  if (PUBLIC_WEB_BUILD) {
    const overview = await getBrowserResourceOverview();
    return overview.video.map((item) => ({
      fileName: item.fileName,
      relativePath: item.relativePath,
      videoUrl: item.url,
      sizeBytes: item.sizeBytes,
      createdAtMs: item.createdAtMs,
    }));
  }

  const response = await fetch(buildApiUrl("/api/video/generated"), { headers: withRuntimeSettingsHeaders() });
  const data = await parseVideoResponse<{ videos: GeneratedVideo[] }>(response);
  return data.videos;
}

export async function generateVideoFromText(payload: {
  text: string;
  modelKey: string;
  provider?: "piper" | "pro";
  proModelId?: string;
  voiceId?: string;
  sentenceSilence: number;
  fileName: string;
  videoFileName: string;
  aspectRatio: VideoAspectRatio;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
  backgroundFile: File;
  backgroundMusicRelativePath?: string;
  backgroundMusicVolume?: number;
  backgroundMusicLoop?: boolean;
  backgroundMusicFadeIn?: number;
  backgroundMusicFadeOut?: number;
}): Promise<GenerateVideoResponse> {
  const formData = new FormData();

  formData.append("text", payload.text);
  formData.append("modelKey", payload.modelKey);
  formData.append("provider", payload.provider || "piper");
  if (payload.proModelId) {
    formData.append("proModelId", payload.proModelId);
  }
  if (payload.voiceId) {
    formData.append("voiceId", payload.voiceId);
  }
  formData.append("sentenceSilence", String(payload.sentenceSilence));
  formData.append("fileName", payload.fileName);
  formData.append("videoFileName", payload.videoFileName);
  formData.append("aspectRatio", payload.aspectRatio);
  formData.append("backgroundType", payload.backgroundType);
  formData.append("fitMode", payload.fitMode);
  formData.append("image", payload.backgroundFile);
  appendBackgroundMusicOptions(formData, payload);

  const response = await fetch(buildApiUrl("/api/video/generate-from-text"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders(),
    body: formData,
  });

  return parseVideoResponse<GenerateVideoResponse>(response);
}

export async function generateVideoFromAudio(payload: {
  audioFile?: File;
  audioRelativePath?: string;
  videoFileName: string;
  aspectRatio: VideoAspectRatio;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
  backgroundFile: File;
  backgroundMusicRelativePath?: string;
  backgroundMusicVolume?: number;
  backgroundMusicLoop?: boolean;
  backgroundMusicFadeIn?: number;
  backgroundMusicFadeOut?: number;
}): Promise<GenerateVideoResponse> {
  const formData = new FormData();

  if (payload.audioRelativePath) {
    formData.append("audioRelativePath", payload.audioRelativePath);
  }
  if (payload.audioFile) {
    formData.append("audio", payload.audioFile);
  }
  formData.append("videoFileName", payload.videoFileName);
  formData.append("aspectRatio", payload.aspectRatio);
  formData.append("backgroundType", payload.backgroundType);
  formData.append("fitMode", payload.fitMode);
  formData.append("image", payload.backgroundFile);
  appendBackgroundMusicOptions(formData, payload);

  const response = await fetch(buildApiUrl("/api/video/generate-from-audio"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders(),
    body: formData,
  });

  return parseVideoResponse<GenerateVideoResponse>(response);
}

function appendBackgroundMusicOptions(
  formData: FormData,
  payload: {
    backgroundMusicRelativePath?: string;
    backgroundMusicVolume?: number;
    backgroundMusicLoop?: boolean;
    backgroundMusicFadeIn?: number;
    backgroundMusicFadeOut?: number;
  }
) {
  if (!payload.backgroundMusicRelativePath) {
    return;
  }

  formData.append("backgroundMusicRelativePath", payload.backgroundMusicRelativePath);
  formData.append("backgroundMusicVolume", String(payload.backgroundMusicVolume ?? 0.12));
  formData.append("backgroundMusicLoop", String(payload.backgroundMusicLoop ?? true));
  formData.append("backgroundMusicFadeIn", String(payload.backgroundMusicFadeIn ?? 1.5));
  formData.append("backgroundMusicFadeOut", String(payload.backgroundMusicFadeOut ?? 2));
}

async function parseVideoResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string; detail?: string };

  if (!response.ok) {
    throw new Error(formatApiError(data));
  }

  return data;
}

function formatApiError(errorData: { error?: string; detail?: string }): string {
  const message = errorData.detail || errorData.error || "Yêu cầu video thất bại.";

  try {
    const parsed = JSON.parse(message) as {
      message?: string;
      stderr?: string;
      stdout?: string;
      code?: number;
    };

    return [
      parsed.message,
      parsed.code !== undefined ? `Mã lỗi: ${parsed.code}` : "",
      parsed.stderr ? `Lỗi chi tiết:\n${parsed.stderr}` : "",
      parsed.stdout ? `Kết quả chi tiết:\n${parsed.stdout}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  } catch {
    return message;
  }
}
