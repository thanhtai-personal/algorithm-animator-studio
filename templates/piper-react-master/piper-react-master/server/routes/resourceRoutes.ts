import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router, type Response } from "express";
import multer from "multer";
import {
  deleteGeneratedResource,
  getResourceOverview,
  openGeneratedResourceFolder,
  saveBackgroundMusicResource,
} from "../services/ResourceService";
import type { GeneratedResourceKind } from "../models/Resource";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

const uploadDirectory = path.join(os.tmpdir(), "piper-react-background-music");
const upload = multer({
  dest: uploadDirectory,
  limits: {
    fileSize: 300 * 1024 * 1024,
  },
});

export function createResourceRouter() {
  const router = Router();

  router.get("/resources", (req, res) => {
    res.json(getResourceOverview(readRuntimeEnvFromRequest(req)));
  });

  router.post("/resources/background-music", upload.single("music"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Chưa chọn tệp nhạc nền." });
      }

      const resource = await saveBackgroundMusicResource(req.file, readRuntimeEnvFromRequest(req));
      return res.json({ ok: true, resource });
    } catch (error) {
      if (req.file?.path) {
        fs.rm(req.file.path, { force: true }, () => undefined);
      }
      return sendError(res, error);
    }
  });

  router.post("/resources/open-folder", (req, res) => {
    try {
      const envOverrides = readRuntimeEnvFromRequest(req);
      res.json(
        openGeneratedResourceFolder({
          kind: normalizeResourceKind(req.body?.kind),
          relativePath: String(req.body?.relativePath || ""),
          envOverrides,
        })
      );
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/resources", (req, res) => {
    try {
      const envOverrides = readRuntimeEnvFromRequest(req);
      res.json(
        deleteGeneratedResource({
          kind: normalizeResourceKind(req.body?.kind),
          relativePath: String(req.body?.relativePath || ""),
          envOverrides,
        })
      );
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

function normalizeResourceKind(value: unknown): GeneratedResourceKind {
  if (value === "video" || value === "music") {
    return value;
  }

  return "audio";
}

function sendError(res: Response, error: unknown) {
  res.status(400).json({
    error: error instanceof Error ? error.message : "Yêu cầu tài nguyên thất bại.",
  });
}
