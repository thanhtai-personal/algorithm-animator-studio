import { Router, type Request, type Response } from "express";
import type { VieneuGenerateBody } from "../models/Vieneu";
import { generateVieneuAudio, getVieneuConfigStatus } from "../services/VieneuService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createVieneuRouter() {
  const router = Router();

  router.get("/vieneu/config", async (req, res) => {
    res.json(await getVieneuConfigStatus(readRuntimeEnvFromRequest(req)));
  });

  router.post(
    "/vieneu/generate",
    async (req: Request<unknown, unknown, VieneuGenerateBody>, res: Response) => {
      try {
        res.json(await generateVieneuAudio(req.body, readRuntimeEnvFromRequest(req)));
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Yêu cầu VieNeu-TTS thất bại.",
        });
      }
    }
  );

  return router;
}
