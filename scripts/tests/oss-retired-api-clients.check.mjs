import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const retiredClients = [
  "src/lib/aiVideoAgentApi.ts",
  "src/lib/backgroundJobsRealtime.ts",
  "src/lib/channelProviderApi.ts",
  "src/lib/publishQueueApi.ts",
  "src/lib/socialPublishing.ts",
  "src/lib/youtubeApi.ts",
  "src/lib/youtubeToolsApi.ts"
];

test("retired AI publishing and YouTube API clients are not bundled into OSS", () => {
  for (const file of retiredClients) {
    assert.equal(fs.existsSync(path.join(root, file)), false, `retired API client remains: ${file}`);
  }
});

test("algorithm metadata and unified TTS client remain supported", () => {
  for (const file of [
    "src/lib/algorithms/index.ts", "src/lib/youtubeMetadata.ts", "src/lib/voiceApi.ts",
    "src/lib/runtimeApi.ts", "src/lib/runtimeSettings.ts", "src/lib/generatedAssetsApi.ts"
  ]) assert.ok(fs.existsSync(path.join(root, file)), `core lib missing: ${file}`);
});
