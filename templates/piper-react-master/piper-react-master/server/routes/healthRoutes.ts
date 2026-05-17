import fs from "node:fs";
import { Router } from "express";
import { CLIENT_ORIGIN, GENERATED_DIR, MODEL_DIR, PIPER_EXE, SERVER_ORIGIN } from "../config/paths";

export function createHealthRouter() {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      ok: true,
      piperExe: process.env.PIPER_EXE || PIPER_EXE,
      piperExists: fs.existsSync(process.env.PIPER_EXE || PIPER_EXE),
      modelDir: MODEL_DIR,
      generatedDir: GENERATED_DIR,
      serverOrigin: SERVER_ORIGIN,
      clientOrigin: CLIENT_ORIGIN,
    });
  });

  return router;
}
