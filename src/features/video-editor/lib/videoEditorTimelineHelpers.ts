import { createAssetFromFile } from "./videoEditorAssetHelpers";
import type { TimelineRenderResponse, VideoEditorAsset, VideoEditorClip } from "./videoEditorTypes";

export function getPreviewClip(clips: VideoEditorClip[], elapsed: number) {
  let cursor = 0;
  for (const clip of clips) {
    const end = cursor + clip.durationSeconds;
    if (elapsed >= cursor && elapsed < end) return { clip, localTime: elapsed - cursor };
    cursor = end;
  }
  return clips.length ? { clip: clips[clips.length - 1], localTime: clips[clips.length - 1].durationSeconds } : null;
}

export function toRenderClip(clip: VideoEditorClip) {
  return {
    id: clip.id,
    assetId: clip.assetId,
    type: clip.type,
    durationSeconds: clip.durationSeconds,
    fitMode: clip.fitMode,
    transition: clip.transition,
    transitionSeconds: clip.transitionSeconds,
    keepOriginalAudio: clip.keepOriginalAudio === true,
    volume: clampVolume(clip.volume),
  };
}

export function getActiveTimelineClip(clips: VideoEditorClip[], elapsed: number) {
  let cursor = 0;
  for (const clip of clips) {
    const end = cursor + clip.durationSeconds;
    if (elapsed >= cursor && elapsed < end) return { clip, localTime: elapsed - cursor };
    cursor = end;
  }
  return null;
}

export function clampVolume(value: unknown) {
  const parsed = Number(value ?? 1);
  return Number.isFinite(parsed) ? Math.min(2, Math.max(0, parsed)) : 1;
}

export function canUseOnTrack(asset: VideoEditorAsset, track: "visual" | "audio") {
  return track === "audio" ? asset.type === "audio" : asset.type === "image" || asset.type === "video";
}

export function canClipUseTrack(clip: VideoEditorClip, track: "visual" | "audio") {
  return track === "audio" ? clip.type === "audio" : clip.type !== "audio";
}

export function insertBefore(clips: VideoEditorClip[], clip: VideoEditorClip, beforeClipId: string) {
  const index = clips.findIndex((item) => item.id === beforeClipId);
  if (index < 0) return [...clips, clip];
  return [...clips.slice(0, index), clip, ...clips.slice(index)];
}

export function downloadVideo(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function createRenderedVideoAsset(video: TimelineRenderResponse) {
  const response = await fetch(video.videoUrl);
  if (!response.ok) throw new Error("Đã render xong nhưng không tải lại được video vào kho media.");
  const blob = await response.blob();
  const file = new File([blob], video.fileName, { type: blob.type || "video/mp4" });
  return { ...createAssetFromFile(file, video.fileName), durationSeconds: video.durationSeconds };
}
