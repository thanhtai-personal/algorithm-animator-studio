import { Router, type Request, type Response } from "express";
import type { EditAiShortsBody, GenerateAiShortsBody } from "../models/AiShorts";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { editAiShort, generateAiSortShort, readAiShortsConfig } from "../services/AiShortsService";

export function createAiShortsRouter() {
  const router = Router();

  router.get("/shorts/config", (req: Request, res: Response) => {
    return res.json(readAiShortsConfig(readRuntimeEnvFromRequest(req)));
  });

  router.post("/shorts/generate", async (req: Request<unknown, unknown, GenerateAiShortsBody>, res: Response) => {
    try {
      const result = await generateAiSortShort({ body: req.body, envOverrides: readRuntimeEnvFromRequest(req) });
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error: "Tạo AI Shorts thất bại.",
        detail: error instanceof Error ? error.message : "Unknown server error",
      });
    }
  });

  router.post("/shorts/edit", async (req: Request<unknown, unknown, EditAiShortsBody>, res: Response) => {
    try {
      const result = await editAiShort({ body: req.body, envOverrides: readRuntimeEnvFromRequest(req) });
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error: "Chỉnh video AI Shorts thất bại.",
        detail: error instanceof Error ? error.message : "Unknown server error",
      });
    }
  });

  return router;
}
