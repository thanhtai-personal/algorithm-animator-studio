import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { mergeStoryReviewScenes } from "../services/StoryReviewVideoService";
import { normalizeVideoAspectRatio, normalizeVideoFitMode } from "../services/VideoService";

const uploadDirectory = path.join(os.tmpdir(), "kata-story-review");
const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 300 * 1024 * 1024 },
});

type SceneMeta = {
  id: string;
  durationSeconds: number;
};

export function createStoryReviewRouter() {
  const router = Router();

  router.post("/story-review/video/merge", upload.any(), async (req: Request, res: Response) => {
    const files = (req.files || []) as Express.Multer.File[];
    try {
      const sceneMeta = parseScenes(req.body.scenes);
      const audioFile = files.find((file) => file.fieldname === "audio");
      const scenes = sceneMeta.map((scene) => {
        const file = files.find((item) => item.fieldname === `scene-${scene.id}`);
        if (!file) throw new Error("Thiếu file cho một phân cảnh.");
        return {
          path: file.path,
          mimeType: file.mimetype,
          durationSeconds: scene.durationSeconds,
        };
      });

      const video = await mergeStoryReviewScenes({
        scenes,
        audioPath: audioFile?.path,
        videoFileName: String(req.body.videoFileName || "review-truyen"),
        aspectRatio: normalizeVideoAspectRatio(req.body.aspectRatio),
        fitMode: normalizeVideoFitMode(req.body.fitMode),
        envOverrides: readRuntimeEnvFromRequest(req),
      });

      return res.json({ ok: true, video });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Không ghép được video review." });
    } finally {
      files.forEach((file) => fs.rm(file.path, { force: true }, () => undefined));
    }
  });

  return router;
}

function parseScenes(value: unknown): SceneMeta[] {
  const parsed = JSON.parse(String(value || "[]")) as SceneMeta[];
  if (!Array.isArray(parsed) || !parsed.length) throw new Error("Chưa có danh sách phân cảnh.");
  return parsed.map((scene) => ({
    id: String(scene.id || ""),
    durationSeconds: Number(scene.durationSeconds) || 6,
  })).filter((scene) => scene.id);
}
