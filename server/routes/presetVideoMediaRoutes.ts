import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import type { PresetVideoMediaPrepareBody, PresetVideoSourceClipRequest } from "../models/PresetVideo";
import {
  importPresetVideoSource,
  importPresetVideoSources,
  preparePresetVideoMedia,
} from "../services/PresetVideoMediaService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { sendError } from "./videoRouteHelpers";

const uploadDirectory = path.join(os.tmpdir(), "piper-react-video-backgrounds");
const PRESET_SOURCE_VIDEO_MAX_BYTES = 2 * 1024 * 1024 * 1024;
const presetSourceUpload = multer({
  dest: uploadDirectory,
  limits: { fileSize: PRESET_SOURCE_VIDEO_MAX_BYTES },
});
const SUPPORTED_VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"]);

export function createPresetVideoMediaRouter() {
  const router = Router();

  router.post(
    "/video/preset-media/prepare",
    async (req: Request<unknown, unknown, PresetVideoMediaPrepareBody>, res: Response) => {
      try {
        const result = await preparePresetVideoMedia({
          presetId: String(req.body?.presetId || ""),
          videoSources: req.body?.videoSources || [],
          videoSourceStrategy: req.body?.videoSourceStrategy,
          envOverrides: readRuntimeEnvFromRequest(req),
        });
        return res.json(result);
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  router.post("/video/preset-media/import", presetSourceUpload.single("video"), async (req, res) => {
    if (!req.file?.path) return res.status(400).json({ error: "Chưa chọn video local." });

    try {
      if (!isSupportedVideo(req.file.originalname)) {
        return res.status(400).json({ error: "Chỉ hỗ trợ video MP4, MOV, MKV, WEBM, AVI hoặc M4V." });
      }
      const result = await importPresetVideoSource({
        presetId: String(req.body?.presetId || ""),
        source: {
          id: String(req.body?.sourceId || ""),
          watchUrl: String(req.body?.watchUrl || ""),
          clipStartSeconds: Number(req.body?.clipStartSeconds),
          clipEndSeconds: Number(req.body?.clipEndSeconds),
        },
        inputPath: req.file.path,
        envOverrides: readRuntimeEnvFromRequest(req),
      });
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    } finally {
      fs.rm(req.file.path, { force: true }, () => undefined);
    }
  });

  router.post("/video/preset-media/import-batch", presetSourceUpload.single("video"), async (req, res) => {
    if (!req.file?.path) return res.status(400).json({ error: "Chưa chọn video local." });

    try {
      if (!isSupportedVideo(req.file.originalname)) {
        return res.status(400).json({ error: "Chỉ hỗ trợ video MP4, MOV, MKV, WEBM, AVI hoặc M4V." });
      }
      const parsedSources = parseSources(req.body?.sources);
      const result = await importPresetVideoSources({
        presetId: String(req.body?.presetId || ""),
        sources: parsedSources,
        inputPath: req.file.path,
        envOverrides: readRuntimeEnvFromRequest(req),
      });
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    } finally {
      fs.rm(req.file.path, { force: true }, () => undefined);
    }
  });

  return router;
}

function isSupportedVideo(fileName: string) {
  return SUPPORTED_VIDEO_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function parseSources(value: unknown): PresetVideoSourceClipRequest[] {
  if (typeof value !== "string") return [];
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed as PresetVideoSourceClipRequest[] : [];
}
