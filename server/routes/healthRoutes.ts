import fs from "node:fs";
import { Router } from "express";
import { getGeneratedDir, MODEL_DIR, PIPER_EXE } from "../config/paths";
import { readRuntimeEnvFromRequest, resolveRuntimeExecutable } from "../services/RuntimeEnvService";
import { readEnvValues } from "../services/EnvFileService";

export function createHealthRouter() {
  const router = Router();

  router.get("/health", (req, res) => {
    const env = readEnvValues(readRuntimeEnvFromRequest(req));
    const piperExe = resolveRuntimeExecutable(env.PIPER_EXE || PIPER_EXE);
    const generatedDir = getGeneratedDir(env.SERVER_DATA_DIR);

    res.json({
      ok: true,
      piperExe,
      piperExists: fs.existsSync(piperExe),
      modelDir: env.MODEL_DIR || MODEL_DIR,
      generatedDir,
    });
  });

  return router;
}
