import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import { buildRuntimeSettingsHeaders } from "./runtimeSettings";
import type { YoutubeAlgorithmMetadata } from "./youtubeMetadata";

export type GeneratedAssetKind = "audio" | "video";

export type GeneratedAsset = {
  kind: "audio" | "video" | "music";
  fileName: string;
  relativePath: string;
  url: string;
  sizeBytes: number;
  createdAtMs: number;
  youtubeMetadata?: YoutubeAlgorithmMetadata;
  youtubeDescriptionAppend?: string;
};

export async function getGeneratedAssets() {
  return parseApiResponse<{ audio: GeneratedAsset[]; video: GeneratedAsset[]; music: GeneratedAsset[] }>(
    await fetch(buildApiUrl("/api/resources"), { headers: buildRuntimeSettingsHeaders() }),
  );
}

export async function getGeneratedAudioAssets() {
  const data = await parseApiResponse<{ audio: GeneratedAsset[] }>(
    await fetch(buildApiUrl("/api/resources/audio"), { headers: buildRuntimeSettingsHeaders() }),
  );
  return data.audio;
}

export async function uploadGeneratedVideo(file: File) {
  const data = new FormData();
  data.append("video", file);
  return parseApiResponse<GeneratedAsset>(await fetch(buildApiUrl("/api/resources/video"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: data,
  }));
}

export async function deleteGeneratedAsset(kind: GeneratedAssetKind, relativePath: string) {
  return parseApiResponse<{ ok: boolean; deleted: number; relativePath: string }>(await fetch(buildApiUrl(`/api/resources/${kind}`), {
    method: "DELETE",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ relativePath }),
  }));
}

export async function deleteGeneratedAssets(kind: GeneratedAssetKind, excludeRelativePaths: string[] = []) {
  return parseApiResponse<{ ok: boolean; deleted: number; kind: GeneratedAssetKind }>(await fetch(buildApiUrl(`/api/resources/${kind}/all`), {
    method: "DELETE",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ excludeRelativePaths }),
  }));
}
