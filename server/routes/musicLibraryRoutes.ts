import { Router } from "express";
import { listMusicLibraryTracks, resolveMusicLibraryAudioPath } from "../services/MusicLibraryService";
import { readRuntimeEnvFromEncodedSettings, readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

export function createMusicLibraryRouter() {
  const router = Router();

  router.get("/music-library", (req, res) => {
    try {
      res.json({ tracks: listMusicLibraryTracks(readRuntimeEnvFromRequest(req)) });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Không đọc được thư viện nhạc." });
    }
  });

  router.get("/music-library/:trackId/audio", (req, res) => {
    try {
      const settings = String(req.query.settings || "");
      const env = settings ? readRuntimeEnvFromEncodedSettings(settings) : readRuntimeEnvFromRequest(req);
      res.sendFile(resolveMusicLibraryAudioPath(req.params.trackId, env));
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : "Không tìm thấy file nhạc." });
    }
  });

  return router;
}
