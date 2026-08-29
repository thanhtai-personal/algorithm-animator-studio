import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Frame } from "@/lib/algorithms";
import { audioEngine, type SfxKind } from "@/lib/audio";
import type { AlgorithmVideoRenderMode } from "@/lib/algorithmVideoRenderMode";
import type { ShortVideoType } from "@/lib/shortVideoTypes";

const SWAP_TRANSITION_MULTIPLIER = 1.8;
const CRANE_SWAP_MS = 1050;
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
  const craneAudioRef = useRef({ frameIdx: -1, lift: false, drive: false, set: false });

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
    if (videoRenderMode === "3d") {
      if (event === "swap") audioEngine.playSfx("crane-hook", pitch);
      else if (event === "found") audioEngine.playSfx("swap-spark", pitch);
      else if (event === "compare" || event === "visit") audioEngine.playSfx("data-step", pitch);
      return;
    }
    if (event === "compare") audioEngine.playSfx(sfxCompare, pitch);
    else if (event === "swap" || event === "found" || event === "visit") audioEngine.playSfx(sfxSwap, pitch);
  }, [sfxCompare, sfxSwap, videoRenderMode]);

  const playCraneMotionSfx = useCallback((index: number, progress: number) => {
    if (craneAudioRef.current.frameIdx !== index) {
      craneAudioRef.current = { frameIdx: index, lift: false, drive: false, set: false };
    }
    const state = craneAudioRef.current;
    if (progress >= 0.14 && !state.lift) {
      state.lift = true;
      audioEngine.playSfx("crane-lift");
    }
    if (progress >= 0.32 && !state.drive) {
      state.drive = true;
      audioEngine.playSfx("crane-drive");
    }
    if (progress >= 0.79 && !state.set) {
      state.set = true;
      audioEngine.playSfx("crane-set");
    }
  }, []);

  useEffect(() => {
    if (!playing) return;
    audioEngine.resume();
    lastRef.current = performance.now();
    const tick = (time: number) => {
      const baseInterval = 1000 / (fps * speed);
      const currentFrame = frames[Math.min(frameIdx, frames.length - 1)];
      const previousFrame = frameIdx > 0 ? frames[frameIdx - 1] : null;
      const algorithmMultiplier = getAlgorithmFrameMultiplier(shortVideoType, algoId);
      const animatedSwap = shouldAnimateSwap(currentFrame, previousFrame);
      const interval = animatedSwap
        ? videoRenderMode === "3d"
          ? Math.max(baseInterval * SWAP_TRANSITION_MULTIPLIER * algorithmMultiplier, CRANE_SWAP_MS / Math.max(0.1, speed))
          : baseInterval * SWAP_TRANSITION_MULTIPLIER * algorithmMultiplier
        : baseInterval * algorithmMultiplier;
      const elapsed = time - lastRef.current;
      const progress = Math.min(1, elapsed / interval);
      setTransitionProgress(progress);
      if (videoRenderMode === "3d" && animatedSwap) playCraneMotionSfx(frameIdx, progress);

      if (elapsed >= interval) {
        lastRef.current = time;
        setFrameIdx((index) => {
          const next = index + 1;
          if (next >= frames.length) {
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
