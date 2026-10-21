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
