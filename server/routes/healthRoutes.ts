import fs from "node:fs";
import { Router } from "express";
import { getGeneratedDir, MODEL_DIR, PIPER_EXE } from "../config/paths";
import { readRuntimeEnvFromRequest, resolveRuntimeExecutable } from "../services/RuntimeEnvService";
import { readEnvValues } from "../services/EnvFileService";
import { runFfmpeg, runFfprobe } from "../utils/ffmpeg";

export function createHealthRouter() {
  const router = Router();

  router.get("/health", async (req, res) => {
    const overrides = readRuntimeEnvFromRequest(req);
    const env = readEnvValues(overrides);
    const piperExe = resolveRuntimeExecutable(env.PIPER_EXE || PIPER_EXE);
    const generatedDir = getGeneratedDir(env.SERVER_DATA_DIR);
    // Optional media executables never make a healthy TTS backend appear offline.
    const [ffmpeg, ffprobe] = await Promise.all([
      checkMediaTool(() => runFfmpeg(["-version"], overrides)),
      checkMediaTool(() => runFfprobe(["-version"], overrides)),
    ]);

    res.json({
      ok: true,
      piperExe,
      piperExists: fs.existsSync(piperExe),
      modelDir: env.MODEL_DIR || MODEL_DIR,
      generatedDir,
      ffmpeg,
      ffprobe,
    });
  });

  return router;
}

async function checkMediaTool(
  invoke: () => Promise<{ stdout: string; stderr: string }>,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const result = await invoke();
    const detail = (result.stdout || result.stderr).split(/\r?\n/, 1)[0]?.slice(0, 200);
    return { ok: true, detail: detail || "Ready" };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "Not available" };
  }
}
