import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("auto lyrics uses a standalone Whisper adapter, not deleted YouTube Tools", () => {
  const lyrics = read("server/services/VideoLyricsService.ts");
  assert.match(lyrics, /from "\.\/WhisperCliService"/);
  assert.doesNotMatch(lyrics, /YoutubeToolsService/);
  const standalone = read("server/services/WhisperCliService.ts");
  const defaults = read("server/config/runtimeDefaults.ts");
  const runtimeEnv = read("server/services/RuntimeEnvService.ts");
  const runtimeSettings = read("src/lib/runtimeSettings.ts");
  assert.match(defaults, /WHISPER_PYTHON: "python"/);
  assert.match(runtimeEnv, /"WHISPER_PYTHON"/);
  assert.match(runtimeSettings, /WHISPER_PYTHON/);
  assert.match(standalone, /export async function resolveWhisper/);
  assert.match(standalone, /export function runCommand/);
  assert.doesNotMatch(standalone, /yt_dlp|youtubeDownload|YOUTUBE_DLP/);
});

test("algorithm timeline, auto-lyrics endpoint and all voice routers remain", () => {
  const video = read("server/routes/videoRoutes.ts");
  for (const route of ["/video/auto-lyrics", "/video/render-timeline", "/video/render-remotion"]) {
    assert.ok(video.includes(route), `missing video route: ${route}`);
  }
  const app = read("server/index.ts");
  for (const name of [
    "createGenerateRouter", "createPiperRuntimeRouter", "createSupertonicRouter",
    "createVieneuRouter", "createGptSoVitsRouter", "createElevenLabsRouter",
    "createRvcApplioRouter",
  ]) assert.ok(app.includes(`${name}()`), `TTS router missing: ${name}`);
});
