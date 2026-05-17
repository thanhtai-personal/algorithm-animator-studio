import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type {
  ExtractLinksResponse,
  ExtractTextResponse,
  GenerateVideoResponse,
  GeneratedResource,
  VideoAspectRatio,
  VideoBackgroundType,
  VideoFitMode,
} from "./types";

export async function extractLinksFromPage(payload: { url: string; selector: string }) {
  return parseApiResponse<ExtractLinksResponse>(await fetch(buildApiUrl("/api/extract-links"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function extractTextFromUrls(payload: { urls: string[]; selector: string }) {
  return parseApiResponse<ExtractTextResponse>(await fetch(buildApiUrl("/api/extract-text"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function getGeneratedResources() {
  return parseApiResponse<{ audio: GeneratedResource[]; video: GeneratedResource[]; music: GeneratedResource[] }>(
    await fetch(buildApiUrl("/api/resources"), { headers: buildRuntimeSettingsHeaders() })
  );
}

export async function getGeneratedVideos() {
  return parseApiResponse<{ videos: GeneratedResource[] }>(
    await fetch(buildApiUrl("/api/video/generated"), { headers: buildRuntimeSettingsHeaders() })
  );
}

export async function generateVideoFromAudio(payload: {
  audioRelativePath?: string;
  audioFile?: File | null;
  backgroundFile: File;
  videoFileName: string;
  aspectRatio: VideoAspectRatio;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
}) {
  const formData = new FormData();
  formData.append("image", payload.backgroundFile);
  formData.append("videoFileName", payload.videoFileName);
  formData.append("aspectRatio", payload.aspectRatio);
  formData.append("backgroundType", payload.backgroundType);
  formData.append("fitMode", payload.fitMode);
  if (payload.audioFile) formData.append("audio", payload.audioFile);
  if (payload.audioRelativePath) formData.append("audioRelativePath", payload.audioRelativePath);

  return parseApiResponse<GenerateVideoResponse>(await fetch(buildApiUrl("/api/video/generate-from-audio"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: formData,
  }));
}
