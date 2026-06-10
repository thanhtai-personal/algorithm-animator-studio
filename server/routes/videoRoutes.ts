import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router, type Request, type Response } from "express";
import type { GenerateVideoFromAudioBody, GenerateVideoFromTextBody } from "../models/Video";
import type { RemotionVideoRenderBody } from "../models/RemotionVideo";
import multer from "multer";
import { GENERATED_PUBLIC_PATH, SERVER_ORIGIN, buildGeneratedFileUrl } from "../config/paths";
import {
  generateVideoFromAudio,
  normalizeVideoAspectRatio,
  normalizeVideoBackgroundType,
  normalizeVideoFitMode,
} from "../services/VideoService";
import { listGeneratedVideos } from "../utils/videoOutput";
import { readEnvValues } from "../services/EnvFileService";
import { resolveGeneratedResource } from "../services/ResourceService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { getRemotionHealth, renderRemotionVideo } from "../services/RemotionRenderService";
import { BACKGROUND_LIMITS, generateNarrationAudio, resolveOptionalBackgroundMusic, saveUploadedAudio, sendError, validateBackgroundFile } from "./videoRouteHelpers";

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
