import { Router } from "express";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { downloadYoutubeVideo, getYoutubeToolsHealth, transcribeYoutubeVideo } from "../services/YoutubeToolsService";

export function createYoutubeToolRouter() {
  const router = Router();

  router.get("/youtube-tools/health", async (req, res) => {
    try {
      res.json(await getYoutubeToolsHealth(readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(500).json({ error: toErrorMessage(error) });
    }
  });

  router.post("/youtube-tools/download", async (req, res) => {
    try {
      res.json(await downloadYoutubeVideo(req.body, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(400).json({ error: toErrorMessage(error) });
    }
  });

  router.post("/youtube-tools/transcript", async (req, res) => {
    try {
      res.json(await transcribeYoutubeVideo(req.body, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(400).json({ error: toErrorMessage(error) });
    }
  });

  return router;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không xử lý được YouTube tools.";
}
