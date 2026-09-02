import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type { AutoLyricsResponse, TimelineRenderProject, TimelineRenderResponse, VideoEditorAsset } from "./videoEditorTypes";

export async function renderTimelineVideo(project: TimelineRenderProject, assets: VideoEditorAsset[]) {
  const formData = new FormData();
  formData.append("project", JSON.stringify(project));

  for (const asset of assets) {
    if (project.clips.some((clip) => clip.assetId === asset.id) || project.watermarkLogoAssetId === asset.id) {
      formData.append(`asset:${asset.id}`, asset.file, asset.name);
    }
  }

  return parseApiResponse<TimelineRenderResponse>(await fetch(buildApiUrl("/api/video/render-timeline"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: formData,
  }));
}

export async function transcribeVideoEditorLyrics(asset: VideoEditorAsset, options: { model: string; language: string }) {
  const formData = new FormData();
  formData.append("media", asset.file, asset.name);
  formData.append("model", options.model);
  formData.append("language", options.language);

  return parseApiResponse<AutoLyricsResponse>(await fetch(buildApiUrl("/api/video/auto-lyrics"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: formData,
  }));
}
