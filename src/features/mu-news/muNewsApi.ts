import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type { GenerateVideoResponse, VideoAspectRatio, VideoBackgroundType, VideoFitMode } from "@/features/story-video/types";
import type { MuNewsFetchResponse, MuNewsItem, MuNewsScriptResponse, MuNewsSource } from "./types";

export async function getMuNewsSources() {
  return parseApiResponse<{ sources: MuNewsSource[] }>(await fetch(buildApiUrl("/api/mu-news/sources"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function fetchMuNews(payload: { sources: MuNewsSource[]; query: string; maxItems: number }) {
  return parseApiResponse<MuNewsFetchResponse>(await fetch(buildApiUrl("/api/mu-news/fetch"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function generateMuNewsScript(payload: {
  items: MuNewsItem[];
  channelName: string;
  angle: string;
  durationMinutes: number;
  voiceStyle: string;
}) {
  return parseApiResponse<MuNewsScriptResponse>(await fetch(buildApiUrl("/api/mu-news/script"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function generateVideoFromMuAudio(payload: {
  audioRelativePath: string;
  backgroundFile: File;
  videoFileName: string;
  aspectRatio: VideoAspectRatio;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
}) {
  const formData = new FormData();
  formData.append("image", payload.backgroundFile);
  formData.append("audioRelativePath", payload.audioRelativePath);
  formData.append("videoFileName", payload.videoFileName);
  formData.append("aspectRatio", payload.aspectRatio);
  formData.append("backgroundType", payload.backgroundType);
  formData.append("fitMode", payload.fitMode);

  return parseApiResponse<GenerateVideoResponse>(await fetch(buildApiUrl("/api/video/generate-from-audio"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: formData,
  }));
}
