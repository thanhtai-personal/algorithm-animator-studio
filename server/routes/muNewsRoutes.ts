import { Router, type Request, type Response } from "express";
import type { MuNewsFetchBody, MuNewsScriptBody } from "../models/MuNews";
import { DEFAULT_MU_NEWS_SOURCES, fetchMuNewsItems, generateMuNewsScript } from "../services/MuNewsService";

export function createMuNewsRouter() {
  const router = Router();

  router.get("/mu-news/sources", (_req, res) => {
    res.json({ sources: DEFAULT_MU_NEWS_SOURCES });
  });

  router.post("/mu-news/fetch", async (req: Request<unknown, unknown, MuNewsFetchBody>, res: Response) => {
    try {
      const result = await fetchMuNewsItems(req.body || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Không tải được tin MU.", detail: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  router.post("/mu-news/script", async (req: Request<unknown, unknown, MuNewsScriptBody>, res: Response) => {
    try {
      const result = await generateMuNewsScript(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Không tạo được kịch bản MU.", detail: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  return router;
}
