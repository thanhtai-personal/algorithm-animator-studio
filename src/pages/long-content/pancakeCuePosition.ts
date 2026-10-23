import type { Frame } from "@/lib/algorithms";
import type { LongContentScene } from "@/lib/longContentTimeline";

export function getPancakeCuePosition(progress: number, frames: Frame[], scene: LongContentScene) {
  if (scene.id === "pancake-step-by-step") {
    const cues = [
      { at: 0, frame: 0 },
      { at: 0.15, frame: findPancakeFrame(frames, 6, "scan max", "compare", 1) },
      { at: 0.29, frame: findPancakeMaxUpdate(frames, 6, 1) },
      { at: 0.43, frame: findPancakeFrame(frames, 6, "scan max", "compare", 5) },
      { at: 0.58, frame: findPancakeFrame(frames, 6, "flip max to top", "swap") },
      { at: 0.75, frame: findPancakeFrame(frames, 6, "flip max to sorted end", "swap") },
      { at: 0.9, frame: findPancakeLockFrame(frames, 6) },
      { at: 1, frame: findPancakeFrame(frames, 5, "scan max", "compare", 1) },
    ].filter((cue) => cue.frame >= 0);
    return getCuePosition(clamp01(progress), cues);
  }

  if (scene.id === "pancake-animation") return getPancakeRoundWeightedPosition(progress, frames, [0.34, 0.28, 0.2, 0.12, 0.06]);
  return getWeightedPosition(progress, frames);
}

function findPancakeFrame(frames: Frame[], size: number, phase: string, event?: Frame["event"], i?: number) {
  return frames.findIndex((frame) => (
    frame.vars.size === size
    && frame.vars.phase === phase
    && (event === undefined || frame.event === event)
    && (i === undefined || frame.vars.i === i)
  ));
}

function findPancakeMaxUpdate(frames: Frame[], size: number, max: number) {
  return frames.findIndex((frame) => frame.vars.size === size && frame.vars.max === max && frame.line === 4 && !frame.event);
}

function findPancakeLockFrame(frames: Frame[], size: number) {
  const lockedIndex = size - 1;
  return frames.findIndex((frame) => frame.vars.size === size && frame.sorted.includes(lockedIndex) && !frame.event);
}

function getPancakeRoundWeightedPosition(progress: number, frames: Frame[], roundWeights: number[]) {
  const groups = groupBySize(frames);
  if (groups.length <= 1) return getWeightedPosition(progress, frames);
  const total = groups.reduce((sum, _, index) => sum + (roundWeights[index] ?? 1), 0) || 1;
  let cursor = 0;

  for (let index = 0; index < groups.length; index++) {
    const share = (roundWeights[index] ?? 1) / total;
    const next = cursor + share;
    if (progress <= next || index === groups.length - 1) {
      const [start, end] = groups[index];
      const local = share > 0 ? clamp01((progress - cursor) / share) : 1;
      return start + getWeightedPosition(local, frames.slice(start, end + 1));
    }
    cursor = next;
  }

  return frames.length - 1;
}

function groupBySize(frames: Frame[]) {
  const groups: Array<[number, number]> = [];
  let currentSize: number | null = null;
  let start = 0;
  frames.forEach((frame, index) => {
    const size = typeof frame.vars.size === "number" ? frame.vars.size : currentSize;
    if (size == null) return;
    if (currentSize == null) {
      currentSize = size;
      start = 0;
      return;
    }
    if (size !== currentSize) {
      groups.push([start, index - 1]);
      currentSize = size;
      start = index;
    }
  });
  if (currentSize != null) groups.push([start, frames.length - 1]);
  return groups;
}

function getCuePosition(progress: number, cues: Array<{ at: number; frame: number }>) {
  if (cues.length <= 1) return cues[0]?.frame ?? 0;
  for (let index = 0; index < cues.length - 1; index++) {
    const current = cues[index], next = cues[index + 1];
    if (progress <= next.at) {
      const local = clamp01((progress - current.at) / Math.max(0.001, next.at - current.at));
      const move = local < 0.72 ? 0 : easeInOutCubic((local - 0.72) / 0.28);
      return current.frame + (next.frame - current.frame) * move;
    }
  }
  return cues[cues.length - 1].frame;
}

function getWeightedPosition(progress: number, frames: Frame[]) {
  if (frames.length <= 1) return 0;
  const weights = frames.map((frame) => frame.event === "compare" ? 2.5 : frame.event === "swap" ? 4 : frame.sorted.length ? 2.3 : 1.1);
  const target = clamp01(progress) * weights.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  for (let index = 0; index < frames.length; index++) {
    const next = cursor + weights[index];
    if (target <= next || index === frames.length - 1) return Math.max(0, index - 1) + easeInOutCubic((target - cursor) / Math.max(0.001, weights[index]));
    cursor = next;
  }
  return frames.length - 1;
}

function easeInOutCubic(value: number) {
  const safe = clamp01(value);
  return safe < 0.5 ? 4 * safe * safe * safe : 1 - Math.pow(-2 * safe + 2, 3) / 2;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
