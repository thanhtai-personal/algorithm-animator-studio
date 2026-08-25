import { getExportFormat, type ExportFormat } from "@/pages/studio/exportFormats";

export function pickRecordingMimeType(target: ExportFormat) {
  const recordingFormat = getExportFormat(target === "mp4" ? "webm" : target);
  return recordingFormat.mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

export function usesFixedClientExportSurface(target: ExportFormat) {
  return target !== "mp4";
}

export function settleRhythmicRecordingSurface() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(resolve, 160);
      });
    });
  });
}

export function downloadRhythmicBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1800);
}
