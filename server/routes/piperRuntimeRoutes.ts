import { Router } from "express";
import { getPiperRuntimeStatus, installPiperModel } from "../services/PiperModelInstallService";

export function createPiperRuntimeRouter() {
  const router = Router();

  router.get("/piper-runtime/status", async (_req, res) => {
    try {
      res.json(await getPiperRuntimeStatus());
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không kiểm tra được Piper runtime." });
    }
  });

  router.post("/piper-runtime/install-model", async (req, res) => {
    try {
      const modelKey = String(req.body?.modelKey || "");
      res.json(await installPiperModel(modelKey));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không cài được model Piper." });
    }
  });

  return router;
}
