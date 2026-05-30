import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type { GenerateVideoResponse, VideoAspectRatio, VideoFitMode } from "@/features/story-video/types";
import type { MuNewsFetchResponse, MuNewsItem, MuNewsScriptResponse, MuNewsSource, MuNewsValidateItemResponse } from "./types";

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
  scriptLanguage: string;
}) {
  return parseApiResponse<MuNewsScriptResponse>(await fetch(buildApiUrl("/api/mu-news/script"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function validateMuNewsItem(payload: { item: MuNewsItem }) {
  return parseApiResponse<MuNewsValidateItemResponse>(await fetch(buildApiUrl("/api/mu-news/validate-item"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function generateMuNewsTimelineVideo(payload: {
  audioRelativePaths: string[];
  uploadedAudioFiles: File[];
  backgrounds: { file: File; durationSeconds: number }[];
  videoFileName: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
  backgroundMusicRelativePath?: string;
  backgroundMusicVolume: number;
  backgroundMusicLoop: boolean;
  backgroundMusicFadeIn: number;
  backgroundMusicFadeOut: number;
}) {
  const formData = new FormData();
  formData.append("audioRelativePaths", JSON.stringify(payload.audioRelativePaths));
  formData.append("backgroundDurations", JSON.stringify(payload.backgrounds.map((item) => item.durationSeconds)));
  formData.append("videoFileName", payload.videoFileName);
  formData.append("aspectRatio", payload.aspectRatio);
  formData.append("fitMode", payload.fitMode);
  formData.append("backgroundMusicRelativePath", payload.backgroundMusicRelativePath || "");
  formData.append("backgroundMusicVolume", String(payload.backgroundMusicVolume));
  formData.append("backgroundMusicLoop", String(payload.backgroundMusicLoop));
  formData.append("backgroundMusicFadeIn", String(payload.backgroundMusicFadeIn));
  formData.append("backgroundMusicFadeOut", String(payload.backgroundMusicFadeOut));

  payload.backgrounds.forEach((item) => formData.append("backgrounds", item.file));
  payload.uploadedAudioFiles.forEach((file) => formData.append("audio", file));

  return parseApiResponse<GenerateVideoResponse>(await fetch(buildApiUrl("/api/mu-news/render-video"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: formData,
  }));
}
