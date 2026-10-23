import { Router, type Request, type Response } from "express";
import type { GptSoVitsGenerateBody } from "../models/GptSoVits";
import { generateGptSoVitsAudio, getGptSoVitsConfigStatus } from "../services/GptSoVitsService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createGptSoVitsRouter() {
  const router = Router();

  router.get("/gpt-sovits/config", async (req, res) => {
    res.json(await getGptSoVitsConfigStatus(readRuntimeEnvFromRequest(req)));
  });

  router.post(
    "/gpt-sovits/generate",
    async (req: Request<unknown, unknown, GptSoVitsGenerateBody>, res: Response) => {
      try {
        res.json(await generateGptSoVitsAudio(req.body, readRuntimeEnvFromRequest(req)));
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Yêu cầu GPT-SoVITS thất bại.",
        });
      }
    },
  );

  return router;
}
