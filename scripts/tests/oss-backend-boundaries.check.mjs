import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const server = fs.readFileSync(path.join(root, "server/index.ts"), "utf8");

test("OSS backend does not initialize obsolete social, story, news or publishing routes/workers", () => {
  for(const token of [
    "createChannelProviderRouter", "createMuNewsRouter", "createStoryReviewRouter",
    "createWebExtractRouter", "createYoutubeRouter", "createAiVideoAgentRouter",
    "createPublishQueueRouter", "startLocalPublishWorker",
    "attachBackgroundJobsWebSocket", "listYoutubeToolsJobs", "listAgentVideoJobs",
  ]) assert.ok(!server.includes(token), `obsolete backend startup dependency: ${token}`);
});

test("OSS backend keeps algorithm render, media and every TTS provider API", () => {
  for(const route of [
    "createGenerateRouter", "createPiperRuntimeRouter", "createSupertonicRouter",
    "createVieneuRouter", "createGptSoVitsRouter", "createElevenLabsRouter",
    "createRvcApplioRouter", "createModelRouter", "createProviderStartupRouter",
    "createResourceRouter", "createVideoRouter",
    "createHealthRouter", "createSystemRouter", "createSetupWizardRouter",
  ]) assert.ok(server.includes(`${route}()`), `core endpoint missing: ${route}`);
});

test("VieNeu is optional and its third-party source/voice assets are not vendored", () => {
  assert.equal(fs.existsSync(path.join(root, "libs", "VieNeu-TTS")), false,
    "install VieNeu in a separate checkout; do not bundle upstream preset/sample assets");
  const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  assert.match(envExample, /VIENEU_SOURCE_DIR=\.\.\/VieNeu-TTS/);
  assert.match(envExample, /KAI_PROVIDER_VIENEU_ENABLED=false/);
});

test("retired non-core backend route/service/model files are absent", () => {
  const removed = {
    "server/routes/": [
      "aiVideoAgentRoutes", "channelProviderRoutes", "muNewsRoutes", "publishQueueRoutes",
      "storyReviewRoutes", "webExtractRoutes", "youtubeRoutes",
    ],
    "server/services/": [
      "AiVideoAgentBackgroundService", "AiVideoAgentFallbackTiming", "AiVideoAgentRemotionRender",
      "AiVideoAgentService", "JobManagementService", "MuNewsService", "MuNewsValidationService",
      "PublishQueueService", "PublishWorkerService", "SocialProviderAccountService",
      "StoryReviewVideoService", "WebExtractService", "YoutubeUploadService", "YoutubeUploadHistoryService",
    ],
    "server/models/": ["AiVideoAgent", "MuNews", "PublishQueue", "WebExtract", "YoutubeUpload"],
    "server/config/": ["muNewsSources"],
  };
  for (const [prefix, names] of Object.entries(removed)) {
    for (const name of names) {
      const target = path.join(root, prefix, `${name}.ts`);
      assert.equal(fs.existsSync(target), false, `retired backend source still tracked: ${target}`);
    }
  }
});
