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

export function useRhythmicExportActions(store: RhythmicStudioStore, canvasRef: MutableRefObject<HTMLCanvasElement | null>, playback: PlaybackDeps) {
  const lang = useSystemLang();
  const chunksRef = useRef<Blob[]>([]);
  const mp4Mutation = useRhythmicExportMutation();

  const recordVideo = useCallback(async (format: ExportFormat = "webm", clipOnly = false) => {
    const canvas = canvasRef.current;
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
    const videoStream = canvas.captureStream(store.settings.exportFps);
    const audioTracks = playback.audioEngineRef.current.getRecordStream()?.getAudioTracks() ?? [];
    const stream = new MediaStream([...videoStream.getVideoTracks(), ...audioTracks]);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: store.settings.exportFps >= 120 ? 14_000_000 : 9_000_000,
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
        stream.getTracks().forEach((track) => track.stop());
        store.setRecording(false);
      }
    };
    recorder.onerror = () => {
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
  }, [canvasRef, lang, mp4Mutation, playback, store]);

  return { recordVideo };
}
