import type { Frame } from "@/lib/algorithms";
import type { LongContentScene } from "@/lib/longContentTimeline";

export function getBitonicCuePosition(progress: number, frames: Frame[], scene: LongContentScene) {
  if (scene.id === "bitonic-step-by-step") {
    const cues = [
      { at: 0, frame: 0 },
      { at: 0.14, frame: findStageFrame(frames, "split") },
      { at: 0.28, frame: findBitonicFrame(frames, "merge", "asc", 4, 0, "compare") },
      { at: 0.42, frame: findBitonicFrame(frames, "merge", "asc", 4, 1, "compare") },
      { at: 0.55, frame: findBitonicFrame(frames, "merge", "asc", 4, 1, "swap") },
      { at: 0.68, frame: findBitonicFrame(frames, "merge", "asc", 4, 3, "compare") },
      { at: 0.8, frame: findFirstGapFrame(frames, 2) },
      { at: 0.9, frame: findFirstGapFrame(frames, 1) },
      { at: 1, frame: frames.length - 1 },
    ].filter((cue) => cue.frame >= 0);
    return getCuePosition(clamp01(progress), cues);
  }

  if (scene.id === "bitonic-animation") return getBitonicWeightedPosition(progress, frames);
  return getWeightedPosition(progress, frames);
}

function findStageFrame(frames: Frame[], stage: string) {
  return frames.findIndex((frame) => frame.vars.stage === stage);
}

function findBitonicFrame(frames: Frame[], stage: string, dir: string, gap: number, visibleI: number, event: Frame["event"]) {
  return frames.findIndex((frame) => (
    frame.vars.stage === stage
    && frame.vars.dir === dir
    && frame.vars.gap === gap
    && frame.highlight.includes(visibleI)
    && frame.event === event
  ));
}

function findFirstGapFrame(frames: Frame[], gap: number) {
  return frames.findIndex((frame) => frame.vars.stage === "merge" && frame.vars.gap === gap && frame.event === "compare");
}

function getBitonicWeightedPosition(progress: number, frames: Frame[]) {
  const groups = groupByStageDirGap(frames);
  if (groups.length <= 1) return getWeightedPosition(progress, frames);
  const total = groups.reduce((sum, group) => sum + group.weight, 0) || 1;
  let cursor = 0;
  const safe = clamp01(progress);
  for (const group of groups) {
    const share = group.weight / total;
    const next = cursor + share;
    if (safe <= next || group === groups[groups.length - 1]) {
      const local = share > 0 ? clamp01((safe - cursor) / share) : 1;
      return group.start + getWeightedPosition(local, frames.slice(group.start, group.end + 1));
    }
    cursor = next;
  }
  return frames.length - 1;
}

function groupByStageDirGap(frames: Frame[]) {
  const groups: Array<{ key: string; start: number; end: number; weight: number }> = [];
  let key = "";
  let start = 0;
  frames.forEach((frame, index) => {
    const nextKey = `${frame.vars.stage ?? "init"}:${frame.vars.dir ?? "none"}:${frame.vars.gap ?? "none"}:${frame.vars.lo ?? "all"}:${frame.vars.count ?? "all"}`;
    if (!key) {
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
  if (key) groups.push({ key, start, end: frames.length - 1, weight: getGroupWeight(frames.slice(start)) });
  return groups;
}

function getGroupWeight(frames: Frame[]) {
  return frames.reduce((sum, frame) => sum + frameWeight(frame), 0) || 1;
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
  const weights = frames.map(frameWeight);
  const target = clamp01(progress) * weights.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  for (let index = 0; index < frames.length; index++) {
    const next = cursor + weights[index];
    if (target <= next || index === frames.length - 1) return Math.max(0, index - 1) + easeInOutCubic((target - cursor) / Math.max(0.001, weights[index]));
    cursor = next;
  }
  return frames.length - 1;
}

function frameWeight(frame: Frame) {
  if (frame.event === "swap") return 4;
  if (frame.event === "compare") return 2.8;
  if (frame.vars.stage === "split") return 1.7;
  if (frame.vars.gap) return 1.3;
  return 1;
}

function easeInOutCubic(value: number) {
  const safe = clamp01(value);
  return safe < 0.5 ? 4 * safe * safe * safe : 1 - Math.pow(-2 * safe + 2, 3) / 2;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
