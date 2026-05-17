import { Router } from "express";
import { MODELS } from "../config/piperModels";
import { toModelResponse } from "../utils/modelFiles";

export function createModelRouter() {
  const router = Router();

  router.get("/models", (_req, res) => {
    res.json({
      models: Object.values(MODELS).map(toModelResponse),
    });
  });

  return router;
}
