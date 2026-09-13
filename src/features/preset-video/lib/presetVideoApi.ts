import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type {
  PresetVideoDefinition,
  PresetVideoExportSettings,
  PresetVideoLanguage,
  PresetVideoMediaResponse,
  PresetVideoRenderProgress,
  PresetVideoRenderResponse,
  PresetVideoTimelineClip,
} from "../types";

export async function renderPresetVideo(
  params: {
    preset: PresetVideoDefinition;
    settings: PresetVideoExportSettings;
    language: PresetVideoLanguage;
    backgroundMusicUrl?: string;
  },
  onProgress?: (event: PresetVideoRenderProgress) => void,
) {
  const response = await fetch(buildApiUrl("/api/video/render-preset"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildRuntimeSettingsHeaders(),
    },
    body: JSON.stringify({
      presetId: params.preset.id,
      language: params.language,
      fileName: params.preset.name,
      outputPreset: params.settings.outputPreset,
      durationSeconds: params.preset.defaultDurationSeconds,
      fps: params.preset.defaultFps,
      trimStartSeconds: params.settings.trimStartSeconds,
      trimEndSeconds: params.settings.trimEndSeconds,
      backgroundMusicUrl: params.backgroundMusicUrl || "",
      backgroundMusicVolume: params.settings.backgroundMusicVolume,
      originalAudioVolume: params.settings.originalAudioVolume,
      voiceoverAudioRelativePath: params.settings.voiceoverAudioRelativePath,
      voiceoverVolume: params.settings.voiceoverVolume,
      lyricTimings: params.settings.lyricTimings,
      videoSources: params.preset.videoSources || [],
      timelineVideoClips: params.settings.timelineVideoClips,
      videoSourceStrategy: params.preset.videoSourceStrategy || "remote",
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/x-ndjson")) return parsePresetRenderStream(response, onProgress);
  return parseApiResponse<PresetVideoRenderResponse>(response);
}

export async function preparePresetVideoMedia(preset: PresetVideoDefinition, timelineVideoClips: readonly PresetVideoTimelineClip[] = []) {
  const videoSources = [
    ...(preset.videoSources || []),
    ...timelineVideoClips.map((clip) => ({ id: clip.id, watchUrl: "", clipStartSeconds: clip.clipStartSeconds, clipEndSeconds: clip.clipEndSeconds })),
  ];
  if (!videoSources.length) return { presetId: preset.id, videoSourceUrls: {}, missingSourceIds: [] } satisfies PresetVideoMediaResponse;
  return parseApiResponse<PresetVideoMediaResponse>(await fetch(buildApiUrl("/api/video/preset-media/prepare"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildRuntimeSettingsHeaders() },
    body: JSON.stringify({ presetId: preset.id, videoSources, videoSourceStrategy: preset.videoSourceStrategy || "remote" }),
  }));
}

export type PresetVideoImportSource = { id: string; watchUrl?: string; clipStartSeconds: number; clipEndSeconds: number };

export async function importPresetVideoSource(presetId: string, source: PresetVideoImportSource, file: File) {
  const formData = new FormData();
  formData.append("video", file, file.name);
  formData.append("presetId", presetId);
  formData.append("sourceId", source.id);
  formData.append("watchUrl", source.watchUrl || "");
  formData.append("clipStartSeconds", String(source.clipStartSeconds));
  formData.append("clipEndSeconds", String(source.clipEndSeconds));
  return parseApiResponse<{ presetId: string; sourceId: string; videoUrl: string }>(await fetch(buildApiUrl("/api/video/preset-media/import"), { method: "POST", headers: buildRuntimeSettingsHeaders(), body: formData }));
}

export async function importPresetVideoSources(presetId: string, sources: readonly PresetVideoImportSource[], file: File) {
  const formData = new FormData();
  formData.append("video", file, file.name);
  formData.append("presetId", presetId);
  formData.append("sources", JSON.stringify(sources));
  return parseApiResponse<{ presetId: string; sources: Array<{ sourceId: string; videoUrl: string }> }>(await fetch(buildApiUrl("/api/video/preset-media/import-batch"), { method: "POST", headers: buildRuntimeSettingsHeaders(), body: formData }));
}

async function parsePresetRenderStream(response: Response, onProgress?: (event: PresetVideoRenderProgress) => void): Promise<PresetVideoRenderResponse> {
  if (!response.ok) return parseApiResponse<PresetVideoRenderResponse>(response);
  if (!response.body) throw new Error("Trình duyệt không nhận được stream tiến độ render preset.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: PresetVideoRenderResponse | null = null;
  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let event: Record<string, unknown>;
    try { event = JSON.parse(trimmed) as Record<string, unknown>; } catch { throw new Error(`Preset renderer trả dữ liệu tiến độ không hợp lệ: ${trimmed.slice(0, 160)}`); }
    if (event.type === "progress") { onProgress?.({ progress: clamp01(Number(event.progress)), stage: isProgressStage(event.stage) ? event.stage : "rendering", message: typeof event.message === "string" ? event.message : "Đang render preset..." }); return; }
    if (event.type === "error") throw new Error(typeof event.error === "string" ? event.error : "Render preset video thất bại.");
    if (event.type === "result" && event.result && typeof event.result === "object") result = event.result as PresetVideoRenderResponse;
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
  if (!result) throw new Error("Render preset kết thúc nhưng không nhận được file video.");
  return result;
}

function isProgressStage(value: unknown): value is PresetVideoRenderProgress["stage"] { return value === "preparing" || value === "metadata" || value === "rendering" || value === "muxing" || value === "verifying"; }
function clamp01(value: number) { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; }
