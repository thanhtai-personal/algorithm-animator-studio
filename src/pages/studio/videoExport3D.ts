import { audioEngine } from "@/lib/audio";
import { isProceduralMusicPreset, type BackgroundMusicId } from "@/lib/backgroundMusic";
import { buildVideoExportFileName } from "@/lib/exportFileName";
import type { Frame } from "@/lib/algorithms";
import { setLastExportedVideo } from "@/lib/studioMediaRegistry";
import { createAlgorithm3DExportSurface } from "@/features/algorithm-video-3d/algorithm3dExportSurface";
import { drawAlgorithm3DOverlay } from "@/features/algorithm-video-3d/drawAlgorithm3DOverlay";
import { ALGORITHM_3D_FINAL_HOLD_SECONDS, CRANE_SWAP_SECONDS, RHYTHMIC_SWAP_CUE_PROGRESS, getAlgorithm3DFrameSeconds, getAlgorithm3DStoryFrameSeconds } from "@/features/algorithm-video-3d/algorithm3dTiming";
import { isAlgorithm3DHyperMode, isAlgorithm3DStoryMode } from "@/lib/algorithmVideoRenderMode";
import { getAlgorithm3DHyperFrameSeconds } from "@/features/algorithm-video-3d/algorithm3dHyper";
import { getExportFormat } from "./exportFormats";
import type { ExportVideoParams } from "./videoExport";

const TREE_SORT_EXPORT_SECONDS = 0.12;
const PIGEONHOLE_EXPORT_SECONDS = 0.16;

export async function exportAlgorithmVideo3D(params: ExportVideoParams) {
  const storyMode = isAlgorithm3DStoryMode(params.videoRenderMode);
  const hyperMode = isAlgorithm3DHyperMode(params.videoRenderMode);
  const format = getExportFormat(params.exportFormat);
  const mimeType = format.mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
  if (!mimeType) {
    params.onUnsupportedFormat(format.label);
    return false;
  }
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = params.width;
  outputCanvas.height = params.height;
  const ctx = outputCanvas.getContext("2d");
  if (!ctx) throw new Error("2D composition canvas is unavailable for 3D export.");

  const surface = await createAlgorithm3DExportSurface({
    frame: params.frames[0],
    previousFrame: null,
    frameIndex: 0,
    width: params.width,
    height: params.height,
    theme: params.theme,
    ads: params.algorithmVideoAds,
    storyMode,
    hyperMode,
  });

  const renderFrame = async (frameIndex: number, previousFrame: Frame | null, progress: number) => {
    const frame = params.frames[frameIndex];
    await surface.render(frame, previousFrame, frameIndex, progress);
    ctx.clearRect(0, 0, params.width, params.height);
    ctx.drawImage(surface.canvas, 0, 0, params.width, params.height);
    drawAlgorithm3DOverlay(ctx, {
      frame,
      frameIndex,
      width: params.width,
      height: params.height,
      title: params.title,
      subtitle: params.subtitle,
      code: params.code,
      showCode: params.showCode,
      complexity: params.complexity,
      lang: params.lang,
      theme: params.theme,
      storyMode,
      hyperMode,
      frameCount: params.frames.length,
      transitionProgress: progress,
    });
  };

  await renderFrame(0, null, 1);
  const videoStream = outputCanvas.captureStream(0) as MediaStream;
  const track = videoStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
  if (!track) {
    surface.dispose();
    throw new Error("3D export video track could not be created.");
  }

  audioEngine.resume();
  const audioStream = audioEngine.getRecordStream();
  const combined = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
  const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  let activeMusicPreset: BackgroundMusicId | null = null;
  const applyMusic = async (preset: BackgroundMusicId) => {
    activeMusicPreset = preset;
    if (isProceduralMusicPreset(preset)) {
      audioEngine.setMusicPreset(preset);
      return;
    }
    const url = await params.resolveMusicUrl?.(preset);
    audioEngine.setMusicSource(url ?? null);
    audioEngine.setMusicPreset("custom");
    audioEngine.startMusic();
  };

  audioEngine.setOutputMuted(true);
  try {
    await applyMusic(params.resolveMusicPreset?.(params.frames[0]) ?? params.musicPreset);
  } catch (error) {
    audioEngine.setOutputMuted(false);
    surface.dispose();
    throw error;
  }
  recorder.start();
  track.requestFrame();

  try {
    for (let frameIndex = 0; frameIndex < params.frames.length; frameIndex += 1) {
      const musicPreset = params.resolveMusicPreset?.(params.frames[frameIndex]) ?? params.musicPreset;
      if (musicPreset !== activeMusicPreset) await applyMusic(musicPreset);
      params.playEvent(params.frames[frameIndex]);
      const previousFrame = frameIndex > 0 ? params.frames[frameIndex - 1] : null;
      const transitionFrames = getTransitionFrameCount(params, frameIndex, previousFrame);

      const cueState = { approach: false, hook: false, lift: false, transport: false, lower: false, return: false };
      const craneSwap = shouldAnimateSwap(params.frames[frameIndex], previousFrame);
      for (let step = 1; step <= transitionFrames; step += 1) {
        const progress = step / transitionFrames;
        if (craneSwap) {
          if (hyperMode) playHyperCraneExportCue(progress, cueState);
          else playCraneExportCue(progress, cueState);
        }
        await renderFrame(frameIndex, previousFrame, progress);
        track.requestFrame();
        await waitFrame(params.fps);
      }
      params.onProgress(Math.round(((frameIndex + 1) / params.frames.length) * 100));
    }

    await renderFrame(params.frames.length - 1, null, 1);
    const finalHoldSeconds = hyperMode ? 0.8 : ALGORITHM_3D_FINAL_HOLD_SECONDS;
    for (let hold = 0; hold < params.fps * finalHoldSeconds; hold += 1) {
      track.requestFrame();
      await waitFrame(params.fps);
    }
  } finally {
    recorder.stop();
    surface.dispose();
    audioEngine.stopMusic();
    audioEngine.setMusicPreset("off");
    audioEngine.setOutputMuted(false);
  }

  const blob = await done;
  const url = URL.createObjectURL(blob);
  const fileName = buildVideoExportFileName({
    youtubeTitle: params.youtubeMetadata?.title,
    fallbackTitle: `${params.algoName} ${params.platformId} ${hyperMode ? "3D Hyper" : storyMode ? "3D Story" : "3D"}`,
    lang: params.lang,
    extension: format.id,
  });
  const file = new File([blob], fileName, { type: mimeType });
  setLastExportedVideo(file, url, {
    youtubeMetadata: params.youtubeMetadata,
    youtubeDescriptionAppend: params.youtubeDescriptionAppend,
  });

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  return true;
}

