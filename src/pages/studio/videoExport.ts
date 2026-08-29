import { Frame } from "@/lib/algorithms";
import { audioEngine, SfxKind } from "@/lib/audio";
import { BackgroundMusicId, isProceduralMusicPreset } from "@/lib/backgroundMusic";
import { AnimalColumnSettings } from "@/lib/animalColumns";
import { renderFrame, Theme } from "@/lib/renderer";
import { getAssetSfxOption } from "@/lib/selectSounds";
import { buildVideoExportFileName } from "@/lib/exportFileName";
import { renderShortKineticTypography } from "@/lib/shortKineticTypographyRenderer";
import type { ShortVideoType } from "@/lib/shortVideoTypes";
import { setLastExportedVideo } from "@/lib/studioMediaRegistry";
import type { YoutubeAlgorithmMetadata } from "@/lib/youtubeMetadata";
import { getExportFormat, ExportFormat } from "./exportFormats";
import { canUseAlgorithm3DVideo, type AlgorithmVideoRenderMode } from "@/lib/algorithmVideoRenderMode";
import type { AlgorithmVideoAdSelection } from "@/lib/algorithmVideoAds";

const SWAP_EXPORT_SECONDS = 0.35;
const KINETIC_ODD_EVEN_SWAP_SECONDS = 0.62;
const KINETIC_ODD_EVEN_HOLD_SECONDS = 0.28;
const KINETIC_PANCAKE_FLIP_SECONDS = 0.78;
const KINETIC_PANCAKE_HOLD_SECONDS = 0.32;
const KINETIC_BITONIC_SWAP_SECONDS = 0.58;
const KINETIC_BITONIC_HOLD_SECONDS = 0.24;
const KINETIC_GRAPH_HOLD_SECONDS = 0.42;
const TREE_SORT_EXPORT_SECONDS = 0.12;
const PIGEONHOLE_EXPORT_SECONDS = 0.16;

export type ExportVideoParams = {
  frames: Frame[];
  fps: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  theme: Theme;
  code: string;
  showCode: boolean;
  complexity?: { time: string; best?: string; worst?: string; space: string };
  algorithmId: string;
  algoName: string;
  lang: "en" | "vi";
  shortVideoType: ShortVideoType;
  videoRenderMode: AlgorithmVideoRenderMode;
  algorithmVideoAds: AlgorithmVideoAdSelection;
  platformId: string;
  exportFormat: ExportFormat;
  animalColumns: AnimalColumnSettings;
  musicPreset: BackgroundMusicId;
  resolveMusicPreset?: (frame: Frame) => BackgroundMusicId;
  resolveMusicUrl?: (preset: BackgroundMusicId) => Promise<string | null | undefined>;
  youtubeMetadata?: YoutubeAlgorithmMetadata;
  youtubeDescriptionAppend?: string;
  sfxCompare: SfxKind;
  sfxSwap: SfxKind;
  onProgress: (progress: number) => void;
  onUnsupportedFormat: (label: string) => void;
  playEvent: (frame: Frame | null | undefined) => void;
};

export async function exportAlgorithmVideo(params: ExportVideoParams) {
  if (!params.frames.length) return false;

  const wants3D = params.videoRenderMode === "3d" && canUseAlgorithm3DVideo({
    shortVideoType: params.shortVideoType,
    columnVisualMode: params.animalColumns.mode,
    hasWorldScene: params.frames.some((frame) => Boolean(frame.world || frame.worldCompare)),
  });
  if (wants3D) {
    try {
      const { exportAlgorithmVideo3D } = await import("./videoExport3D");
      return await exportAlgorithmVideo3D(params);
    } catch (error) {
      console.warn("3D export failed; retrying with the untouched 2D export pipeline.", error);
    }
  }

  return exportAlgorithmVideo2D(params);
}

async function exportAlgorithmVideo2D(params: ExportVideoParams) {

  const format = getExportFormat(params.exportFormat);
  const mimeType = format.mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
  if (!mimeType) {
    params.onUnsupportedFormat(format.label);
    return false;
  }
  await Promise.all([preloadExportSfx(params.sfxCompare), preloadExportSfx(params.sfxSwap)]);

  const canvas = document.createElement("canvas");
  canvas.width = params.width;
  canvas.height = params.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const renderOpts = {
    title: params.title,
    subtitle: params.subtitle,
    theme: params.theme,
    code: params.code,
    showCode: params.showCode,
    complexity: params.complexity,
    algorithmId: params.algorithmId,
    animalColumns: params.animalColumns,
    lang: params.lang,
  };

  renderShortFrame(ctx, params, 0, null, 1, renderOpts);
  const videoStream = canvas.captureStream(0) as MediaStream;
  const track = videoStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
  if (!track) return false;

  audioEngine.resume();
  const audioStream = audioEngine.getRecordStream();
  const combined = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
  const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  let activeMusicPreset: BackgroundMusicId | null = null;
  audioEngine.setOutputMuted(true);
  try {
    await applyExportMusic(params, params.resolveMusicPreset?.(params.frames[0]) ?? params.musicPreset);
  } catch (error) {
    audioEngine.setOutputMuted(false);
    throw error;
  }

  recorder.start();
  track.requestFrame();

  try {
    for (let i = 0; i < params.frames.length; i++) {
      const nextMusicPreset = params.resolveMusicPreset?.(params.frames[i]) ?? params.musicPreset;
      if (nextMusicPreset !== activeMusicPreset) await applyExportMusic(params, nextMusicPreset);
      params.playEvent(params.frames[i]);
      const previousFrame = i > 0 ? params.frames[i - 1] : null;
      const transitionFrames = getTransitionFrameCount(params, params.frames[i], previousFrame);

      for (let step = 1; step <= transitionFrames; step++) {
        renderShortFrame(ctx, params, i, previousFrame, step / transitionFrames, renderOpts);
        track.requestFrame();
        await waitFrame(params.fps);
      }
      params.onProgress(Math.round(((i + 1) / params.frames.length) * 100));
    }

    const lastFrame = params.frames[params.frames.length - 1];
    renderShortFrame(ctx, params, params.frames.length - 1, null, 1, renderOpts);
    for (let i = 0; i < params.fps * 3; i++) {
      track.requestFrame();
      await waitFrame(params.fps);
    }
  } finally {
    recorder.stop();
    audioEngine.stopMusic();
    audioEngine.setMusicPreset("off");
    audioEngine.setOutputMuted(false);
  }

  const blob = await done;
  const url = URL.createObjectURL(blob);
  const fileName = buildVideoExportFileName({
    youtubeTitle: params.youtubeMetadata?.title,
    fallbackTitle: `${params.algoName} ${params.platformId}`,
    lang: params.lang,
    extension: format.id,
  });
  const file = new File([blob], fileName, { type: mimeType });
  setLastExportedVideo(file, url, { youtubeMetadata: params.youtubeMetadata, youtubeDescriptionAppend: params.youtubeDescriptionAppend });

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  return true;

  async function applyExportMusic(exportParams: ExportVideoParams, preset: BackgroundMusicId) {
    activeMusicPreset = preset;
    if (isProceduralMusicPreset(preset)) {
      audioEngine.setMusicPreset(preset);
      return;
    }
    const url = await exportParams.resolveMusicUrl?.(preset);
    audioEngine.setMusicSource(url ?? null);
    audioEngine.setMusicPreset("custom");
    audioEngine.startMusic();
  }
}

