import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_DIR,
  GENERATED_PREVIEW_DIR,
  GENERATED_VIDEO_DIR,
  GENERATED_BACKGROUND_MUSIC_DIR,
  GENERATED_PUBLIC_PATH,
  GENERATED_PREVIEW_PUBLIC_PATH,
  GENERATED_VIDEO_PUBLIC_PATH,
  GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH,
  MODEL_DIR,
  PIPER_EXE,
  PORT,
  getGeneratedDir,
  getGeneratedPreviewDir,
  getGeneratedVideoDir,
  getGeneratedBackgroundMusicDir,
} from "./config/paths";
import { createElevenLabsRouter } from "./routes/elevenLabsRoutes";
import { createGenerateRouter } from "./routes/generateRoutes";
import { createHealthRouter } from "./routes/healthRoutes";
import { createMusicLibraryRouter } from "./routes/musicLibraryRoutes";
import { createMuNewsRouter } from "./routes/muNewsRoutes";
import { createModelRouter } from "./routes/modelRoutes";
import { createPiperRuntimeRouter } from "./routes/piperRuntimeRoutes";
import { createSystemRouter } from "./routes/systemRoutes";
import { createSupertonicRouter } from "./routes/supertonicRoutes";
import { createStoryReviewRouter } from "./routes/storyReviewRoutes";
import { createVideoRouter } from "./routes/videoRoutes";
import { createWebExtractRouter } from "./routes/webExtractRoutes";
import { createResourceRouter } from "./routes/resourceRoutes";
import { createYoutubeRouter } from "./routes/youtubeRoutes";
import { readRuntimeEnvFromRequest } from "./services/RuntimeEnvService";
import { readEnvValues } from "./services/EnvFileService";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

for (const dir of [GENERATED_DIR, GENERATED_PREVIEW_DIR, GENERATED_VIDEO_DIR, GENERATED_BACKGROUND_MUSIC_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

app.use(`/${GENERATED_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedDir));
app.use(`/${GENERATED_PREVIEW_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedPreviewDir));
app.use(`/${GENERATED_VIDEO_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedVideoDir));
app.use(`/${GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedBackgroundMusicDir));
app.use("/api", createHealthRouter(), createModelRouter(), createMusicLibraryRouter(), createMuNewsRouter(), createPiperRuntimeRouter(), createSystemRouter(), createResourceRouter(), createStoryReviewRouter(), createWebExtractRouter(), createGenerateRouter(), createElevenLabsRouter(), createSupertonicRouter(), createVideoRouter(), createYoutubeRouter());

app.listen(PORT, () => {
  console.log(`Algo voice backend running at http://localhost:${PORT}`);
  console.log(`Piper exe: ${PIPER_EXE}`);
  console.log(`Model dir: ${MODEL_DIR}`);
  console.log(`Generated dir: ${GENERATED_DIR}`);
});

function createDynamicStaticMiddleware(resolveDirectory: (serverDataDir?: string) => string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const env = readEnvValues(readRuntimeEnvFromRequest(req));
    const rootPath = path.resolve(resolveDirectory(env.SERVER_DATA_DIR));
    const requestedRelativePath = decodeURIComponent(req.path.replace(/^\/+/, ""));
    const absolutePath = path.resolve(rootPath, requestedRelativePath);

    if (!absolutePath.startsWith(`${rootPath}${path.sep}`)) {
      return res.status(400).json({ error: "Đường dẫn tệp không hợp lệ." });
    }

    if (!fs.existsSync(absolutePath)) return next();
    return res.sendFile(absolutePath);
  };
}
