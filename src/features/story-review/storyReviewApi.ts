import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type { VideoAspectRatio, VideoFitMode } from "@/features/story-video/types";
import type { StoryReviewMergeResult, StoryReviewScene } from "./types";

export async function mergeStoryReviewVideo(payload: {
  scenes: StoryReviewScene[];
  audioFile: File | null;
  videoFileName: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
}) {
  const formData = new FormData();
  formData.append("videoFileName", payload.videoFileName);
  formData.append("aspectRatio", payload.aspectRatio);
  formData.append("fitMode", payload.fitMode);
  formData.append("scenes", JSON.stringify(payload.scenes.map((scene) => ({
    id: scene.id,
    durationSeconds: scene.durationSeconds,
  }))));
  payload.scenes.forEach((scene) => {
    if (scene.file) formData.append(`scene-${scene.id}`, scene.file);
  });
  if (payload.audioFile) formData.append("audio", payload.audioFile);

  return parseApiResponse<StoryReviewMergeResult>(await fetch(buildApiUrl("/api/story-review/video/merge"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
    body: formData,
  }));
}
