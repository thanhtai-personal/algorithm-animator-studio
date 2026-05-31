import type { VideoAspectRatio, VideoFitMode, GenerateVideoResponse } from "@/features/story-video/types";

export type StoryReviewStepId = "story" | "script" | "scenes" | "render";

export type StoryReviewScene = {
  id: string;
  title: string;
  prompt: string;
  durationSeconds: number;
  file: File | null;
};

export type StoryReviewDraft = {
  storyTitle: string;
  sourceName: string;
  sourceUrl: string;
  genre: string;
  targetAudience: string;
  angle: string;
  sourceNotes: string;
  reviewScript: string;
  videoFileName: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
  scenes: Omit<StoryReviewScene, "file">[];
};

export type StoryReviewMergeResult = GenerateVideoResponse;
