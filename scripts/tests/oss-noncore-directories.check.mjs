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
  "ai-video-agent",
  "channel-manager",
  "publishing-ops",
  "social-channel",
  "youtube-channel",
];

const retiredPages = [
  "GithubTrendingVideo",
  "MuNewsStudio",
  "SocialPublishing",
  "StoryReviewStudio",
  "StoryVideoStudio",
  "AiVideoAgent",
  "JobManagement",
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

test("AI and publishing background-notification UI is detached", () => {
  const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
  const layout = fs.readFileSync(path.join(root, "src/components/AppLayout.tsx"), "utf8");
  const nav = fs.readFileSync(path.join(root, "src/components/appNavigation.ts"), "utf8");
  assert.doesNotMatch(app, /path="\/jobs"/);
  assert.doesNotMatch(layout, /BackgroundJobsNotifier/);
  assert.doesNotMatch(nav, /to: "\/jobs"/);
  assert.equal(fs.existsSync(path.join(root, "src/components/BackgroundJobsNotifier.tsx")), false);
});
