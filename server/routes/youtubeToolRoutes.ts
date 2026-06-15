import { Router } from "express";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";
import { downloadYoutubeVideo, getYoutubeToolsHealth, transcribeYoutubeVideo } from "../services/YoutubeToolsService";
import {
  getYoutubeToolsJob,
  listYoutubeToolsJobs,
  startYoutubeDownloadJob,
  startYoutubeTranscriptJob,
} from "../services/YoutubeToolsJobService";

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

  router.get("/youtube-tools/jobs", (_req, res) => {
    res.json({ jobs: listYoutubeToolsJobs() });
  });

  router.get("/youtube-tools/jobs/:id", (req, res) => {
    const job = getYoutubeToolsJob(req.params.id);
    if (!job) return res.status(404).json({ error: "Không tìm thấy YouTube tools job." });
    return res.json(job);
  });

  router.post("/youtube-tools/jobs/download", (req, res) => {
    try {
      res.json(startYoutubeDownloadJob(req.body, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      res.status(400).json({ error: toErrorMessage(error) });
    }
  });

  router.post("/youtube-tools/jobs/transcript", (req, res) => {
    try {
      res.json(startYoutubeTranscriptJob(req.body, readRuntimeEnvFromRequest(req)));
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
