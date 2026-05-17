import { Router } from "express";
import { getResourceOverview } from "../services/ResourceService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createResourceRouter() {
  const router = Router();

  router.get("/resources", (req, res) => {
    try {
      res.json(getResourceOverview(readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không đọc được tài nguyên." });
    }
  });

  return router;
}
