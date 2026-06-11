import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { NormalizedTimelineVideoClip, NormalizedTimelineVideoProject, TimelineVideoRenderProject } from "../models/TimelineVideo";
import type { RuntimeEnvValues } from "./EnvFileService";
import { createVideoOutput } from "../utils/videoOutput";

const ENTRY_POINT = path.resolve(process.cwd(), "src/features/remotion-video/remotion/index.ts");
const COMPOSITION_ID = "TimelineVideo";

export async function renderRemotionTimelineVideo(params: {
  project: TimelineVideoRenderProject;
  assetFiles: Record<string, Express.Multer.File>;
  envOverrides?: RuntimeEnvValues;
}) {
  const project = normalizeTimelineProject(params.project);
  const visualClips = project.clips.filter((clip) => clip.type !== "audio");
  if (!visualClips.length) throw new Error("Timeline cần ít nhất 1 ảnh hoặc video.");
  if (!fs.existsSync(ENTRY_POINT)) throw new Error(`Không tìm thấy Remotion entry point: ${ENTRY_POINT}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kai-remotion-timeline-"));
  const publicDir = path.join(tempDir, "public");
  const assetDir = path.join(publicDir, "timeline-assets");
  fs.mkdirSync(assetDir, { recursive: true });

  try {
    const assets = copyAssetsToPublicDir(project.clips, params.assetFiles, assetDir, project.watermarkLogoAssetId);
    const inputProps = {
      title: project.title,
      aspectRatio: project.aspectRatio,
      fps: project.fps,
      clips: project.clips,
      assets,
      backgroundColor: "#020617",
      watermark: project.watermarkText,
      showWatermark: project.showWatermark,
      watermarkLogoAssetId: project.watermarkLogoAssetId,
    };

    const { bundle } = await import("@remotion/bundler");
    const { renderMedia, selectComposition } = await import("@remotion/renderer");
    const bundleFn = bundle as unknown as (options: Record<string, unknown>) => Promise<string>;
    const serveUrl = await bundleFn({
      entryPoint: ENTRY_POINT,
      publicDir,
      onProgress: (progress: number) => console.log(`Remotion timeline bundle ${Math.round(progress * 100)}%`),
    });
    const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps });
    const output = createVideoOutput(project.title, params.envOverrides);

    await renderMedia({
      codec: "h264",
      crf: 18,
      composition,
      serveUrl,
      inputProps,
      outputLocation: output.outputPath,
    });

    if (!fs.existsSync(output.outputPath)) throw new Error("Remotion render xong nhưng không tạo tệp MP4.");

    return {
      ok: true,
      engine: "remotion-timeline" as const,
      fileName: output.outputFileName,
      relativePath: output.relativePath,
      videoUrl: output.videoUrl,
      durationSeconds: visualClips.reduce((sum, clip) => sum + clip.durationSeconds, 0),
      width: composition.width,
      height: composition.height,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function copyAssetsToPublicDir(clips: NormalizedTimelineVideoClip[], files: Record<string, Express.Multer.File>, assetDir: string, logoAssetId: string) {
  const usedAssetIds = Array.from(new Set([...clips.map((clip) => clip.assetId), logoAssetId].filter(Boolean)));
  return usedAssetIds.map((assetId) => {
    const file = files[assetId];
    if (!file?.path || !fs.existsSync(file.path)) throw new Error(`Không tìm thấy file timeline: ${assetId}`);
    const fileName = `${safeFileStem(assetId)}${safeExt(file.originalname)}`;
    const outputPath = path.join(assetDir, fileName);
    fs.copyFileSync(file.path, outputPath);
    const clip = clips.find((item) => item.assetId === assetId);
    return {
      id: assetId,
      type: clip?.type || "image",
      src: `timeline-assets/${fileName}`,
      name: file.originalname || fileName,
    };
  });
}

function normalizeTimelineProject(raw: TimelineVideoRenderProject): NormalizedTimelineVideoProject {
  const clips = Array.isArray(raw.clips) ? raw.clips : [];
  const normalizedClips = clips
    .map((clip, index) => ({
      id: sanitizeText(clip.id, `clip-${index}`, 80),
      assetId: sanitizeText(clip.assetId, "", 120),
      type: clip.type === "audio" || clip.type === "video" ? clip.type : "image",
      durationSeconds: clampNumber(clip.durationSeconds, 1, 7200, 4),
      fitMode: clip.fitMode === "contain" ? "contain" : "cover",
      transition: normalizeTransition(clip.transition),
      transitionSeconds: clampNumber(clip.transitionSeconds, 0.2, 8, 1.5),
      keepOriginalAudio: clip.keepOriginalAudio === true,
      volume: clampNumber(clip.volume, 0, 2, 1),
    }))
    .filter((clip): clip is NormalizedTimelineVideoClip => Boolean(clip.assetId));

  return {
    title: sanitizeText(raw.title, "remotion-timeline-video", 96),
    aspectRatio: raw.aspectRatio === "9:16" ? "9:16" : "16:9",
    fps: clampNumber(raw.fps, 24, 60, 30),
    renderEngine: "remotion",
    clips: normalizedClips,
    showWatermark: raw.showWatermark !== false,
    watermarkText: sanitizeText(raw.watermarkText, "KAI STUDIO", 40),
    watermarkLogoAssetId: sanitizeText(raw.watermarkLogoAssetId, "", 120),
  };
}

function sanitizeText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeTransition(value: unknown) {
  if (
    value === "blurry" ||
    value === "fade" ||
    value === "zoom-in" ||
    value === "zoom-out" ||
    value === "slide-left" ||
    value === "slide-right" ||
    value === "slide-up" ||
    value === "slide-down" ||
    value === "push-left" ||
    value === "push-right" ||
    value === "none"
  ) return value;
  return "blurry";
}

function safeFileStem(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80) || `asset-${Date.now()}`;
}

function safeExt(fileName: string) {
  const ext = path.extname(fileName || "").toLowerCase().replace(/[^.a-z0-9]/g, "");
  return ext || ".bin";
}
