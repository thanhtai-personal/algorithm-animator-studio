import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { trackedFilesUnder } from "./helpers/oss-tracked-source.mjs";
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
  assert.deepEqual(trackedFilesUnder(root, "libs/VieNeu-TTS"), [],
    "VieNeu SDK/preset files must not be tracked by Git; local ignored copies are allowed");
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

test("README documents independent TTS engine setup and current VieNeu v3 mode", () => {
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  const vieneuService = fs.readFileSync(path.join(root, "server/services/VieneuService.ts"), "utf8");
  const vieneuHealth = fs.readFileSync(path.join(root, "scripts/vieneu-health.py"), "utf8");
  for (const token of [
    "piper-tts",
    "supertonic[serve]",
    "npm run supertonic:serve",
    "npm run vieneu:install",
    "VIENEU_MODE=v3turbo",
    "python api_v2.py -a 127.0.0.1 -p 9880",
    "run-applio.bat",
    "docs/oss/third-party-audit.md",
  ]) assert.ok(readme.includes(token), `README TTS setup is missing: ${token}`);
  assert.match(envExample, /VIENEU_MODE=v3turbo/);
  assert.match(vieneuService, /normalizeMode\(env\.VIENEU_MODE \|\| "v3turbo"\)/);
  assert.match(vieneuService, /"v3turbo", "v3nano"/);
  assert.match(vieneuHealth, /"v3turbo": \[/);
  assert.match(vieneuHealth, /"v3nano": \[/);
});
