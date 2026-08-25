import { buildApiUrl } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";

interface RhythmicTranscodeRequest {
  blob: Blob;
  fps: number;
  width: number;
  height: number;
}

export async function transcodeRhythmicWebmToMp4({ blob, fps, width, height }: RhythmicTranscodeRequest) {
  const form = new FormData();
  form.append("video", new File([blob], "rhythmic-export.webm", { type: blob.type || "video/webm" }));
  form.append("fps", String(fps));
  form.append("width", String(width));
  form.append("height", String(height));
  const response = await fetch(buildApiUrl("/api/video/transcode-mp4"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: form,
  });
  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    const message = typeof data === "string" ? data : data?.error || data?.message || "FFmpeg MP4 transcode failed.";
    throw new Error(message);
  }
  const mp4 = await response.blob();
  if (!mp4.size) throw new Error("FFmpeg returned an empty MP4 file.");
  return mp4;
}
