import { Router, type Request, type Response } from "express";
import type { RvcApplioGenerateBody } from "../models/RvcApplio";
import { generateRvcApplioAudio, getRvcApplioConfigStatus } from "../services/RvcApplioService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createRvcApplioRouter() {
  const router = Router();

  router.get("/rvc-applio/config", async (req, res) => {
    res.json(await getRvcApplioConfigStatus(readRuntimeEnvFromRequest(req)));
  });

  router.post(
    "/rvc-applio/generate",
    async (req: Request<unknown, unknown, RvcApplioGenerateBody>, res: Response) => {
      try {
        res.json(await generateRvcApplioAudio(req.body, readRuntimeEnvFromRequest(req)));
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "RVC/Applio voice conversion thất bại.",
        });
      }
    }
  );

  return router;
}
