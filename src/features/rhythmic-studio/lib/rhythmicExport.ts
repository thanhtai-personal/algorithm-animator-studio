import { buildApiUrl } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import { getExportFormat, type ExportFormat } from "@/pages/studio/exportFormats";

export function pickRecordingMimeType(target: ExportFormat) {
  const recordingFormat = getExportFormat(target === "mp4" ? "webm" : target);
  return recordingFormat.mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

export async function transcodeWebmToMp4(blob: Blob) {
  const form = new FormData();
  form.append("video", new File([blob], "rhythmic-export.webm", { type: blob.type || "video/webm" }));
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

export function downloadRhythmicBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1800);
}
