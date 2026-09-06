import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Frame } from "@/lib/algorithms";
import { audioEngine, type SfxKind } from "@/lib/audio";
import { isAlgorithm3DHyperMode, isAlgorithm3DRenderMode, isAlgorithm3DStoryMode, type AlgorithmVideoRenderMode } from "@/lib/algorithmVideoRenderMode";
import type { ShortVideoType } from "@/lib/shortVideoTypes";
import {
  RHYTHMIC_SWAP_CUE_PROGRESS,
  getAlgorithm3DFrameSeconds,
  getAlgorithm3DStoryFrameSeconds,
  isAlgorithm3DSortComplete,
} from "@/features/algorithm-video-3d/algorithm3dTiming";
import { playAlgorithm3DCompletionJingle } from "@/features/algorithm-video-3d/algorithm3dCompletionAudio";
import { getAlgorithm3DHyperFrameSeconds } from "@/features/algorithm-video-3d/algorithm3dHyper";

const SWAP_TRANSITION_MULTIPLIER = 1.8;
const KINETIC_ODD_EVEN_FRAME_MULTIPLIER = 8;
const KINETIC_PANCAKE_FRAME_MULTIPLIER = 9;
const TREE_SORT_FRAME_MULTIPLIER = 2.4;
const PIGEONHOLE_FRAME_MULTIPLIER = 2.1;

type PlaybackParams = {
  playing: boolean;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  fps: number;
  speed: number;
  frames: Frame[];
  frameIdx: number;
  setFrameIdx: Dispatch<SetStateAction<number>>;
  setTransitionProgress: Dispatch<SetStateAction<number>>;
  algoId: string;
  shortVideoType: ShortVideoType;
  videoRenderMode: AlgorithmVideoRenderMode;
  sfxCompare: SfxKind;
  sfxSwap: SfxKind;
};

