import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("settings health no longer depends on optional YouTube tools", () => {
  const settings = read("src/pages/Settings.tsx");
  const health = read("src/pages/settings/SettingsHealthTab.tsx");
  const data = read("src/pages/settings/SettingsDataTab.tsx");
  for (const content of [settings, health, data]) {
    assert.doesNotMatch(content, /youtubeTools|YoutubeTools|\/api\/youtube-tools|YOUTUBE_COOKIES|YOUTUBE_DLP_EXE/, "removed YouTube provider still referenced");
  }
  for (const preserved of ["/api/health", "/api/models", "/api/elevenlabs/config", "/api/supertonic/config", "/api/rvc-applio/config", "/api/vieneu/config", "/api/rvc-applio/templates"]) {
    assert.ok(settings.includes(preserved), `TTS setup request missing: ${preserved}`);
  }
  assert.match(health, /FFmpeg/);
  assert.match(health, /FFprobe/);
});

test("system health independently reports FFmpeg without requiring YouTube", () => {
  const route = read("server/routes/healthRoutes.ts");
  const types = read("src/pages/settings/SettingsTypes.ts");
  assert.match(route, /runFfmpeg/);
  assert.match(route, /runFfprobe/);
  assert.match(types, /ffmpeg\?/);
  assert.match(types, /ffprobe\?/);
  assert.doesNotMatch(types, /YoutubeToolsHealthResponse/);
});

test("YouTube download and transcription backend is removed while TTS remains", () => {
  const server = read("server/index.ts");
  assert.doesNotMatch(server, /createYoutubeToolRouter/);
  for (const name of [
    "server/routes/youtubeToolRoutes.ts",
    "server/services/YoutubeToolsService.ts",
    "server/services/YoutubeToolsJobService.ts",
    "server/services/YoutubeToolsRuntimeOptions.ts",
    "server/models/YoutubeTools.ts",
    "server/utils/youtubeUrl.ts",
    "server/utils/youtubeDownloadSection.ts",
  ]) assert.equal(fs.existsSync(path.join(root, name)), false, `obsolete YouTube tool remains: ${name}`);
  for (const provider of [
    "createGenerateRouter", "createPiperRuntimeRouter",
    "createSupertonicRouter", "createVieneuRouter", "createGptSoVitsRouter",
    "createElevenLabsRouter", "createRvcApplioRouter", "createVideoRouter",
  ]) assert.ok(server.includes(`${provider}()`), `provider/render route removed: ${provider}`);
});
