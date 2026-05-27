import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import type { MuNewsFetchBody, MuNewsScriptBody } from "../models/MuNews";
import { DEFAULT_MU_NEWS_SOURCES, fetchMuNewsItems, generateMuNewsScript } from "../services/MuNewsService";
import { resolveGeneratedResource } from "../services/ResourceService";
import { generateSlideshowVideoFromAudioTimeline, normalizeVideoAspectRatio, normalizeVideoFitMode } from "../services/VideoService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

const uploadDirectory = path.join(os.tmpdir(), "kata-mu-news-video-assets");
const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 300 * 1024 * 1024 },
});
const timelineUpload = upload.fields([
  { name: "backgrounds", maxCount: 40 },
  { name: "audio", maxCount: 20 },
]);

export function createMuNewsRouter() {
  const router = Router();

  router.get("/mu-news/sources", (_req, res) => {
    res.json({ sources: DEFAULT_MU_NEWS_SOURCES });
  });

  router.post("/mu-news/fetch", async (req: Request<unknown, unknown, MuNewsFetchBody>, res: Response) => {
    try {
      const result = await fetchMuNewsItems(req.body || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Không tải được tin MU.", detail: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  router.post("/mu-news/script", async (req: Request<unknown, unknown, MuNewsScriptBody>, res: Response) => {
    try {
      const result = await generateMuNewsScript(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Không tạo được kịch bản MU.", detail: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  router.post("/mu-news/render-video", timelineUpload, async (req: Request, res: Response) => {
    const files = req.files as { backgrounds?: Express.Multer.File[]; audio?: Express.Multer.File[] } | undefined;
    const backgroundFiles = files?.backgrounds || [];
    const uploadedAudioFiles = files?.audio || [];

    try {
      if (!backgroundFiles.length) return res.status(400).json({ error: "Chưa chọn ảnh nền video." });

      const envOverrides = readRuntimeEnvFromRequest(req);
      const audioRelativePaths = parseStringArray(req.body.audioRelativePaths);
      const backgroundDurations = parseNumberArray(req.body.backgroundDurations);
      const generatedAudioPaths = audioRelativePaths.map((relativePath) => resolveGeneratedResource({ kind: "audio", relativePath }, envOverrides).absolutePath);
      const audioPaths = [...generatedAudioPaths, ...uploadedAudioFiles.map((file) => file.path)];

      if (!audioPaths.length) return res.status(400).json({ error: "Chưa chọn file voice để tạo video." });

      for (const file of backgroundFiles) {
        if (!file.mimetype.startsWith("image/")) return res.status(400).json({ error: "Timeline nhiều nền hiện hỗ trợ ảnh. Vui lòng chọn file image." });
      }

      const backgroundMusicRelativePath = String(req.body.backgroundMusicRelativePath || "").trim();
      const backgroundMusicPath = backgroundMusicRelativePath
        ? resolveGeneratedResource({ kind: "music", relativePath: backgroundMusicRelativePath }, envOverrides).absolutePath
        : undefined;

      const video = await generateSlideshowVideoFromAudioTimeline({
        audioPaths,
        backgrounds: backgroundFiles.map((file, index) => ({ path: file.path, durationSeconds: backgroundDurations[index] || 6 })),
        options: {
          aspectRatio: normalizeVideoAspectRatio(req.body.aspectRatio),
          fitMode: normalizeVideoFitMode(req.body.fitMode),
          videoFileName: String(req.body.videoFileName || "mu-news-video"),
          backgroundMusicPath,
          backgroundMusicVolume: normalizeNumber(req.body.backgroundMusicVolume, 0.12, 0, 1),
          backgroundMusicLoop: req.body.backgroundMusicLoop !== "false",
          backgroundMusicFadeIn: normalizeNumber(req.body.backgroundMusicFadeIn, 1.5, 0, 30),
          backgroundMusicFadeOut: normalizeNumber(req.body.backgroundMusicFadeOut, 2, 0, 30),
        },
        envOverrides,
      });

      return res.json({ ok: true, video });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Không render được video MU." });
    } finally {
      [...backgroundFiles, ...uploadedAudioFiles].forEach((file) => {
        if (file.path) fs.rm(file.path, { force: true }, () => undefined);
      });
    }
  });

  return router;
}

function parseStringArray(value: unknown) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function parseNumberArray(value: unknown) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map((item) => normalizeNumber(item, 6, 1, 120)) : [];
  } catch {
    return [];
  }
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