export function useAlgorithmStudioPlayback(params: PlaybackParams) {
  const {
    playing, setPlaying, fps, speed, frames, frameIdx, setFrameIdx,
    setTransitionProgress, algoId, shortVideoType, videoRenderMode, sfxCompare, sfxSwap,
  } = params;
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const craneAudioRef = useRef({ frameIdx: -1, approach: false, hook: false, lift: false, transport: false, lower: false, return: false });
  const last3DPitchRef = useRef(0.5);
  const lastStorySortedRef = useRef(0);
  const completionPlayedRef = useRef(false);

  const playEvent = useCallback((frame: Frame | null | undefined) => {
    if (!frame) return;
    const event = frame.event;
    let pitch = 0.5;
    const valueIndex = frame.swap[0] ?? frame.highlight[0];
    if (valueIndex != null && frame.arr[valueIndex] != null) {
      pitch = frame.arr[valueIndex] / Math.max(...frame.arr, 1);
    }
    if (frame.worldCompare?.left.presentationMode === "vehicle_race" && event === "visit") {
      audioEngine.playSfx("engine", 0.45 + (frame.line % 5) * 0.08);
      return;
    }
    if (isAlgorithm3DRenderMode(videoRenderMode)) {
      const easedPitch = last3DPitchRef.current + (pitch - last3DPitchRef.current) * 0.36;
      last3DPitchRef.current = easedPitch;
      if (isAlgorithm3DHyperMode(videoRenderMode)) {
        const role = String(frame.vars.__hyperRole ?? "beat");
        if (role === "predict" || event === "compare" || event === "visit") audioEngine.playSfx("data-step", Math.min(0.92, easedPitch + 0.08));
        if (role === "milestone") audioEngine.playSfx("swap-spark", 0.82);
        if (role === "finish") audioEngine.playSfx("swap-spark", 0.96);
        return;
      }
      if (event === "found") audioEngine.playSfx("swap-spark", easedPitch);
      else if (event === "compare") audioEngine.playSfx("swap-tick", easedPitch);
      else if (event === "visit") audioEngine.playSfx("data-step", easedPitch);
      if (isAlgorithm3DStoryMode(videoRenderMode)) {
        const sortedCount = frame.sorted.length;
        if (sortedCount < lastStorySortedRef.current) lastStorySortedRef.current = sortedCount;
        const milestone = Math.max(1, Math.ceil(Math.max(1, frame.arr.length) / 4));
        if (sortedCount > lastStorySortedRef.current && (sortedCount >= frame.arr.length || sortedCount % milestone === 0)) {
          audioEngine.playSfx("swap-spark", Math.min(0.95, 0.58 + sortedCount / Math.max(1, frame.arr.length) * 0.34));
        }
        lastStorySortedRef.current = sortedCount;
      }
      return;
    }
    if (event === "compare") audioEngine.playSfx(sfxCompare, pitch);
    else if (event === "swap" || event === "found" || event === "visit") audioEngine.playSfx(sfxSwap, pitch);
  }, [sfxCompare, sfxSwap, videoRenderMode]);

  const playCraneMotionSfx = useCallback((index: number, progress: number) => {
    if (craneAudioRef.current.frameIdx !== index) {
      craneAudioRef.current = { frameIdx: index, approach: false, hook: false, lift: false, transport: false, lower: false, return: false };
    }
    const state = craneAudioRef.current;
    if (isAlgorithm3DHyperMode(videoRenderMode)) {
      if (progress >= 0.04 && !state.approach) { state.approach = true; audioEngine.playSfx("crane-drive", 0.42); }
      if (progress >= 0.27 && !state.lift) { state.lift = true; audioEngine.playSfx("crane-lift", 0.58); }
      if (progress >= 0.48 && !state.transport) { state.transport = true; audioEngine.playSfx("swap-spark", 0.72); }
      if (progress >= 0.82 && !state.lower) { state.lower = true; audioEngine.playSfx("crane-set", 0.54); }
      return;
    }
    if (progress >= RHYTHMIC_SWAP_CUE_PROGRESS && !state.transport) {
      state.transport = true;
      audioEngine.playSfx("swap-snap", 0.68);
    }
  }, [videoRenderMode]);

  useEffect(() => {
    if (!playing) return;
    if (frameIdx < frames.length - 1) completionPlayedRef.current = false;
    audioEngine.resume();
    lastRef.current = performance.now();
    const tick = (time: number) => {
      const baseInterval = 1000 / (fps * speed);
      const currentFrame = frames[Math.min(frameIdx, frames.length - 1)];
      const previousFrame = frameIdx > 0 ? frames[frameIdx - 1] : null;
      const algorithmMultiplier = getAlgorithmFrameMultiplier(shortVideoType, algoId);
      const animatedSwap = shouldAnimateSwap(currentFrame, previousFrame);
      const natural3DSeconds = isAlgorithm3DHyperMode(videoRenderMode)
        ? getAlgorithm3DHyperFrameSeconds(currentFrame)
        : isAlgorithm3DStoryMode(videoRenderMode)
          ? getAlgorithm3DStoryFrameSeconds(currentFrame)
          : getAlgorithm3DFrameSeconds(currentFrame, frames[frameIdx + 1]);
      const natural3DInterval = natural3DSeconds * 1000 / Math.max(0.1, speed);
      const interval = animatedSwap
        ? isAlgorithm3DRenderMode(videoRenderMode)
          ? Math.max(baseInterval * SWAP_TRANSITION_MULTIPLIER * algorithmMultiplier, natural3DInterval)
          : baseInterval * SWAP_TRANSITION_MULTIPLIER * algorithmMultiplier
        : isAlgorithm3DRenderMode(videoRenderMode)
          ? Math.max(baseInterval * algorithmMultiplier, natural3DInterval)
          : baseInterval * algorithmMultiplier;
      const elapsed = time - lastRef.current;
      const progress = Math.min(1, elapsed / interval);
      setTransitionProgress(progress);
      if (isAlgorithm3DRenderMode(videoRenderMode) && animatedSwap) playCraneMotionSfx(frameIdx, progress);

      if (elapsed >= interval) {
        lastRef.current = time;
        setFrameIdx((index) => {
          const next = index + 1;
          if (next >= frames.length) {
            const finalFrame = frames[index];
            if (
              isAlgorithm3DRenderMode(videoRenderMode)
              && isAlgorithm3DSortComplete(finalFrame)
              && !completionPlayedRef.current
            ) {
              completionPlayedRef.current = true;
              playAlgorithm3DCompletionJingle();
            }
            setPlaying(false);
            return index;
          }
          playEvent(frames[next]);
          setTransitionProgress(0);
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, fps, speed, frames, frameIdx, shortVideoType, algoId, videoRenderMode, setTransitionProgress, setFrameIdx, setPlaying, playEvent, playCraneMotionSfx]);

  return playEvent;
}

function getAlgorithmFrameMultiplier(shortVideoType: ShortVideoType, algoId: string) {
  if (shortVideoType === "kinetic-typography" && algoId === "odd_even") return KINETIC_ODD_EVEN_FRAME_MULTIPLIER;
  if (shortVideoType === "kinetic-typography" && algoId === "pancake") return KINETIC_PANCAKE_FRAME_MULTIPLIER;
  if (algoId === "tree_sort") return TREE_SORT_FRAME_MULTIPLIER;
  if (algoId === "pigeonhole") return PIGEONHOLE_FRAME_MULTIPLIER;
  return 1;
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
