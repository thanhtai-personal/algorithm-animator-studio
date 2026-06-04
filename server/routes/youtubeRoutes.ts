import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import type { YoutubeUploadBody, YoutubeUploadGeneratedBody } from "../models/YoutubeUpload";
import {
  createYoutubeAuthUrl,
  exchangeYoutubeCode,
  getYoutubeChannelProfile,
  getYoutubeConfigStatus,
  listYoutubeChannelVideos,
  listYoutubePlaylists,
  uploadYoutubeVideo,
} from "../services/YoutubeUploadService";
import { listYoutubeUploadHistory, recordYoutubeUploadHistory } from "../services/YoutubeUploadHistoryService";
import { resolveGeneratedVideoPath } from "../utils/videoOutput";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

const uploadDirectory = path.join(os.tmpdir(), "piper-react-youtube-uploads");
const upload = multer({ dest: uploadDirectory });

export function createYoutubeRouter() {
  const router = Router();

  router.get("/youtube/config", (req, res) => {
    res.json(getYoutubeConfigStatus(readRuntimeEnvFromRequest(req)));
  });

  router.get("/youtube/auth-url", (_req, res) => {
    try {
      const redirectUri = String(_req.query.redirectUri || "");
      res.json({ authUrl: createYoutubeAuthUrl(redirectUri, readRuntimeEnvFromRequest(_req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/youtube/exchange-code", async (req, res) => {
    try {
      const code = String(req.body?.code || "").trim();
      const redirectUri = String(req.body?.redirectUri || "").trim();

      if (!code) {
        return res.status(400).json({ error: "Thiếu mã cấp quyền." });
      }

      res.json(await exchangeYoutubeCode(code, redirectUri, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });


  router.post("/youtube/channel", async (req, res) => {
    try {
      res.json(await getYoutubeChannelProfile(String(req.body?.refreshToken || ""), readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/youtube/history", (req, res) => {
    res.json({ history: listYoutubeUploadHistory(readRuntimeEnvFromRequest(req)) });
  });

  router.post("/youtube/playlists", async (req, res) => {
    try {
      res.json(await listYoutubePlaylists(String(req.body?.refreshToken || ""), readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/youtube/videos", async (req, res) => {
    try {
      res.json(await listYoutubeChannelVideos(
        String(req.body?.refreshToken || ""),
        String(req.body?.uploadsPlaylistId || ""),
        readRuntimeEnvFromRequest(req)
      ));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post(
    "/youtube/upload",
    upload.single("video"),
    async (req: Request<unknown, unknown, YoutubeUploadBody>, res) => {
      try {
        const envOverrides = readRuntimeEnvFromRequest(req);

        if (!req.file) {
          return res.status(400).json({ error: "Chưa chọn tệp video." });
        }

        const result = await uploadYoutubeVideo({
          filePath: req.file.path,
          originalFileName: req.file.originalname,
          body: req.body,
          envOverrides,
        });
        recordYoutubeUploadHistory({
          status: result.ok ? "success" : "failure",
          source: "browser-upload",
          sourceFileName: req.file.originalname,
          youtubeVideoId: result.id || undefined,
          youtubeUrl: result.url || undefined,
          title: result.title || req.body.title,
          privacyStatus: result.privacyStatus || req.body.privacyStatus,
          playlistId: result.playlistId,
          channelId: req.body.channelId,
          channelTitle: req.body.channelTitle,
          message: result.playlistWarning,
        }, envOverrides);

        res.json(result);
      } catch (error) {
        recordYoutubeUploadHistory({
          status: "failure",
          source: "browser-upload",
          sourceFileName: req.file?.originalname,
          title: req.body?.title,
          privacyStatus: req.body?.privacyStatus,
          playlistId: req.body?.playlistId,
          channelId: req.body?.channelId,
          channelTitle: req.body?.channelTitle,
          message: error instanceof Error ? error.message : "Yêu cầu YouTube thất bại.",
        }, readRuntimeEnvFromRequest(req));
        sendError(res, error);
      } finally {
        if (req.file?.path) {
          fs.rm(req.file.path, { force: true }, () => undefined);
        }
      }
    }
  );

  router.post(
    "/youtube/upload-generated",
    async (req: Request<unknown, unknown, YoutubeUploadGeneratedBody>, res) => {
      try {
        const envOverrides = readRuntimeEnvFromRequest(req);
        const videoRelativePath = String(req.body.videoRelativePath || "");
        const videoPath = resolveGeneratedVideoPath(videoRelativePath);

        if (!fs.existsSync(videoPath.absolutePath)) {
          return res.status(404).json({ error: "Không tìm thấy video đã tạo." });
        }

        const result = await uploadYoutubeVideo({
          filePath: videoPath.absolutePath,
          originalFileName: path.basename(videoPath.relativePath),
          body: req.body,
          envOverrides,
        });
        recordYoutubeUploadHistory({
          status: result.ok ? "success" : "failure",
          source: "generated-video",
          sourceRelativePath: videoPath.relativePath,
          sourceFileName: path.basename(videoPath.relativePath),
          youtubeVideoId: result.id || undefined,
          youtubeUrl: result.url || undefined,
          title: result.title || req.body.title,
          privacyStatus: result.privacyStatus || req.body.privacyStatus,
          playlistId: result.playlistId,
          channelId: req.body.channelId,
          channelTitle: req.body.channelTitle,
          message: result.playlistWarning,
        }, envOverrides);

        res.json(result);
      } catch (error) {
        recordYoutubeUploadHistory({
          status: "failure",
          source: "generated-video",
          sourceRelativePath: req.body?.videoRelativePath,
          sourceFileName: req.body?.videoRelativePath
            ? path.basename(req.body.videoRelativePath)
            : undefined,
          title: req.body?.title,
          privacyStatus: req.body?.privacyStatus,
          playlistId: req.body?.playlistId,
          channelId: req.body?.channelId,
          channelTitle: req.body?.channelTitle,
          message: error instanceof Error ? error.message : "Yêu cầu YouTube thất bại.",
        }, readRuntimeEnvFromRequest(req));
        sendError(res, error);
      }
    }
  );

  return router;
}

function sendError(res: Response, error: unknown): void {
  res.status(500).json({
    error: error instanceof Error ? error.message : "Yêu cầu YouTube thất bại.",
  });
}
