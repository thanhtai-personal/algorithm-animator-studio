import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";

export async function uploadPresetVoiceover(presetId: string, blob: Blob, mimeType: string) {
  const extension = mimeType.includes("mp4") ? "m4a" : "webm";
  const formData = new FormData();
  formData.append("audio", blob, `${presetId}-recording.${extension}`);
  return parseApiResponse<{ relativePath: string; audioUrl: string }>(
    await fetch(buildApiUrl("/api/video/preset-media/voiceover"), {
      method: "POST",
      headers: buildRuntimeSettingsHeaders(),
      body: formData,
    }),
  );
}
