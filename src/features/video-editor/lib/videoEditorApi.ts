import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type { AutoLyricsResponse, TimelineRenderProject, TimelineRenderResponse, VideoEditorAsset } from "./videoEditorTypes";

export type TimelineRenderProgress = {
  progress: number;
  stage: string;
  message: string;
};

export async function renderTimelineVideo(
  project: TimelineRenderProject,
  assets: VideoEditorAsset[],
  onProgress?: (event: TimelineRenderProgress) => void,
) {
  const formData = new FormData();
  formData.append("project", JSON.stringify(project));

  for (const asset of assets) {
    if (project.clips.some((clip) => clip.assetId === asset.id) || project.watermarkLogoAssetId === asset.id) {
      formData.append(`asset:${asset.id}`, asset.file, asset.name);
    }
  }

  const response = await fetch(buildApiUrl("/api/video/render-timeline"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";
  if (project.renderEngine === "remotion" && contentType.includes("application/x-ndjson")) {
    return parseRemotionRenderStream(response, onProgress);
  }

  return parseApiResponse<TimelineRenderResponse>(response);
}

async function parseRemotionRenderStream(response: Response, onProgress?: (event: TimelineRenderProgress) => void): Promise<TimelineRenderResponse> {
  if (!response.ok) return parseApiResponse<TimelineRenderResponse>(response);
  if (!response.body) throw new Error("Trình duyệt không nhận được stream tiến độ Remotion.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: TimelineRenderResponse | null = null;

  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      throw new Error(`Remotion trả về dữ liệu tiến độ không hợp lệ: ${trimmed.slice(0, 160)}`);
    }

    if (event.type === "progress") {
      onProgress?.({
        progress: clamp01(Number(event.progress)),
        stage: typeof event.stage === "string" ? event.stage : "rendering",
        message: typeof event.message === "string" ? event.message : "Đang render Remotion...",
      });
      return;
    }
    if (event.type === "error") {
      throw new Error(typeof event.error === "string" ? event.error : "Remotion render thất bại.");
    }
    if (event.type === "result" && event.result && typeof event.result === "object") {
      result = event.result as TimelineRenderResponse;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) consumeLine(line);
    if (done) break;
  }
  if (buffer.trim()) consumeLine(buffer);
  if (!result) throw new Error("Kết nối Remotion đã kết thúc nhưng không nhận được file video.");
  return result;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
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
