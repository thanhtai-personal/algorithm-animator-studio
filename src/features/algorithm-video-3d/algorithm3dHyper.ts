import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";

const MAX_FEATURED_SWAPS = 14;
const MAX_NO_SWAP_PREDICTIONS = 4;

export type Algorithm3DHyperRole = "hook" | "predict" | "swap" | "milestone" | "finish" | "beat";

export type Algorithm3DHyperState = {
  kicker: string;
  headline: string;
  detail: string;
  progress: number;
  completed: number;
  total: number;
  role: Algorithm3DHyperRole;
  cut: boolean;
};

export function buildAlgorithm3DHyperTimeline(source: Frame[]) {
  if (source.length <= 2) return source.map((frame, index) => tagFrame(frame, index, index === 0 ? "hook" : "finish", false));

  const swapIndices = source
    .map((frame, index) => isAnimatedSwapAt(source, index) ? index : -1)
    .filter((index) => index > 0);
  const featuredSwaps = chooseFeaturedIndices(swapIndices, MAX_FEATURED_SWAPS);
  const selected = new Set<number>([0, source.length - 1]);
  const roles = new Map<number, Algorithm3DHyperRole>();
  const predictHighlights = new Map<number, number[]>();
  roles.set(0, "hook");
  roles.set(source.length - 1, "finish");

  featuredSwaps.forEach((swapIndex) => {
    const preIndex = Math.max(0, swapIndex - 1);
    selected.add(preIndex);
    selected.add(swapIndex);
    roles.set(preIndex, "predict");
    roles.set(swapIndex, "swap");
    predictHighlights.set(preIndex, [...source[swapIndex].swap]);
  });

  findSortedMilestones(source).forEach((index) => {
    selected.add(index);
    if (!roles.has(index)) roles.set(index, "milestone");
  });

  const compareCandidates = source
    .map((frame, index) => frame.event === "compare" && !selected.has(index) ? index : -1)
    .filter((index) => index > 0 && index < source.length - 1);
  chooseFeaturedIndices(compareCandidates, MAX_NO_SWAP_PREDICTIONS).forEach((index) => {
    selected.add(index);
    if (!roles.has(index)) roles.set(index, "predict");
  });

  // Preserve the final three source beats when they are cheap; this makes the
  // finish feel intentional instead of cutting directly from a mid-pass swap.
  for (let index = Math.max(1, source.length - 4); index < source.length - 1; index += 1) {
    if (selected.size >= 38) break;
    selected.add(index);
    if (!roles.has(index)) roles.set(index, "beat");
  }

  const indices = [...selected].sort((a, b) => a - b);
  return indices.map((sourceIndex, outputIndex) => {
    const previousSourceIndex = outputIndex > 0 ? indices[outputIndex - 1] : -1;
    const cut = outputIndex > 0 && sourceIndex - previousSourceIndex > 1;
    const sourceFrame = source[sourceIndex];
    const highlight = predictHighlights.get(sourceIndex);
    const prepared = highlight && highlight.length === 2 ? { ...sourceFrame, highlight } : sourceFrame;
    return tagFrame(prepared, sourceIndex, roles.get(sourceIndex) ?? "beat", cut);
  });
}

export function getAlgorithm3DHyperState(params: {
  frame: Frame;
  frameIndex: number;
  frameCount: number;
  lang: Lang;
  transitionProgress?: number;
}): Algorithm3DHyperState {
  const { frame, frameIndex, frameCount, lang, transitionProgress = 1 } = params;
  const total = Math.max(1, frame.arr.length);
  const sortedCount = new Set(frame.sorted.filter((index) => index >= 0 && index < total)).size;
  const role = hyperRole(frame, frameIndex, frameCount);
  const complete = role === "finish" || frameIndex >= frameCount - 1;
  const timelineProgress = frameCount <= 1 ? 1 : frameIndex / Math.max(1, frameCount - 1);
  const progress = complete ? 1 : sortedCount > 0 ? Math.min(0.98, sortedCount / total) : Math.min(0.92, timelineProgress * 0.9);
  const cut = Number(frame.vars.__hyperCut ?? 0) === 1;

  if (role === "hook") {
    return {
      kicker: lang === "vi" ? "SAI RỒI!" : "WRONG ORDER!",
      headline: lang === "vi" ? `${total} TÒA SAI!` : `${total} WRONG!`,
      detail: "FIX IT.", progress: 0, completed: 0, total, role, cut,
    };
  }

  if (complete) {
    return {
      kicker: "100%",
      headline: "SORTED ✓",
      detail: lang === "vi" ? "THÀNH PHỐ ĐÃ KHÓA" : "CITY LOCKED",
      progress: 1, completed: total, total, role: "finish", cut,
    };
  }

  if (role === "swap" || frame.event === "swap") {
    const headline = transitionProgress < 0.18
      ? "GO!"
      : transitionProgress < 0.36
        ? "LIFT!"
        : transitionProgress < 0.76
          ? "SWAP!"
          : transitionProgress < 0.90
            ? "DROP!"
            : "LOCK!";
    return {
      kicker: lang === "vi" ? "ĐỔI CHỖ" : "MOVE",
      headline,
      detail: `${sortedCount}/${total} LOCKED`,
      progress, completed: sortedCount, total, role: "swap", cut,
    };
  }

  if (role === "milestone") {
    const percent = Math.max(1, Math.round(progress * 100));
    return {
      kicker: "LOCKED",
      headline: `${percent}% 🔥`,
      detail: `${sortedCount}/${total}`,
      progress, completed: sortedCount, total, role, cut,
    };
  }

  const pair = getComparePair(frame);
  if (role === "predict" && pair) {
    return {
      kicker: cut ? "NEXT!" : "PREDICT",
      headline: `${pair[0]} > ${pair[1]} ?`,
      detail: frame.event === "compare" ? "SWAP?" : "CHECK!",
      progress, completed: sortedCount, total, role, cut,
    };
  }

  const remaining = Math.max(0, total - sortedCount);
  return {
    kicker: remaining <= 3 && sortedCount > 0 ? "FINAL RUN" : "NEXT!",
    headline: remaining <= 3 && sortedCount > 0 ? `${remaining} LEFT` : `${Math.round(progress * 100)}%`,
    detail: `${sortedCount}/${total} LOCKED`,
    progress, completed: sortedCount, total, role: "beat", cut,
  };
}

