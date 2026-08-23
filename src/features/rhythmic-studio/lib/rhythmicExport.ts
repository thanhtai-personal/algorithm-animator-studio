import { getExportFormat, type ExportFormat } from "@/pages/studio/exportFormats";

export function pickRecordingMimeType(target: ExportFormat) {
  const recordingFormat = getExportFormat(target === "mp4" ? "webm" : target);
  return recordingFormat.mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

export function downloadRhythmicBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1800);
}
