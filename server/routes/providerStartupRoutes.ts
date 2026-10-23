import { Router, type Request, type Response } from "express";
import { getProviderStartupSettings, updateProviderStartupSetting, type StartupProviderId } from "../services/ProviderStartupService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

const STARTUP_PROVIDER_IDS = new Set<StartupProviderId>(["supertonic", "applio", "vieneu", "gpt-sovits"]);

export function createProviderStartupRouter() {
  const router = Router();

  router.get("/providers/startup", (req, res) => {
    res.json(getProviderStartupSettings(readRuntimeEnvFromRequest(req)));
  });

  router.patch(
    "/providers/startup/:providerId",
    (req: Request<{ providerId: string }, unknown, { enabled?: boolean }>, res: Response) => {
      try {
        const providerId = req.params.providerId as StartupProviderId;
        if (!STARTUP_PROVIDER_IDS.has(providerId)) throw new Error("Provider không hợp lệ.");
        if (typeof req.body?.enabled !== "boolean") throw new Error("Thiếu trạng thái enabled.");
        res.json(updateProviderStartupSetting(providerId, req.body.enabled));
      } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Không lưu được provider." });
      }
    },
  );

  return router;
}
