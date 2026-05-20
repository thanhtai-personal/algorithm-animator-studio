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

const SWAP_EXPORT_SECONDS = 0.35;
const KINETIC_ODD_EVEN_SWAP_SECONDS = 0.62;
const KINETIC_ODD_EVEN_HOLD_SECONDS = 0.28;
const TREE_SORT_EXPORT_SECONDS = 0.12;
const PIGEONHOLE_EXPORT_SECONDS = 0.16;

type ExportVideoParams = {
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
  platformId: string;
  exportFormat: ExportFormat;
  animalColumns: AnimalColumnSettings;
  musicPreset: BackgroundMusicId;
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

  if (isProceduralMusicPreset(params.musicPreset)) audioEngine.setMusicPreset(params.musicPreset);
  else {
    audioEngine.setMusicPreset("custom");
    audioEngine.startMusic();
  }

  recorder.start();
  track.requestFrame();

  try {
    for (let i = 0; i < params.frames.length; i++) {
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
    const seconds = params.shortVideoType === "kinetic-typography" && params.algorithmId === "odd_even" ? KINETIC_ODD_EVEN_SWAP_SECONDS : SWAP_EXPORT_SECONDS;
    return Math.max(6, Math.round(params.fps * seconds));
  }
  return frameHoldCount(params.algorithmId, params.fps, params.shortVideoType);
}

function frameHoldCount(algorithmId: string, fps: number, shortVideoType: ShortVideoType) {
  if (shortVideoType === "kinetic-typography" && algorithmId === "odd_even") return Math.max(5, Math.round(fps * KINETIC_ODD_EVEN_HOLD_SECONDS));
  if (algorithmId === "tree_sort") return Math.max(2, Math.round(fps * TREE_SORT_EXPORT_SECONDS));
  if (algorithmId === "pigeonhole") return Math.max(3, Math.round(fps * PIGEONHOLE_EXPORT_SECONDS));
  return 1;
}

function shouldAnimateSwap(frame: Frame, previousFrame: Frame | null) {
  if ((frame.vars.kind === "strand" || frame.vars.kind === "tournament") && previousFrame && frame.event === "swap") return true;
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
