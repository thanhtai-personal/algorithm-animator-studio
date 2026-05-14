import { Router, type Request, type Response } from "express";
import type { GenerateBody } from "../models/PiperModel";
import {
  generateAudioFile,
  generateAudioPreviewFile,
  validateGenerateRequest,
  validatePreviewRequest,
} from "../services/TtsGenerationService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createGenerateRouter() {
  const router = Router();

  router.post("/generate", async (req: Request<unknown, unknown, GenerateBody>, res: Response) => {
    try {
      const envOverrides = readRuntimeEnvFromRequest(req);
      const generateRequest = validateGenerateRequest(req.body, envOverrides);
      if ("status" in generateRequest) {
        return res.status(generateRequest.status).json(generateRequest.body);
      }

      const result = await generateAudioFile(generateRequest, envOverrides);
      return res.json(result);
    } catch (error) {
      return sendGenerateError(res, error);
    }
  });

  router.post("/preview-audio", async (req: Request<unknown, unknown, GenerateBody>, res: Response) => {
    try {
      const envOverrides = readRuntimeEnvFromRequest(req);
      const previewRequest = validatePreviewRequest(req.body, envOverrides);
      if ("status" in previewRequest) {
        return res.status(previewRequest.status).json(previewRequest.body);
      }

      const result = await generateAudioPreviewFile(previewRequest, envOverrides);
      return res.json(result);
    } catch (error) {
      return sendGenerateError(res, error);
    }
  });

  return router;
}

function sendGenerateError(res: Response, error: unknown) {
  return res.status(500).json({
    error: "Server error.",
    detail: error instanceof Error ? error.message : "Unknown server error",
  });
}
