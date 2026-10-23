import { Router } from "express";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { getSetupWizardStatus, runSetupAutostart, runSetupWizardTask, type SetupTaskId } from "../services/SetupWizardService";

const SETUP_TASKS = new Set<SetupTaskId>([
  "generated-data",
  "piper-runtime",
  "piper-models",
  "supertonic",
  "applio-client",
  "applio-start",
  "vieneu",
  "gpt-sovits-start",
]);

export function createSetupWizardRouter() {
  const router = Router();

  router.get("/setup/status", async (req, res) => {
    try {
      res.json(await getSetupWizardStatus(readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không kiểm tra được setup status." });
    }
  });

  router.post("/setup/autostart", async (req, res) => {
    try {
      res.json(await runSetupAutostart(readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không tự khởi động được service local." });
    }
  });

  router.post("/setup/tasks/:taskId/run", async (req, res) => {
    try {
      const taskId = String(req.params.taskId || "") as SetupTaskId;
      if (!SETUP_TASKS.has(taskId)) throw new Error("Setup task không hợp lệ.");
      res.json(await runSetupWizardTask(taskId, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không chạy được setup task." });
    }
  });

  return router;
}
