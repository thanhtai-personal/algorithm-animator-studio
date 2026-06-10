import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type { TimelineRenderProject, TimelineRenderResponse, VideoEditorAsset } from "./videoEditorTypes";

export async function renderTimelineVideo(project: TimelineRenderProject, assets: VideoEditorAsset[]) {
  const formData = new FormData();
  formData.append("project", JSON.stringify(project));

  for (const asset of assets) {
    if (project.clips.some((clip) => clip.assetId === asset.id)) {
      formData.append(`asset:${asset.id}`, asset.file, asset.name);
    }
  }

  return parseApiResponse<TimelineRenderResponse>(await fetch(buildApiUrl("/api/video/render-timeline"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: formData,
  }));
}
