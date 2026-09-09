import cors from "cors";
import express from "express";
import fs from "node:fs";
import { createServer } from "node:http";
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
import { createChannelProviderRouter } from "./routes/channelProviderRoutes";
import { createHealthRouter } from "./routes/healthRoutes";
import { createProviderStartupRouter } from "./routes/providerStartupRoutes";
import { createMusicLibraryRouter } from "./routes/musicLibraryRoutes";
import { createMuNewsRouter } from "./routes/muNewsRoutes";
import { createModelRouter } from "./routes/modelRoutes";
import { createPiperRuntimeRouter } from "./routes/piperRuntimeRoutes";
import { createSystemRouter } from "./routes/systemRoutes";
import { createSetupWizardRouter } from "./routes/setupWizardRoutes";
import { createSupertonicRouter } from "./routes/supertonicRoutes";
import { createGptSoVitsRouter } from "./routes/gptSoVitsRoutes";
import { createRvcApplioRouter } from "./routes/rvcApplioRoutes";
import { createVieneuRouter } from "./routes/vieneuRoutes";
import { createStoryReviewRouter } from "./routes/storyReviewRoutes";
import { createVideoRouter } from "./routes/videoRoutes";
import { createWebExtractRouter } from "./routes/webExtractRoutes";
import { createResourceRouter } from "./routes/resourceRoutes";
import { createYoutubeRouter } from "./routes/youtubeRoutes";
import { createYoutubeToolRouter } from "./routes/youtubeToolRoutes";
import { createAiVideoAgentRouter } from "./routes/aiVideoAgentRoutes";
import { createPublishQueueRouter } from "./routes/publishQueueRoutes";
import { createRemoteControlRouter } from "./routes/remoteControlRoutes";
import { startLocalPublishWorker } from "./services/PublishWorkerService";
import { readRuntimeEnvFromRequest } from "./services/RuntimeEnvService";
import { readEnvValues } from "./services/EnvFileService";
import { attachBackgroundJobsWebSocket } from "./services/BackgroundJobsRealtimeService";
import { listYoutubeToolsJobs } from "./services/YoutubeToolsJobService";
import { listAgentVideoJobs } from "./services/AiVideoAgentService";
import { TelegramRemoteControlService } from "./services/TelegramRemoteControlService";

const app = express();
const httpServer = createServer(app);
const telegramRemoteControl = new TelegramRemoteControlService();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

for (const dir of [GENERATED_DIR, GENERATED_PREVIEW_DIR, GENERATED_VIDEO_DIR, GENERATED_BACKGROUND_MUSIC_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

app.use(`/${GENERATED_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedDir));
app.use(`/${GENERATED_PREVIEW_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedPreviewDir));
app.use(`/${GENERATED_VIDEO_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedVideoDir));
app.use(`/${GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedBackgroundMusicDir));
app.use("/api", createHealthRouter(), createModelRouter(), createMusicLibraryRouter(), createMuNewsRouter(), createPiperRuntimeRouter(), createSystemRouter(), createRemoteControlRouter(telegramRemoteControl), createSetupWizardRouter(), createProviderStartupRouter(), createResourceRouter(), createStoryReviewRouter(), createWebExtractRouter(), createGenerateRouter(), createAiVideoAgentRouter(), createChannelProviderRouter(), createElevenLabsRouter(), createSupertonicRouter(), createGptSoVitsRouter(), createRvcApplioRouter(), createVieneuRouter(), createVideoRouter(), createYoutubeRouter(), createYoutubeToolRouter(), createPublishQueueRouter());

startLocalPublishWorker();
attachBackgroundJobsWebSocket(httpServer, () => ({
  atMs: Date.now(),
  youtubeJobs: listYoutubeToolsJobs(),
  agentJobs: listAgentVideoJobs(),
}));

httpServer.listen(PORT, () => {
  console.log(`KAI STUDIO backend running at http://localhost:${PORT}`);
  console.log(`Piper exe: ${PIPER_EXE}`);
  console.log(`Model dir: ${MODEL_DIR}`);
  console.log(`Generated dir: ${GENERATED_DIR}`);
  void telegramRemoteControl.start().catch((error) => {
    console.warn("[remote-control] Telegram bot did not start:", error instanceof Error ? error.message : error);
  });
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
