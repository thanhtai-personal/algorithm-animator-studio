import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { NormalizedTimelineVideoClip, TimelineVideoRenderProject } from "../models/TimelineVideo";
import type { RuntimeEnvValues } from "./EnvFileService";
import { createVideoOutput } from "../utils/videoOutput";
import { assertOutputHasAudio, timelineProjectHasAudio } from "./TimelineAudioMix";
import { normalizeTimelineProject } from "./TimelineProjectNormalizer";

const ENTRY_POINT = path.resolve(process.cwd(), "src/features/remotion-video/remotion/index.ts");
const COMPOSITION_ID = "TimelineVideo";
const BUNDLE_TIMEOUT_MS = 3 * 60 * 1000;
const METADATA_TIMEOUT_MS = 2 * 60 * 1000;
const MEDIA_DELAY_RENDER_TIMEOUT_MS = 2 * 60 * 1000;
const RENDER_STALL_TIMEOUT_MS = 4 * 60 * 1000;

export type RemotionTimelineProgress = {
  progress: number;
  stage: "preparing" | "bundling" | "metadata" | "rendering" | "muxing" | "verifying";
  message: string;
};

export async function renderRemotionTimelineVideo(params: {
  project: TimelineVideoRenderProject;
  assetFiles: Record<string, Express.Multer.File>;
  envOverrides?: RuntimeEnvValues;
  onProgress?: (event: RemotionTimelineProgress) => void;
}) {
  const project = normalizeTimelineProject(params.project, "remotion");
  const visualClips = project.clips.filter((clip) => clip.type !== "audio");
  if (!visualClips.length) throw new Error("Timeline cần ít nhất 1 ảnh hoặc video.");
  if (!fs.existsSync(ENTRY_POINT)) throw new Error(`Không tìm thấy Remotion entry point: ${ENTRY_POINT}`);

  let lastProgress = -1;
  const report = (event: RemotionTimelineProgress) => {
    const progress = Math.max(lastProgress, Math.min(0.999, Math.max(0, event.progress)));
    lastProgress = progress;
    params.onProgress?.({ ...event, progress });
  };

  report({ progress: 0.01, stage: "preparing", message: "Đang chuẩn bị media cho Remotion..." });

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

    const durationSeconds = visualClips.reduce((sum, clip) => sum + clip.durationSeconds, 0);
    const expectedAudio = await timelineProjectHasAudio(project, params.assetFiles, durationSeconds, params.envOverrides);
    const output = createVideoOutput(project.title, params.envOverrides);

    const { bundle } = await import("@remotion/bundler");
    const { makeCancelSignal, renderMedia, selectComposition } = await import("@remotion/renderer");
    const bundleFn = bundle as unknown as (options: Record<string, unknown>) => Promise<string>;

    report({ progress: 0.03, stage: "bundling", message: "Đang bundle project Remotion..." });
    const serveUrl = await withTimeout(bundleFn({
      entryPoint: ENTRY_POINT,
      publicDir,
      onProgress: (progress: number) => {
        report({
          progress: 0.03 + Math.max(0, Math.min(1, progress)) * 0.09,
          stage: "bundling",
          message: `Đang bundle Remotion ${Math.round(progress * 100)}%...`,
        });
      },
    }), BUNDLE_TIMEOUT_MS, "Bundle Remotion mất quá lâu (> 3 phút). Hãy kiểm tra node_modules và dung lượng media.");

    report({ progress: 0.13, stage: "metadata", message: "Đang đọc composition và metadata..." });
    const composition = await withTimeout(
      selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps }),
      METADATA_TIMEOUT_MS,
      "Remotion không đọc được composition sau 2 phút. Có thể media hoặc browser renderer đang bị treo.",
    );

    const { cancelSignal, cancel } = makeCancelSignal();
    const wallClockTimeoutMs = getWallClockTimeoutMs(durationSeconds);
    let cancelledByTimeout = false;
    let cancelledByStall = false;
    const wallClockTimer = setTimeout(() => {
      cancelledByTimeout = true;
      cancel();
    }, wallClockTimeoutMs);
    let stallTimer: NodeJS.Timeout | undefined;
    const touchStallTimer = () => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        cancelledByStall = true;
        cancel();
      }, RENDER_STALL_TIMEOUT_MS);
    };
    touchStallTimer();

    report({ progress: 0.15, stage: "rendering", message: `Bắt đầu render ${durationSeconds.toFixed(1)}s video...` });

    try {
      await renderMedia({
        codec: "h264",
        audioCodec: "aac",
        audioBitrate: "192k",
        crf: 18,
        x264Preset: "veryfast",
        concurrency: "50%",
        composition,
        serveUrl,
        inputProps,
        outputLocation: output.outputPath,
        timeoutInMilliseconds: MEDIA_DELAY_RENDER_TIMEOUT_MS,
        cancelSignal,
        logLevel: "warn",
        onStart: ({ frameCount, resolvedConcurrency }) => {
          touchStallTimer();
          console.log(`[Remotion timeline] ${frameCount} frames, concurrency=${resolvedConcurrency}`);
        },
        onProgress: ({ progress, stitchStage, renderedFrames, encodedFrames }) => {
          touchStallTimer();
          const stage = stitchStage === "muxing" ? "muxing" : "rendering";
          const percent = Math.max(0, Math.min(1, progress));
          const mapped = 0.15 + percent * 0.78;
          const detail = stitchStage === "muxing"
            ? "Đang ghép audio/video..."
            : `Đang render Remotion ${Math.round(percent * 100)}% (${renderedFrames} frame render, ${encodedFrames} frame encode)...`;
          report({ progress: mapped, stage, message: detail });
        },
        onDownload: (src) => {
          console.log(`[Remotion timeline] Reading media: ${src}`);
          return ({ percent }) => {
            touchStallTimer();
            if (percent !== null) console.log(`[Remotion timeline] Media ${Math.round(percent * 100)}%: ${src}`);
          };
        },
        onBrowserLog: (log) => {
          if (log.type === "error" || log.type === "warn") console.log(`[Remotion browser:${log.type}] ${log.text}`);
        },
      });
    } catch (error) {
      if (cancelledByStall) {
        throw new Error("Remotion không có tiến độ mới trong 4 phút nên đã tự hủy. Media decode hoặc một frame có thể đang bị kẹt; xem log server để biết stage cuối cùng.");
      }
      if (cancelledByTimeout) {
        throw new Error(`Remotion đã bị hủy vì render quá lâu (${Math.round(wallClockTimeoutMs / 60000)} phút). Xem log tiến độ để xác định media/frame bị kẹt.`);
      }
      throw error;
    } finally {
      clearTimeout(wallClockTimer);
      if (stallTimer) clearTimeout(stallTimer);
    }

    report({ progress: 0.96, stage: "verifying", message: "Đang kiểm tra MP4 và audio stream..." });
    if (!fs.existsSync(output.outputPath)) throw new Error("Remotion render xong nhưng không tạo tệp MP4.");
    await assertOutputHasAudio(output.outputPath, expectedAudio, params.envOverrides);

    params.onProgress?.({ progress: 1, stage: "verifying", message: "Render Remotion hoàn tất." });

    return {
      ok: true,
      engine: "remotion-timeline" as const,
      fileName: output.outputFileName,
      relativePath: output.relativePath,
      videoUrl: output.videoUrl,
      durationSeconds,
      width: composition.width,
      height: composition.height,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function getWallClockTimeoutMs(durationSeconds: number) {
  // Rendering a 1080p timeline can be several times slower than real-time on a laptop.
  // Give long videos enough headroom while still preventing a request from hanging forever.
  return Math.min(45 * 60 * 1000, Math.max(8 * 60 * 1000, Math.ceil(durationSeconds * 6000) + 2 * 60 * 1000));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
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
