import { useCallback, useRef, type MutableRefObject } from "react";
import { toast } from "sonner";
import { useSystemLang } from "@/hooks/use-system-lang";
import { getExportFormat, type ExportFormat } from "@/pages/studio/exportFormats";
import { rhythmicText } from "../i18n";
import { downloadRhythmicBlob, pickRecordingMimeType } from "../lib/rhythmicExport";
import { useRhythmicExportMutation } from "../queries/useRhythmicExportMutation";
import type { AudioEngine } from "../lib/audioEngine";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "rhythmic-run";
}

type PlaybackDeps = {
  audioEngineRef: MutableRefObject<AudioEngine>;
  audioElementRef: MutableRefObject<HTMLAudioElement | null>;
  recorderRef: MutableRefObject<MediaRecorder | null>;
  playRange: (startMs: number, endMs: number, clip?: boolean) => Promise<void>;
  resetAndPlay: () => Promise<void>;
};

type CanvasRefs = {
  legacyCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  threeCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
};

function currentCanvas(store: RhythmicStudioStore, refs: CanvasRefs) {
  if (store.rendererMode === "three" && refs.threeCanvasRef.current) return refs.threeCanvasRef.current;
  return refs.legacyCanvasRef.current;
}

function createFixedExportSurface(source: HTMLCanvasElement, rendererMode: RhythmicStudioStore["rendererMode"], fps: number) {
  const output = document.createElement("canvas");
  output.width = 720;
  output.height = 1280;
  const context = output.getContext("2d", { alpha: false });
  if (!context) return { canvas: source, stop: () => undefined };
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  let stopped = false;
  let raf = 0;
  let frameCallback = 0;
  let relay: HTMLVideoElement | null = null;
  let relayStream: MediaStream | null = null;

  const paint = (image: CanvasImageSource) => {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(image, 0, 0, output.width, output.height);
  };

  if (rendererMode !== "three") {
    const copy = () => {
      if (stopped) return;
      paint(source);
      raf = window.requestAnimationFrame(copy);
    };
    copy();
    return {
      canvas: output,
      stop: () => {
        stopped = true;
        window.cancelAnimationFrame(raf);
      },
    };
  }

  // Reading a WebGL canvas with drawImage() on a later RAF is not reliable when
  // preserveDrawingBuffer=false (the normal high-performance Three.js setup).
  // The compositor is allowed to clear the drawing buffer after presenting it,
  // which produced valid WebM files whose every video pixel was black. Capture
  // the presented WebGL frames first, relay that MediaStream through a video
  // element, then scale the live video into the fixed 720x1280 export surface.
  // This keeps the live renderer fast and avoids permanently enabling the costly
  // preserveDrawingBuffer option just for recording.
  relayStream = source.captureStream(Math.max(24, Math.min(120, fps)));
  relay = document.createElement("video");
  relay.muted = true;
  relay.playsInline = true;
  relay.autoplay = true;
  relay.srcObject = relayStream;
  void relay.play().catch(() => undefined);

  const copyVideo = () => {
    if (stopped || !relay) return;
    if (relay.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) paint(relay);
    if (typeof relay.requestVideoFrameCallback === "function") {
      frameCallback = relay.requestVideoFrameCallback(copyVideo);
    } else {
      raf = window.requestAnimationFrame(copyVideo);
    }
  };
  copyVideo();

  return {
    canvas: output,
    stop: () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
      if (relay && frameCallback && typeof relay.cancelVideoFrameCallback === "function") {
        relay.cancelVideoFrameCallback(frameCallback);
      }
      relay?.pause();
      if (relay) relay.srcObject = null;
      relayStream?.getTracks().forEach((track) => track.stop());
    },
  };
}

export function useRhythmicExportActions(store: RhythmicStudioStore, refs: CanvasRefs, playback: PlaybackDeps) {
  const lang = useSystemLang();
  const chunksRef = useRef<Blob[]>([]);
  const mp4Mutation = useRhythmicExportMutation();

  const recordVideo = useCallback(async (format: ExportFormat = "webm", clipOnly = false) => {
    const canvas = currentCanvas(store, refs);
    if (!canvas || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
      toast.error(rhythmicText(lang, "error.recordingUnsupported"));
      return;
    }
    const exportFormat = getExportFormat(format);
    const mimeType = pickRecordingMimeType(format);
    if (!mimeType) {
      store.setStatus({ key: "status.exportUnsupported", values: { format: exportFormat.label } });
      toast.error(rhythmicText(lang, "status.exportUnsupported", { format: exportFormat.label }));
      return;
    }

    await playback.audioEngineRef.current.ensure();
    if (store.source.type === "audio" && playback.audioElementRef.current) {
      await playback.audioEngineRef.current.attachOriginalAudio(playback.audioElementRef.current);
    }
    // Record from a fixed 720x1280 surface instead of the responsive WebGL
    // drawing buffer. The latter follows CSS size × DPR and produced files such
    // as 744x1324 depending on the browser window.
    const exportSurface = createFixedExportSurface(canvas, store.rendererMode, store.settings.exportFps);
    const videoStream = exportSurface.canvas.captureStream(store.settings.exportFps);
    // Never put the AudioEngine's shared destination track directly into the export
    // stream: stopping that stream would permanently end audio for later exports.
    const audioTracks = (playback.audioEngineRef.current.getRecordStream()?.getAudioTracks() ?? [])
      .filter((track) => track.readyState === "live")
      .map((track) => track.clone());
    const stream = new MediaStream([...videoStream.getVideoTracks(), ...audioTracks]);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: store.settings.exportFps >= 120 ? 16_000_000 : 10_000_000,
      audioBitsPerSecond: 192_000,
    });
    playback.recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
    recorder.onstop = async () => {
      try {
        const intermediate = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
        const blob = format === "mp4" ? await mp4Mutation.mutateAsync(intermediate) : intermediate;
        const clipSuffix = clipOnly ? `-clip-${Math.round(store.trimStartMs / 1000)}-${Math.round(store.trimEndMs / 1000)}` : "";
        downloadRhythmicBlob(blob, `${safeFileName(store.projectName)}${clipSuffix}.${exportFormat.id}`);
        store.setStatus({ key: "status.exported", values: { format: exportFormat.label, size: (blob.size / (1024 * 1024)).toFixed(1) } });
        toast.success(rhythmicText(lang, "toast.exported", { format: exportFormat.label }));
      } catch (error) {
        store.setStatus({ key: "status.exportFailed", values: { format: exportFormat.label } });
        toast.error(error instanceof Error ? error.message : rhythmicText(lang, "status.exportFailed", { format: exportFormat.label }));
      } finally {
        exportSurface.stop();
        stream.getTracks().forEach((track) => track.stop());
        store.setRecording(false);
      }
    };
    recorder.onerror = () => {
      exportSurface.stop();
      stream.getTracks().forEach((track) => track.stop());
      store.setRecording(false);
      store.setStatus({ key: "status.exportFailed", values: { format: exportFormat.label } });
      toast.error(rhythmicText(lang, "status.exportFailed", { format: exportFormat.label }));
    };
    recorder.start(250);
    store.setRecording(true, format);
    store.setStatus({ key: "status.recording", values: { format: exportFormat.label, fps: store.settings.exportFps } });
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    if (clipOnly) await playback.playRange(store.trimStartMs, store.trimEndMs, true);
    else await playback.resetAndPlay();
  }, [lang, mp4Mutation, playback, refs, store]);

  return { recordVideo };
}