function getTransitionFrameCount(params: ExportVideoParams, frameIndex: number, previousFrame: Frame | null) {
  const frame = params.frames[frameIndex];
  const nextFrame = params.frames[frameIndex + 1] ?? null;
  if (isAlgorithm3DHyperMode(params.videoRenderMode)) {
    return Math.max(3, Math.round(params.fps * getAlgorithm3DHyperFrameSeconds(frame)));
  }
  if (shouldAnimateSwap(frame, previousFrame)) return Math.max(4, Math.round(params.fps * CRANE_SWAP_SECONDS));
  if (frame.event === "compare" || frame.event === "visit" || frame.event === "found") {
    const seconds = isAlgorithm3DStoryMode(params.videoRenderMode)
      ? getAlgorithm3DStoryFrameSeconds(frame)
      : getAlgorithm3DFrameSeconds(frame, nextFrame);
    return Math.max(3, Math.round(params.fps * seconds));
  }
  if (params.algorithmId === "tree_sort") return Math.max(2, Math.round(params.fps * TREE_SORT_EXPORT_SECONDS));
  if (params.algorithmId === "pigeonhole") return Math.max(3, Math.round(params.fps * PIGEONHOLE_EXPORT_SECONDS));
  return 1;
}

type CraneCueState = { approach: boolean; hook: boolean; lift: boolean; transport: boolean; lower: boolean; return: boolean };


function playHyperCraneExportCue(progress: number, state: CraneCueState) {
  if (progress >= 0.04 && !state.approach) { state.approach = true; audioEngine.playSfx("crane-drive", 0.42); }
  if (progress >= 0.27 && !state.lift) { state.lift = true; audioEngine.playSfx("crane-lift", 0.58); }
  if (progress >= 0.48 && !state.transport) { state.transport = true; audioEngine.playSfx("swap-spark", 0.72); }
  if (progress >= 0.82 && !state.lower) { state.lower = true; audioEngine.playSfx("crane-set", 0.54); }
}

function playCraneExportCue(progress: number, state: CraneCueState) {
  if (progress >= RHYTHMIC_SWAP_CUE_PROGRESS && !state.transport) {
    state.transport = true;
    audioEngine.playSfx("swap-snap", 0.68);
  }
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

function waitFrame(fps: number) {
  return new Promise((resolve) => window.setTimeout(resolve, 1000 / fps));
}

