import fs from "node:fs";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { Router, type Request, type Response } from "express";
import type { GenerateVideoFromAudioBody, GenerateVideoFromTextBody } from "../models/Video";
import type { RemotionVideoRenderBody } from "../models/RemotionVideo";
import type { PresetVideoRenderBody } from "../models/PresetVideo";
import type { TimelineVideoRenderProject } from "../models/TimelineVideo";
import multer from "multer";
import { GENERATED_PUBLIC_PATH, SERVER_ORIGIN, buildGeneratedFileUrl } from "../config/paths";
import {
  generateVideoFromAudio,
  normalizeVideoAspectRatio,
  normalizeVideoBackgroundType,
  normalizeVideoFitMode,
} from "../services/VideoService";
import { listGeneratedVideos } from "../utils/videoOutput";
import { runFfmpeg, runFfprobe } from "../utils/ffmpeg";
import { readEnvValues } from "../services/EnvFileService";
import { resolveGeneratedResource } from "../services/ResourceService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { getRemotionHealth, renderRemotionVideo } from "../services/RemotionRenderService";
import { renderPresetVideo } from "../services/PresetVideoRenderService";
import { mixMathNarration } from "../services/MathNarrationService";
import { createPresetVideoMediaRouter } from "./presetVideoMediaRoutes";
import { renderTimelineVideo } from "../services/TimelineVideoService";
import { renderRemotionTimelineVideo } from "../services/RemotionTimelineRenderService";
import { transcribeLyricsFromMedia } from "../services/VideoLyricsService";
import { BACKGROUND_LIMITS, generateNarrationAudio, resolveOptionalBackgroundMusic, saveUploadedAudio, sendError, validateBackgroundFile } from "./videoRouteHelpers";
import {
  buildRhythmicCaptureProbeArgs,
  buildRhythmicMp4TranscodeArgs,
  normalizeRhythmicTranscodeFields,
  parseRhythmicCaptureProbe,
} from "../utils/rhythmicTranscode";

const uploadDirectory = path.join(os.tmpdir(), "piper-react-video-backgrounds");

const upload = multer({
  dest: uploadDirectory,
  limits: {
    fileSize: BACKGROUND_LIMITS.video,
  },
});
const mixedUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);

