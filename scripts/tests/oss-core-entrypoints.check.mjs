import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const source = (filename) => fs.readFileSync(path.join(ROOT, filename), "utf8");

test("OSS entrypoints expose manual algorithm flows and retain TTS", () => {
  const app = source("src/App.tsx");
  assert.match(app, /path="\/" element=\{<Navigate replace to="\/algorithms"/);
  for (const route of ["/algorithms", "/algorithms/maze", "/algorithms/video-long", "/text-to-speech", "/settings", "/assets"]) {
    assert.ok(app.includes(`path="${route}"`), `missing route ${route}`);
  }
  assert.doesNotMatch(app, /path="\/(?:stories|news|videos\/presets|channel)"/);
});

test("algorithm wrappers no longer load the publishing/agent workflow", () => {
  for (const name of ["AlgorithmChannelPage", "MazePathfindingPage", "AlgorithmLongVideoPage"]) {
    const file = source(`src/pages/${name}.tsx`);
    assert.doesNotMatch(file, /AiVideoAgent|autoPublishByDefault|TabsTrigger value="agentic"/, name);
  }
});

test("local algorithm creation and exports do not require login", () => {
  for (const name of ["Index", "AlgorithmWorld", "LongContent"]) {
    const file = source(`src/pages/${name}.tsx`);
    assert.doesNotMatch(file, /getCurrentProfile|isSuperAdminProfile|navigate\("\/auth"/, name);
  }
});

test("navigation only advertises preserved feature surfaces", () => {
  const nav = source("src/components/appNavigation.ts");
  for (const retained of ["/algorithms", "/algorithms/maze", "/algorithms/video-long", "/text-to-speech", "/settings"]) {
    assert.ok(nav.includes(`to: "${retained}"`), `navigation lost ${retained}`);
  }
  assert.doesNotMatch(nav, /to: "\/(?:stories|news|channel|videos\/presets|youtube-tools)"/);
  const defaults = source("src/lib/menuFeatureSettings.ts");
  for (const id of ["algorithm-studio", "maze-pathfinding", "algorithm-long", "text-to-speech"]) {
    assert.match(defaults, new RegExp(`"${id}": true`), `default disabled: ${id}`);
  }
});

test("original TTS UI and provider server routes stay registered", () => {
  const app = source("src/App.tsx");
  const tts = source("src/pages/TextToSpeech.tsx");
  const server = source("server/index.ts");
  assert.ok(app.includes('path="/text-to-speech"'));
  for (const name of [
    "Piper", "Supertonic", "Vieneu", "GptSoVits", "ElevenLabs", "RvcApplio"
  ]) {
    assert.ok(tts.includes(`generate${name}Voice`), `TTS UI lost ${name}`);
  }
  for (const router of [
    "createGenerateRouter", "createSupertonicRouter", "createVieneuRouter",
    "createGptSoVitsRouter", "createElevenLabsRouter", "createRvcApplioRouter",
  ]) {
    assert.ok(server.includes(`${router}()`), `TTS backend lost ${router}`);
  }
});