function renderShortFrame(
  ctx: CanvasRenderingContext2D,
  params: ExportVideoParams,
  frameIndex: number,
  previousFrame: Frame | null,
  transitionProgress: number,
  renderOpts: Parameters<typeof renderFrame>[2],
) {
  const frame = params.frames[frameIndex];
  if (params.shortVideoType === "kinetic-typography") {
    renderShortKineticTypography(ctx, {
      frame,
      previousFrame,
      frameIndex,
      frameCount: params.frames.length,
      transitionProgress,
      algorithmId: params.algorithmId,
      algoName: params.algoName,
      lang: params.lang,
      title: params.title,
      subtitle: params.subtitle,
    }, params.width, params.height);
    return;
  }
  renderFrame(ctx, frame, { ...renderOpts, previousFrame, transitionProgress }, params.width, params.height);
}

function waitFrame(fps: number) {
  return new Promise((resolve) => window.setTimeout(resolve, 1000 / fps));
}

function getTransitionFrameCount(params: ExportVideoParams, frame: Frame, previousFrame: Frame | null) {
  if (shouldAnimateSwap(frame, previousFrame)) {
    const seconds = kineticSwapSeconds(params.algorithmId, params.shortVideoType);
    return Math.max(6, Math.round(params.fps * seconds));
  }
  return frameHoldCount(params.algorithmId, params.fps, params.shortVideoType);
}

function frameHoldCount(algorithmId: string, fps: number, shortVideoType: ShortVideoType) {
  if (shortVideoType === "kinetic-typography" && algorithmId === "odd_even") return Math.max(5, Math.round(fps * KINETIC_ODD_EVEN_HOLD_SECONDS));
  if (shortVideoType === "kinetic-typography" && algorithmId === "pancake") return Math.max(6, Math.round(fps * KINETIC_PANCAKE_HOLD_SECONDS));
  if (shortVideoType === "kinetic-typography" && algorithmId === "bitonic") return Math.max(5, Math.round(fps * KINETIC_BITONIC_HOLD_SECONDS));
  if (shortVideoType === "kinetic-typography" && ["bfs", "dfs", "dijkstra"].includes(algorithmId)) return Math.max(8, Math.round(fps * KINETIC_GRAPH_HOLD_SECONDS));
  if (algorithmId === "tree_sort") return Math.max(2, Math.round(fps * TREE_SORT_EXPORT_SECONDS));
  if (algorithmId === "pigeonhole") return Math.max(3, Math.round(fps * PIGEONHOLE_EXPORT_SECONDS));
  return 1;
}

function kineticSwapSeconds(algorithmId: string, shortVideoType: ShortVideoType) {
  if (shortVideoType !== "kinetic-typography") return SWAP_EXPORT_SECONDS;
  if (algorithmId === "odd_even") return KINETIC_ODD_EVEN_SWAP_SECONDS;
  if (algorithmId === "pancake") return KINETIC_PANCAKE_FLIP_SECONDS;
  if (algorithmId === "bitonic") return KINETIC_BITONIC_SWAP_SECONDS;
  return SWAP_EXPORT_SECONDS;
}

function shouldAnimateSwap(frame: Frame, previousFrame: Frame | null) {
  if ((frame.vars.kind === "strand" || frame.vars.kind === "tournament") && previousFrame && frame.event === "swap") return true;
  if (String(frame.vars.phase ?? "").includes("flip") && previousFrame && frame.event === "swap") return true;
  if (!previousFrame || frame.event !== "swap" || frame.swap.length !== 2) return false;
  const [a, b] = frame.swap;
  return previousFrame.arr.length === frame.arr.length
    && previousFrame.arr[a] === frame.arr[b]
    && previousFrame.arr[b] === frame.arr[a];
}

export async function preloadExportSfx(kind: SfxKind) {
  const option = getAssetSfxOption(kind);
  if (!option) return;
  try {
    const url = await option.loadUrl();
    await audioEngine.loadAssetSfx(option.id, url);
  } catch {
    // Export/playback should keep running even if one optional SFX asset fails.
  }
}