export function createVideoRouter() {
  const router = Router();

  router.get("/video/generated", (req, res) => {
    res.json({ videos: listGeneratedVideos(readRuntimeEnvFromRequest(req)) });
  });

  router.get("/video/remotion/health", (req, res) => {
    res.json(getRemotionHealth(readRuntimeEnvFromRequest(req)));
  });

  router.post("/video/transcode-mp4", upload.single("video"), async (req, res) => {
    if (!req.file?.path) return res.status(400).json({ error: "Chưa nhận được video để chuyển sang MP4." });
    const outputPath = path.join(uploadDirectory, `${randomUUID()}.mp4`);
    const cleanup = () => {
      fs.rm(req.file?.path || "", { force: true }, () => undefined);
      fs.rm(outputPath, { force: true }, () => undefined);
    };
    try {
      const envOverrides = readRuntimeEnvFromRequest(req);
      const output = normalizeRhythmicTranscodeFields(req.body || {});
      const probe = await runFfprobe(
        buildRhythmicCaptureProbeArgs(req.file.path),
        envOverrides,
      );
      const cadence = parseRhythmicCaptureProbe(probe.stdout, output.fps);
      if (!cadence) {
        cleanup();
        return res.status(422).json({
          code: "RHYTHMIC_CAPTURE_UNREADABLE",
          error: "Không đo được nhịp khung hình của bản ghi WebGL. Video chưa được xuất để tránh tạo tệp bị giật.",
        });
      }
      // Browser/WebGL capture can legitimately run below the requested cadence
      // on a busy GPU. Keep cadence as diagnostics, but let FFmpeg retime the
      // captured frames to the user's selected CFR instead of blocking export.
      await runFfmpeg(
        buildRhythmicMp4TranscodeArgs(req.file.path, outputPath, output, cadence),
        envOverrides,
      );
      res.setHeader("X-Rhythmic-Captured-Fps", cadence.capturedFps.toFixed(2));
      res.setHeader("X-Rhythmic-Max-Frame-Gap-Ms", cadence.maxFrameGapMs.toFixed(1));
      res.setHeader("X-Rhythmic-Capture-Health", cadence.healthy ? "healthy" : "degraded");
      res.once("finish", cleanup);
      res.once("close", cleanup);
      return res.sendFile(outputPath);
    } catch (error) {
      cleanup();
      return sendError(res, error);
    }
  });

  router.post("/video/render-remotion", async (req: Request<unknown, unknown, RemotionVideoRenderBody>, res: Response) => {
    try {
      const video = await renderRemotionVideo({
        input: req.body || {},
        envOverrides: readRuntimeEnvFromRequest(req),
      });
      return res.json(video);
    } catch (error) {
      return sendError(res, error);
    }
  });

  router.use(createPresetVideoMediaRouter());

  router.post("/video/math-narration/mix", async (req,res) => {
    try {
      const audio=await mixMathNarration(req.body||{},readRuntimeEnvFromRequest(req));
      return res.json(audio);
    } catch(error) {
      return res.status(400).json({error:error instanceof Error?error.message:"Không ghép được giọng đọc toán học."});
    }
  });

  router.post("/video/render-preset", async (req: Request<unknown, unknown, PresetVideoRenderBody>, res: Response) => {
    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const writeEvent = (payload: unknown) => {
      if (!res.writableEnded && !res.destroyed) res.write(`${JSON.stringify(payload)}\n`);
    };

    try {
      const video = await renderPresetVideo({
        input: req.body || {},
        envOverrides: readRuntimeEnvFromRequest(req),
        onProgress: (event) => writeEvent({ type: "progress", ...event }),
      });
      writeEvent({ type: "result", result: video });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || "Render preset video thất bại.");
      writeEvent({ type: "error", error: message });
    } finally {
      if (!res.writableEnded) res.end();
    }
  });

  router.post("/video/auto-lyrics", upload.single("media"), async (req, res) => {
    if (!req.file?.path) return res.status(400).json({ error: "Chưa nhận được audio/video để tạo lyric." });
    try {
      const result = await transcribeLyricsFromMedia({
        inputPath: req.file.path,
        originalName: req.file.originalname,
        model: String(req.body?.model || "base"),
        language: String(req.body?.language || "auto"),
        envOverrides: readRuntimeEnvFromRequest(req),
      });
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    } finally {
      fs.rm(req.file.path, { force: true }, () => undefined);
    }
  });

  router.post("/video/render-timeline", upload.any(), async (req, res) => {
    const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : [];
    let streamingRemotion = false;
    try {
      const rawProject = typeof req.body?.project === "string" ? JSON.parse(req.body.project) as TimelineVideoRenderProject : {};
      const assetFiles = Object.fromEntries(
        files
          .filter((file) => file.fieldname.startsWith("asset:"))
          .map((file) => [file.fieldname.slice("asset:".length), file])
      );
      const envOverrides = readRuntimeEnvFromRequest(req);

      if (rawProject.renderEngine === "remotion") {
        streamingRemotion = true;
        res.status(200);
        res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();

        const writeEvent = (payload: unknown) => {
          if (!res.writableEnded && !res.destroyed) res.write(`${JSON.stringify(payload)}\n`);
        };

        try {
          const video = await renderRemotionTimelineVideo({
            project: rawProject,
            assetFiles,
            envOverrides,
            onProgress: (event) => writeEvent({ type: "progress", ...event }),
          });
          writeEvent({ type: "result", result: video });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error || "Remotion render thất bại.");
          writeEvent({ type: "error", error: message });
        } finally {
          if (!res.writableEnded) res.end();
        }
        return;
      }

      const video = await renderTimelineVideo({ project: rawProject, assetFiles, envOverrides });
      return res.json(video);
    } catch (error) {
      if (streamingRemotion) {
        if (!res.writableEnded) {
          const message = error instanceof Error ? error.message : String(error || "Remotion render thất bại.");
          res.write(`${JSON.stringify({ type: "error", error: message })}\n`);
          res.end();
        }
        return;
      }
      return sendError(res, error);
    } finally {
      for (const file of files) {
        if (file.path) fs.rm(file.path, { force: true }, () => undefined);
      }
    }
  });

  router.post(
    "/video/generate-from-text",
    upload.single("image"),
    async (req: Request<unknown, unknown, GenerateVideoFromTextBody>, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "Chưa chọn nền video." });
        }

        const envOverrides = readRuntimeEnvFromRequest(req);
        const backgroundType = normalizeVideoBackgroundType(req.body.backgroundType);
        const backgroundError = await validateBackgroundFile(req.file, backgroundType, envOverrides);
        if (backgroundError) {
          return res.status(backgroundError.status).json({ error: backgroundError.error });
        }

        const narration = await generateNarrationAudio(req.body, envOverrides);
        if ("status" in narration) {
          return res.status(narration.status).json(narration.body);
        }

        const backgroundMusic = resolveOptionalBackgroundMusic(req.body, envOverrides);

        const video = await generateVideoFromAudio({
          audioPath: narration.audioPath,
          imagePath: req.file.path,
          options: {
            aspectRatio: normalizeVideoAspectRatio(req.body.aspectRatio),
            backgroundType,
            fitMode: normalizeVideoFitMode(req.body.fitMode),
            videoFileName: req.body.videoFileName || req.body.fileName,
            ...backgroundMusic,
          },
          envOverrides,
        });

        return res.json({
          ok: true,
          audio: narration.audio,
          video,
        });
      } catch (error) {
        return sendError(res, error);
      } finally {
        if (req.file?.path) {
          fs.rm(req.file.path, { force: true }, () => undefined);
        }
      }
    }
  );

  router.post(
    "/video/generate-from-audio",
    mixedUpload,
    async (req: Request<unknown, unknown, GenerateVideoFromAudioBody>, res: Response) => {
      const files = req.files as
        | {
            audio?: Express.Multer.File[];
            image?: Express.Multer.File[];
          }
        | undefined;
      const backgroundFile = files?.image?.[0];
      const audioUploadFile = files?.audio?.[0];
      let uploadedAudioPath: string | undefined;

      try {
        if (!backgroundFile) {
          return res.status(400).json({ error: "Chưa chọn nền video." });
        }

        const envOverrides = readRuntimeEnvFromRequest(req);
        const backgroundType = normalizeVideoBackgroundType(req.body.backgroundType);
        const backgroundError = await validateBackgroundFile(backgroundFile, backgroundType, envOverrides);
        if (backgroundError) {
          return res.status(backgroundError.status).json({ error: backgroundError.error });
        }

        const audioPath = audioUploadFile
          ? await saveUploadedAudio(audioUploadFile, envOverrides)
          : resolveGeneratedResource(
              {
                kind: "audio",
                relativePath: String(req.body.audioRelativePath || ""),
              },
              envOverrides
            );
        uploadedAudioPath = audioUploadFile ? audioPath.absolutePath : undefined;

        if (!fs.existsSync(audioPath.absolutePath)) {
          return res.status(404).json({ error: "Không tìm thấy audio đã tạo." });
        }

        const backgroundMusic = resolveOptionalBackgroundMusic(req.body, envOverrides);

        const video = await generateVideoFromAudio({
          audioPath: audioPath.absolutePath,
          imagePath: backgroundFile.path,
          options: {
            aspectRatio: normalizeVideoAspectRatio(req.body.aspectRatio),
            backgroundType,
            fitMode: normalizeVideoFitMode(req.body.fitMode),
            videoFileName: req.body.videoFileName || path.basename(audioPath.relativePath, path.extname(audioPath.relativePath)),
            ...backgroundMusic,
          },
          envOverrides,
        });

        return res.json({
          ok: true,
          audio: {
            audioUrl: audioPath.relativePath
              ? buildGeneratedFileUrl(
                  GENERATED_PUBLIC_PATH,
                  audioPath.relativePath,
                  readEnvValues(envOverrides).SERVER_ORIGIN || SERVER_ORIGIN
                )
              : undefined,
            relativePath: audioPath.relativePath,
          },
          video,
        });
      } catch (error) {
        return sendError(res, error);
      } finally {
        if (backgroundFile?.path) {
          fs.rm(backgroundFile.path, { force: true }, () => undefined);
        }
        if (audioUploadFile?.path && audioUploadFile.path !== uploadedAudioPath) {
          fs.rm(audioUploadFile.path, { force: true }, () => undefined);
        }
      }
    }
  );

  return router;
}
