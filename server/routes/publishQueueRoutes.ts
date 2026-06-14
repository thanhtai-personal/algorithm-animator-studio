import { Router, type Response } from "express";
import { cancelPublishJob, createPublishJob, getPublishAgentSuggestions, listPublishHistory, listPublishJobs, retryPublishJob } from "../services/PublishQueueService";
import { runDuePublishJobs, runPublishJobNow } from "../services/PublishWorkerService";
import { listSocialProviderAccounts, removeSocialProviderAccount } from "../services/SocialProviderAccountService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createPublishQueueRouter() {
  const router = Router();

  router.get("/publish/jobs", (req, res) => {
    try {
      res.json({ jobs: listPublishJobs(readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/publish/jobs", (req, res) => {
    try {
      res.json({ job: createPublishJob(req.body, readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/publish/jobs/run-due", async (req, res) => {
    try {
      res.json(await runDuePublishJobs(readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/publish/jobs/:id/run", async (req, res) => {
    try {
      res.json({ job: await runPublishJobNow(req.params.id, readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/publish/jobs/:id/retry", (req, res) => {
    try {
      res.json({ job: retryPublishJob(req.params.id, readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/publish/jobs/:id/cancel", (req, res) => {
    try {
      res.json({ job: cancelPublishJob(req.params.id, readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/publish/history", (req, res) => {
    try {
      res.json({ history: listPublishHistory(readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/publish/agent-suggestions", (req, res) => {
    try {
      res.json({ suggestions: getPublishAgentSuggestions(readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/publish/social-accounts", (req, res) => {
    try {
      res.json({ accounts: listSocialProviderAccounts(readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/publish/social-accounts/:id", (req, res) => {
    try {
      res.json(removeSocialProviderAccount(req.params.id, readRuntimeEnvFromRequest(req)));
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

function sendError(res: Response, error: unknown) {
  res.status(500).json({ error: error instanceof Error ? error.message : "Publish queue request failed." });
}