export function getAlgorithm3DHyperFrameSeconds(frame: Frame | null | undefined) {
  if (!frame) return 0.10;
  const role = String(frame.vars.__hyperRole ?? "beat") as Algorithm3DHyperRole;
  if (role === "hook") return 0.32;
  if (role === "finish") return 0.72;
  if (role === "milestone") return 0.24;
  if (frame.event === "swap" || role === "swap") return 0.58;
  if (role === "predict" || frame.event === "compare") return 0.16;
  return 0.11;
}

function tagFrame(frame: Frame, sourceIndex: number, role: Algorithm3DHyperRole, cut: boolean): Frame {
  return {
    ...frame,
    arr: [...frame.arr],
    highlight: [...frame.highlight],
    swap: [...frame.swap],
    sorted: [...frame.sorted],
    vars: {
      ...frame.vars,
      __hyperSourceIndex: sourceIndex,
      __hyperRole: role,
      __hyperCut: cut ? 1 : 0,
    },
  };
}

function chooseFeaturedIndices(indices: number[], limit: number) {
  if (indices.length <= limit) return indices;
  const chosen = new Set<number>();
  const head = Math.min(2, limit);
  const tail = Math.min(3, Math.max(0, limit - head));
  indices.slice(0, head).forEach((index) => chosen.add(index));
  indices.slice(-tail).forEach((index) => chosen.add(index));
  const remaining = Math.max(0, limit - chosen.size);
  for (let slot = 1; slot <= remaining; slot += 1) {
    const position = Math.round((slot / (remaining + 1)) * (indices.length - 1));
    chosen.add(indices[position]);
  }
  return [...chosen].sort((a, b) => a - b).slice(0, limit);
}

function findSortedMilestones(frames: Frame[]) {
  const total = Math.max(1, frames[0]?.arr.length ?? 1);
  const targets = [0.25, 0.5, 0.75].map((ratio) => Math.max(1, Math.ceil(total * ratio)));
  const found: number[] = [];
  for (const target of targets) {
    const index = frames.findIndex((frame) => new Set(frame.sorted).size >= target);
    if (index > 0 && index < frames.length - 1 && !found.includes(index)) found.push(index);
  }
  return found;
}

function hyperRole(frame: Frame, frameIndex: number, frameCount: number) {
  if (frameIndex === 0) return "hook" as const;
  if (frameIndex >= frameCount - 1) return "finish" as const;
  const role = String(frame.vars.__hyperRole ?? "beat");
  if (role === "predict" || role === "swap" || role === "milestone" || role === "finish" || role === "hook") return role;
  return "beat" as const;
}

function getComparePair(frame: Frame): [number, number] | null {
  const indices = frame.highlight.filter((index) => index >= 0 && index < frame.arr.length);
  if (indices.length >= 2) return [frame.arr[indices[0]], frame.arr[indices[1]]];
  if (frame.swap.length === 2) return [frame.arr[frame.swap[0]], frame.arr[frame.swap[1]]];
  return null;
}

function isAnimatedSwapAt(frames: Frame[], index: number) {
  if (index <= 0) return false;
  const frame = frames[index];
  const previous = frames[index - 1];
  if (frame.event !== "swap" || frame.swap.length !== 2) return false;
  const [a, b] = frame.swap;
  return previous.arr.length === frame.arr.length
    && previous.arr[a] === frame.arr[b]
    && previous.arr[b] === frame.arr[a];
}
