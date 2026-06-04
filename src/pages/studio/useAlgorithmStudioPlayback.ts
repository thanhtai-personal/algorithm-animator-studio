import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Frame } from "@/lib/algorithms";
import { audioEngine, type SfxKind } from "@/lib/audio";
import type { ShortVideoType } from "@/lib/shortVideoTypes";

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
  sfxCompare: SfxKind;
  sfxSwap: SfxKind;
};

export function useAlgorithmStudioPlayback(params: PlaybackParams) {
  const {
    playing, setPlaying, fps, speed, frames, frameIdx, setFrameIdx,
    setTransitionProgress, algoId, shortVideoType, sfxCompare, sfxSwap,
  } = params;
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
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
    if (event === "compare") audioEngine.playSfx(sfxCompare, pitch);
    else if (event === "swap" || event === "found" || event === "visit") audioEngine.playSfx(sfxSwap, pitch);
  }, [sfxCompare, sfxSwap]);

  useEffect(() => {
    if (!playing) return;
    audioEngine.resume();
    lastRef.current = performance.now();
    const tick = (time: number) => {
      const baseInterval = 1000 / (fps * speed);
      const currentFrame = frames[Math.min(frameIdx, frames.length - 1)];
      const previousFrame = frameIdx > 0 ? frames[frameIdx - 1] : null;
      const algorithmMultiplier = getAlgorithmFrameMultiplier(shortVideoType, algoId);
      const interval = shouldAnimateSwap(currentFrame, previousFrame)
        ? baseInterval * SWAP_TRANSITION_MULTIPLIER * algorithmMultiplier
        : baseInterval * algorithmMultiplier;
      const elapsed = time - lastRef.current;
      setTransitionProgress(Math.min(1, elapsed / interval));
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
  }, [playing, fps, speed, frames, frameIdx, shortVideoType, algoId, setTransitionProgress, setFrameIdx, setPlaying, playEvent]);

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
