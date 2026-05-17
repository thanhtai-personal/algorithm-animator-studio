import type { VideoAspectRatio, VideoFitMode } from "./Video";

export type SortAlgorithm =
  | "bubble"
  | "selection"
  | "insertion"
  | "quick"
  | "merge"
  | "heap"
  | "counting"
  | "radix"
  | "shell"
  | "custom";

export type GenerateAiShortsBody = {
  algorithm?: SortAlgorithm;
  customAlgorithmName?: string;
  itemCount?: number;
  durationSeconds?: number;
  stylePrompt?: string;
  palettePrompt?: string;
  extraPrompt?: string;
  videoFileName?: string;
};

export type EditAiShortsBody = {
  relativePath?: string;
  aspectRatio?: VideoAspectRatio;
  fitMode?: VideoFitMode;
  trimStartSeconds?: number;
  maxDurationSeconds?: number;
  videoFileName?: string;
};

export type AiShortsVideoResult = {
  ok: boolean;
  fileName: string;
  relativePath: string;
  videoUrl: string;
  source: "ai" | "edit";
  prompt?: string;
  provider?: string;
  model?: string;
};
