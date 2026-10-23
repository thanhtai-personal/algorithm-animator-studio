import { Router } from "express";
import { MODEL_DIR } from "../config/paths";
import { getPiperModels } from "../config/piperModels";
import { readEnvValues } from "../services/EnvFileService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { toModelResponse } from "../utils/modelFiles";

export function createModelRouter() {
  const router = Router();

  router.get("/models", (req, res) => {
    const env = readEnvValues(readRuntimeEnvFromRequest(req));
    const modelDir = env.MODEL_DIR || MODEL_DIR;
    res.json({ models: Object.values(getPiperModels(modelDir)).map(toModelResponse) });
  });

  return router;
}
