import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { NormalizedTimelineVideoClip, TimelineVideoRenderProject } from "../models/TimelineVideo";
import type { RuntimeEnvValues } from "./EnvFileService";
import { createVideoOutput } from "../utils/videoOutput";
import { normalizeTimelineProject } from "./TimelineProjectNormalizer";

const ENTRY_POINT = path.resolve(process.cwd(), "src/features/remotion-video/remotion/index.ts");
const COMPOSITION_ID = "TimelineVideo";

export async function renderRemotionTimelineVideo(params: {
  project: TimelineVideoRenderProject;
  assetFiles: Record<string, Express.Multer.File>;
  envOverrides?: RuntimeEnvValues;
}) {
  const project = normalizeTimelineProject(params.project, "remotion");
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
      lyrics: project.lyrics,
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

function safeFileStem(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80) || `asset-${Date.now()}`;
}

function safeExt(fileName: string) {
  const ext = path.extname(fileName || "").toLowerCase().replace(/[^.a-z0-9]/g, "");
  return ext || ".bin";
}
