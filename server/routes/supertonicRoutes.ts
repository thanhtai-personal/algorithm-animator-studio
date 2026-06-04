import { Router, type Request, type Response } from "express";
import type { SupertonicGenerateBody } from "../models/Supertonic";
import { generateSupertonicAudio, getSupertonicConfigStatus } from "../services/SupertonicService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createSupertonicRouter() {
  const router = Router();

  router.get("/supertonic/config", async (req, res) => {
    res.json(await getSupertonicConfigStatus(readRuntimeEnvFromRequest(req)));
  });

  router.post(
    "/supertonic/generate",
    async (req: Request<unknown, unknown, SupertonicGenerateBody>, res: Response) => {
      try {
        res.json(await generateSupertonicAudio(req.body, readRuntimeEnvFromRequest(req)));
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Yêu cầu Supertonic thất bại.",
        });
      }
    }
  );

  return router;
}
