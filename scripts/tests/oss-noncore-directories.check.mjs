import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const retiredFrontends = [
  "action-duel",
  "github-trending",
  "mu-news",
  "story-author",
  "story-review",
  "story-video",
  "rhythmic-studio",
  "marble-tower-video",
];

const retiredPages = [
  "GithubTrendingVideo",
  "MuNewsStudio",
  "SocialPublishing",
  "StoryReviewStudio",
  "StoryVideoStudio",
];

test("retired domain source is absent from the OSS core", () => {
  for (const feature of retiredFrontends) {
    const target = path.join(root, "src", "features", feature);
    assert.equal(fs.existsSync(target), false, `retired domain still tracked: ${target}`);
  }
  for (const page of retiredPages) {
    assert.equal(fs.existsSync(path.join(root, "src", "pages", `${page}.tsx`)), false, `retired page still tracked: ${page}`);
  }
});

test("algorithm, maze, long video, render, and TTS remain", () => {
  for (const target of [
    "src/lib/algorithms/index.ts",
    "src/pages/Index.tsx",
    "src/pages/AlgorithmWorld.tsx",
    "src/pages/LongContent.tsx",
    "src/pages/TextToSpeech.tsx",
    "src/features/algorithm-video-3d/Algorithm3DPreview.tsx",
    "src/features/remotion-video/remotion/index.ts",
    "server/routes/elevenLabsRoutes.ts",
    "server/routes/generateRoutes.ts",
    "server/routes/supertonicRoutes.ts",
    "server/routes/vieneuRoutes.ts",
    "server/routes/gptSoVitsRoutes.ts",
    "server/routes/rvcApplioRoutes.ts",
  ]) assert.ok(fs.existsSync(path.join(root, target)), `protected contract missing: ${target}`);
});
