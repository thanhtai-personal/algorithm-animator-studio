import { Router, type Request, type Response } from "express";
import type { ElevenLabsGenerateBody } from "../models/ElevenLabs";
import {
  generateElevenLabsAudio,
  getElevenLabsConfigStatus,
} from "../services/ElevenLabsService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createElevenLabsRouter() {
  const router = Router();

  router.get("/elevenlabs/config", async (req, res) => {
    res.json(await getElevenLabsConfigStatus(readRuntimeEnvFromRequest(req)));
  });

  router.post(
    "/elevenlabs/generate",
    async (req: Request<unknown, unknown, ElevenLabsGenerateBody>, res: Response) => {
      try {
        res.json(await generateElevenLabsAudio(req.body, readRuntimeEnvFromRequest(req)));
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Yêu cầu âm thanh PRO thất bại.",
        });
      }
    }
  );

  return router;
}
