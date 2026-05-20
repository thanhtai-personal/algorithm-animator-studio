import type { Frame } from "@/lib/algorithms";
import type { LongContentScene } from "@/lib/longContentTimeline";

export function getOddEvenCuePosition(progress: number, frames: Frame[], scene: LongContentScene) {
  if (scene.id === "phase-walkthrough") {
    const cues = [
      { at: 0, frame: 0 },
      { at: 0.13, frame: findOddEvenFrame(frames, 0, "odd", 1, "compare") },
      { at: 0.25, frame: findOddEvenFrame(frames, 0, "odd", 1, "swap") },
      { at: 0.37, frame: findOddEvenFrame(frames, 0, "odd", 3, "compare") },
      { at: 0.49, frame: findOddEvenFrame(frames, 0, "odd", 3, "swap") },
      { at: 0.61, frame: findOddEvenFrame(frames, 0, "even", 0, "compare") },
      { at: 0.72, frame: findOddEvenFrame(frames, 0, "even", 0, "swap") },
      { at: 0.82, frame: findOddEvenFrame(frames, 0, "even", 2, "compare") },
      { at: 0.89, frame: findOddEvenFrame(frames, 0, "even", 2, "swap") },
      { at: 0.95, frame: findOddEvenFrame(frames, 0, "even", 4, "compare") },
      { at: 1, frame: findOddEvenFrame(frames, 0, "even", 4, "swap") },
    ].filter((cue) => cue.frame >= 0);
    return getCuePosition(progress, cues);
  }

  return getOddEvenPhaseWeightedPosition(progress, frames);
}

function findOddEvenFrame(frames: Frame[], pass: number, phase: string, i: number, event: Frame["event"]) {
  return frames.findIndex((frame) => frame.vars.pass === pass && frame.vars.phase === phase && frame.vars.i === i && frame.event === event);
}

function getOddEvenPhaseWeightedPosition(progress: number, frames: Frame[]) {
  const groups = groupByPassAndPhase(frames);
  if (groups.length <= 1) return getWeightedOperationLocalPosition(progress, frames);
  const total = groups.reduce((sum, group) => sum + group.weight, 0) || 1;
  let cursor = 0;
  const safe = clamp01(progress);

  for (const group of groups) {
    const share = group.weight / total;
    const next = cursor + share;
    if (safe <= next || group === groups[groups.length - 1]) {
      const local = share > 0 ? clamp01((safe - cursor) / share) : 1;
      return group.start + getWeightedOperationLocalPosition(local, frames.slice(group.start, group.end + 1));
    }
    cursor = next;
  }
  return frames.length - 1;
}

function groupByPassAndPhase(frames: Frame[]) {
  const groups: Array<{ key: string; start: number; end: number; weight: number }> = [];
  let key: string | null = null;
  let start = 0;
  frames.forEach((frame, index) => {
    const nextKey = `${frame.vars.pass ?? "init"}:${frame.vars.phase ?? "none"}`;
    if (key == null) {
      key = nextKey;
      start = index;
      return;
    }
    if (nextKey !== key) {
      groups.push({ key, start, end: index - 1, weight: getGroupWeight(frames.slice(start, index)) });
      key = nextKey;
      start = index;
    }
  });
  if (key != null) groups.push({ key, start, end: frames.length - 1, weight: getGroupWeight(frames.slice(start)) });
  return groups;
}

function getGroupWeight(frames: Frame[]) {
  return frames.reduce((sum, frame) => sum + getFrameHoldWeight(frame), 0) || 1;
}

function getCuePosition(progress: number, cues: Array<{ at: number; frame: number }>) {
  if (cues.length <= 1) return cues[0]?.frame ?? 0;
  for (let index = 0; index < cues.length - 1; index++) {
    const current = cues[index], next = cues[index + 1];
    if (progress <= next.at) {
      const local = clamp01((progress - current.at) / Math.max(0.001, next.at - current.at));
      const holdThenMove = local < 0.72 ? 0 : easeInOutCubic((local - 0.72) / 0.28);
      return current.frame + (next.frame - current.frame) * holdThenMove;
    }
  }
  return cues[cues.length - 1].frame;
}

function getWeightedOperationLocalPosition(progress: number, frames: Frame[]) {
  if (frames.length <= 1) return 0;
  const weights = frames.map(getFrameHoldWeight);
  const total = weights.reduce((sum, value) => sum + value, 0) || 1;
  const target = clamp01(progress) * total;
  let cursor = 0;

  for (let index = 0; index < frames.length; index++) {
    const next = cursor + weights[index];
    if (target <= next || index === frames.length - 1) {
      const local = weights[index] > 0 ? (target - cursor) / weights[index] : 1;
      return Math.max(0, index - 1) + easeInOutCubic(clamp01(local));
    }
    cursor = next;
  }
  return frames.length - 1;
}

function getFrameHoldWeight(frame: Frame) {
  if (frame.event === "compare") return 2.8;
  if (frame.event === "swap") return 3.5;
  if (frame.sorted.length) return 2.2;
  return 1.1;
}

function easeInOutCubic(value: number) {
  const safe = clamp01(value);
  return safe < 0.5 ? 4 * safe * safe * safe : 1 - Math.pow(-2 * safe + 2, 3) / 2;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
