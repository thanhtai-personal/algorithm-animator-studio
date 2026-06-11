import type { RemotionVideoAspectRatio } from "./remotionVideoTypes";
import { isVideoEditorTransition } from "../../video-editor/lib/videoEditorConstants";
import type { VideoEditorAssetType, VideoEditorFitMode, VideoEditorTransition } from "../../video-editor/lib/videoEditorTypes";

export type RemotionTimelineAsset = {
  id: string;
  type: VideoEditorAssetType;
  src: string;
  name: string;
};

export type RemotionTimelineClip = {
  id: string;
  assetId: string;
  type: VideoEditorAssetType;
  durationSeconds: number;
  fitMode: VideoEditorFitMode;
  transition: VideoEditorTransition;
  transitionSeconds: number;
  keepOriginalAudio?: boolean;
};

export type RemotionTimelineInputProps = {
  title: string;
  aspectRatio: RemotionVideoAspectRatio;
  fps: number;
  clips: RemotionTimelineClip[];
  assets: RemotionTimelineAsset[];
  backgroundColor: string;
  watermark: string;
  showWatermark: boolean;
  watermarkLogoAssetId: string;
};

export const DEFAULT_REMOTION_TIMELINE: RemotionTimelineInputProps = {
  title: "proshow-remotion-video",
  aspectRatio: "16:9",
  fps: 30,
  clips: [],
  assets: [],
  backgroundColor: "#020617",
  watermark: "KAI STUDIO",
  showWatermark: true,
  watermarkLogoAssetId: "",
};

export function getTimelineDurationSeconds(props: Pick<RemotionTimelineInputProps, "clips">) {
  return Math.max(1, props.clips.filter((clip) => clip.type !== "audio").reduce((sum, clip) => sum + clip.durationSeconds, 0));
}

export function normalizeRemotionTimelineInput(raw: Partial<RemotionTimelineInputProps>): RemotionTimelineInputProps {
  const clips = Array.isArray(raw.clips) ? raw.clips : [];
  const assets = Array.isArray(raw.assets) ? raw.assets : [];
  return {
    ...DEFAULT_REMOTION_TIMELINE,
    ...raw,
    title: sanitizeText(raw.title, DEFAULT_REMOTION_TIMELINE.title, 96),
    watermark: sanitizeText(raw.watermark, DEFAULT_REMOTION_TIMELINE.watermark, 40),
    showWatermark: raw.showWatermark !== false,
    watermarkLogoAssetId: sanitizeText(raw.watermarkLogoAssetId, "", 120),
    aspectRatio: raw.aspectRatio === "9:16" ? "9:16" : "16:9",
    fps: clampNumber(raw.fps, 24, 60, 30),
    backgroundColor: sanitizeColor(raw.backgroundColor, DEFAULT_REMOTION_TIMELINE.backgroundColor),
    assets: assets.map((asset, index) => ({
      id: sanitizeText(asset.id, `asset-${index}`, 120),
      type: asset.type === "audio" || asset.type === "video" ? asset.type : "image",
      src: sanitizeText(asset.src, "", 260),
      name: sanitizeText(asset.name, `Asset ${index + 1}`, 120),
    })).filter((asset) => asset.src),
    clips: clips.map((clip, index) => ({
      id: sanitizeText(clip.id, `clip-${index}`, 80),
      assetId: sanitizeText(clip.assetId, "", 120),
      type: clip.type === "audio" || clip.type === "video" ? clip.type : "image",
      durationSeconds: clampNumber(clip.durationSeconds, 1, 180, 4),
      fitMode: clip.fitMode === "contain" ? "contain" : "cover",
      transition: isVideoEditorTransition(clip.transition) ? clip.transition : "blurry",
      transitionSeconds: clampNumber(clip.transitionSeconds, 0.2, 8, 1.5),
      keepOriginalAudio: clip.keepOriginalAudio === true,
    })).filter((clip) => clip.assetId),
  };
}

function sanitizeText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function sanitizeColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
