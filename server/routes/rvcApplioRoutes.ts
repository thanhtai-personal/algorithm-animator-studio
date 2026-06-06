import { Router, type Request, type Response } from "express";
import type { RvcApplioConvertBody, RvcApplioTextToSpeechBody } from "../models/RvcApplio";
import { convertRvcApplioAudio, generateRvcApplioSpeech, getRvcApplioConfigStatus } from "../services/RvcApplioService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createRvcApplioRouter() {
  const router = Router();

  router.get("/rvc-applio/config", async (req, res) => {
    res.json(await getRvcApplioConfigStatus(readRuntimeEnvFromRequest(req)));
  });

  router.post(
    "/rvc-applio/convert",
    async (req: Request<unknown, unknown, RvcApplioConvertBody>, res: Response) => {
      try {
        res.json(await convertRvcApplioAudio(req.body, readRuntimeEnvFromRequest(req)));
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "RVC/Applio voice conversion thất bại.",
        });
      }
    }
  );

  router.post(
    "/rvc-applio/tts",
    async (req: Request<unknown, unknown, RvcApplioTextToSpeechBody>, res: Response) => {
      try {
        res.json(await generateRvcApplioSpeech(req.body, readRuntimeEnvFromRequest(req)));
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "RVC/Applio text-to-speech thất bại.",
        });
      }
    }
  );

  return router;
}
