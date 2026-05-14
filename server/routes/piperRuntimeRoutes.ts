import { Router } from "express";
import { getPiperRuntimeStatus, installPiperModel } from "../services/PiperModelInstallService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createPiperRuntimeRouter() {
  const router = Router();

  router.get("/piper-runtime/status", async (req, res) => {
    try {
      res.json(await getPiperRuntimeStatus(readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không kiểm tra được Piper runtime." });
    }
  });

  router.post("/piper-runtime/install-model", async (req, res) => {
    try {
      const modelKey = String(req.body?.modelKey || "");
      res.json(await installPiperModel(modelKey, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không cài được model Piper." });
    }
  });

  return router;
}
