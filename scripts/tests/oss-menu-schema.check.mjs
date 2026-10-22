import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("feature settings only expose OSS algorithm/voice/workspace menu IDs", () => {
  const source = fs.readFileSync(path.join(root, "src/lib/menuFeatureSettings.ts"), "utf8");
  for (const key of ["algorithm-studio", "maze-pathfinding", "algorithm-long", "text-to-speech", "assets"]) {
    assert.match(source, new RegExp(`"${key}"\\s*:\\s*true`), `default must enable ${key}`);
  }
  for (const key of ["rhythmic-studio", "story-studio", "story-author", "story-review", "football-commentary", "github-trending", "preset-videos", "common-video", "youtube-tools", "jobs", "channel", "math-video"]) {
    assert.ok(!source.includes(`"${key}"`), `removed menu feature still in active schema: ${key}`);
  }
  assert.match(source, /algorithm-animator\.oss\.menuFeatures\.v1/, "OSS menu must not inherit disabled legacy KAI channel toggles");
});
