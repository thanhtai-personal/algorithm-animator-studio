import { Router } from "express";
import { deleteGeneratedResource, deleteGeneratedResourcesByKind, getResourceOverview } from "../services/ResourceService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import type { GeneratedResourceKind } from "../models/Resource";

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
      res.json(deleteGeneratedResourcesByKind(kind, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không xóa được tài nguyên." });
    }
  });

  return router;
}

function normalizeKind(value: string): GeneratedResourceKind {
  if (value === "audio" || value === "video") return value;
  throw new Error("Chỉ hỗ trợ quản lý voice và video.");
}
