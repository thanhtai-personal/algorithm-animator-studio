import { getExportFormat, type ExportFormat } from "@/pages/studio/exportFormats";

export function pickRecordingMimeType(target: ExportFormat) {
  const recordingFormat = getExportFormat(target === "mp4" ? "webm" : target);
  const priority = (candidate: string) => candidate.includes("vp8") ? 0 : candidate.includes("vp9") ? 1 : 2;
  const candidates = [...recordingFormat.mimeCandidates].sort((a, b) => priority(a) - priority(b));
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

export function usesFixedClientExportSurface(_target: ExportFormat) {
  return true;
}

interface RhythmicExportFrameStore {
  setPlaying: (playing: boolean) => void;
  setTimeMs: (timeMs: number) => void;
}

/** Move the live scene onto the first exported frame before capture begins. */
export function prepareRhythmicExportFrame(store: RhythmicExportFrameStore, startMs: number) {
  store.setPlaying(false);
  store.setTimeMs(Math.max(0, startMs));
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

export function startRhythmicMediaRecorder(
  recorder: MediaRecorder,
  requestCapturedFrame?: () => void,
  timeslice = 250,
) {
  return new Promise<void>((resolve) => {
    let settled = false;
    let fallbackTimer = 0;
    const complete = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(fallbackTimer);
      resolve();
    };
    recorder.addEventListener("start", complete, { once: true });
    fallbackTimer = window.setTimeout(complete, 0);
    recorder.start(timeslice);
    requestCapturedFrame?.();
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
