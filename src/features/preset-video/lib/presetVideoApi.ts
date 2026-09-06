import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type { PresetVideoDefinition, PresetVideoExportSettings, PresetVideoRenderResponse } from "../types";

export async function renderPresetVideo(params: {
  preset: PresetVideoDefinition;
  settings: PresetVideoExportSettings;
  backgroundMusicUrl?: string;
}) {
  return parseApiResponse<PresetVideoRenderResponse>(await fetch(buildApiUrl("/api/video/render-preset"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildRuntimeSettingsHeaders(),
    },
    body: JSON.stringify({
      presetId: params.preset.id,
      fileName: params.preset.name,
      outputPreset: params.settings.outputPreset,
      durationSeconds: params.preset.defaultDurationSeconds,
      fps: params.preset.defaultFps,
      trimStartSeconds: params.settings.trimStartSeconds,
      trimEndSeconds: params.settings.trimEndSeconds,
      backgroundMusicUrl: params.backgroundMusicUrl || "",
      backgroundMusicVolume: params.settings.backgroundMusicVolume,
      originalAudioVolume: params.settings.originalAudioVolume,
    }),
  }));
}
