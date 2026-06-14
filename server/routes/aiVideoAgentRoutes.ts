import { Router, type Request, type Response } from "express";
import type { CreateAgentVideoJobBody, CreateAgentVideoPlanBody } from "../models/AiVideoAgent";
import {
  cancelAgentVideoJob,
  createAgentVideoJob,
  createAgentVideoPlan,
  getAgentVideoJob,
  listAgentVideoJobs,
  runAgentVideoJob,
  runDueAgentVideoJobs,
} from "../services/AiVideoAgentService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createAiVideoAgentRouter() {
  const router = Router();

  router.get("/ai-video-agent/jobs", (req, res) => {
    res.json({ jobs: listAgentVideoJobs(readRuntimeEnvFromRequest(req)) });
  });

  router.get("/ai-video-agent/jobs/:id", (req, res) => {
    const job = getAgentVideoJob(req.params.id, readRuntimeEnvFromRequest(req));
    if (!job) return res.status(404).json({ error: "Không tìm thấy agent job." });
    return res.json(job);
  });

  router.post("/ai-video-agent/plan", async (req: Request<unknown, unknown, CreateAgentVideoPlanBody>, res: Response) => {
    try {
      res.json(await createAgentVideoPlan(req.body || {}, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/ai-video-agent/jobs", async (req: Request<unknown, unknown, CreateAgentVideoJobBody>, res: Response) => {
    try {
      res.json(await createAgentVideoJob(req.body || {}, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/ai-video-agent/jobs/run-due", async (req, res) => {
    try {
      res.json(await runDueAgentVideoJobs(readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/ai-video-agent/jobs/:id/run", async (req, res) => {
    try {
      res.json(await runAgentVideoJob(req.params.id, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/ai-video-agent/jobs/:id/cancel", (req, res) => {
    try {
      res.json(cancelAgentVideoJob(req.params.id, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

function sendError(res: Response, error: unknown) {
  res.status(500).json({ error: error instanceof Error ? error.message : "AI Video Agent thất bại." });
}
