import { Router, type Request, type Response } from "express";
import type { ExtractLinksBody, ExtractTextBody } from "../models/WebExtract";
import {
  extractLinksFromPage,
  extractTextFromUrls,
  validateExtractLinksRequest,
  validateExtractTextRequest,
} from "../services/WebExtractService";

export function createWebExtractRouter() {
  const router = Router();

  router.post("/extract-text", async (req: Request<unknown, unknown, ExtractTextBody>, res: Response) => {
    try {
      const extractRequest = validateExtractTextRequest(req.body);
      if ("status" in extractRequest) return res.status(extractRequest.status).json(extractRequest.body);
      return res.json(await extractTextFromUrls(extractRequest));
    } catch (error) {
      return res.status(500).json({ error: "Trích xuất nội dung thất bại.", detail: error instanceof Error ? error.message : "Unknown server error" });
    }
  });

  router.post("/extract-links", async (req: Request<unknown, unknown, ExtractLinksBody>, res: Response) => {
    try {
      const extractRequest = validateExtractLinksRequest(req.body);
      if ("status" in extractRequest) return res.status(extractRequest.status).json(extractRequest.body);
      return res.json(await extractLinksFromPage(extractRequest));
    } catch (error) {
      return res.status(500).json({ error: "Trích xuất danh sách link thất bại.", detail: error instanceof Error ? error.message : "Unknown server error" });
    }
  });

  return router;
}
