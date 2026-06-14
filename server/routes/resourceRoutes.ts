import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { deleteGeneratedResource, deleteGeneratedResourcesByKind, getResourceOverview, saveUploadedGeneratedVideo } from "../services/ResourceService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import type { GeneratedResourceKind } from "../models/Resource";

const uploadDirectory = path.join(os.tmpdir(), "kata-generated-video-uploads");
const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

export function createResourceRouter() {
  const router = Router();

  router.get("/resources", (req, res) => {
    try {
      res.json(getResourceOverview(readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không đọc được tài nguyên." });
    }
  });

  router.delete("/resources/:kind", (req, res) => {
    try {
      const kind = normalizeKind(req.params.kind);
      const relativePath = String(req.body?.relativePath || "");
      res.json(deleteGeneratedResource({ kind, relativePath }, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không xóa được tài nguyên." });
    }
  });

  router.delete("/resources/:kind/all", (req, res) => {
    try {
      const kind = normalizeKind(req.params.kind);
      const excludeRelativePaths = Array.isArray(req.body?.excludeRelativePaths) ? req.body.excludeRelativePaths.map(String) : [];
      res.json(deleteGeneratedResourcesByKind(kind, readRuntimeEnvFromRequest(req), excludeRelativePaths));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không xóa được tài nguyên." });
    }
  });

  router.post("/resources/video", upload.single("video"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Chưa chọn video." });
      }
      res.json(saveUploadedGeneratedVideo(req.file, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không lưu được video." });
    } finally {
      if (req.file?.path) fs.rm(req.file.path, { force: true }, () => undefined);
    }
  });

  return router;
}

function normalizeKind(value: string): GeneratedResourceKind {
  if (value === "audio" || value === "video") return value;
  throw new Error("Chỉ hỗ trợ quản lý voice và video.");
}
