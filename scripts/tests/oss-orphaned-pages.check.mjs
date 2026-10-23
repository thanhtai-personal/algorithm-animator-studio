import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const obsoletePages = [
  "NewsChannelPage",
  "StoryChannelPage",
  "StoryAuthorStudio",
  "StoryReviewChannelPage",
  "YoutubePublishing",
  "YoutubeTools",
  "CommonVideoPage",
  "PresetVideos",
  "MathVideoStudio",
  "RhythmicStudio",
  "MarbleTowerVideo",
  "ActionDuelStudio"
];

test("the unused video, story, news and publishing route components are removed", () => {
  const app = fs.readFileSync(path.join(ROOT, "src/App.tsx"), "utf8");
  for (const page of obsoletePages) {
    assert.ok(!app.includes(`./pages/${page}.tsx`), `App still imports ${page}`);
    assert.ok(!fs.existsSync(path.join(ROOT, `src/pages/${page}.tsx`)), `obsolete page still tracked: ${page}`);
  }
});

test("Algorithm studio and the original Text to Speech UI are never deleted", () => {
  for (const page of ["Index", "AlgorithmWorld", "LongContent", "TextToSpeech"]) {
    assert.ok(fs.existsSync(path.join(ROOT, `src/pages/${page}.tsx`)), `protected page missing: ${page}`);
  }
});
