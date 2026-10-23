import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("Remotion Root registers algorithm and timeline without legacy preset/math composition", () => {
  const file = read("src/features/remotion-video/remotion/Root.tsx");
  assert.match(file, /id=\{REMOTION_ALGORITHM_COMPOSITION_ID\}/);
  assert.match(file, /id=\{REMOTION_TIMELINE_COMPOSITION_ID\}/);
  for (const removed of ["MathSinCosV1", "REMOTION_PRESET_VIDEO_COMPOSITION_ID", "/math-video/", "/preset-video/"]) {
    assert.ok(!file.includes(removed), `legacy Remotion composition remains: ${removed}`);
  }
});

test("video API continues algorithm and timeline renders without preset/math handlers", () => {
  const file = read("server/routes/videoRoutes.ts");
  for (const route of ["/video/render-remotion", "/video/remotion/health", "/video/render-timeline", "/video/generate-from-audio"]) {
    assert.ok(file.includes(route), `retained render route missing: ${route}`);
  }
  for (const removed of ["createPresetVideoMediaRouter", "renderPresetVideo", "mixMathNarration", "getMathV1DefaultAudio", "importMathV1DefaultAudio", "/video/render-preset", "/video/math-narration/mix", "/video/math-v1/default-audio", "RHYTHMIC_CAPTURE_UNREADABLE"]) {
    assert.ok(!file.includes(removed), `legacy video handler remains: ${removed}`);
  }
  const backend = read("server/services/RemotionRenderService.ts");
  assert.ok(backend.includes('const COMPOSITION_ID = "AlgorithmExplainer"'));
  assert.ok(!backend.includes("PRESET_VIDEO_SOURCE_ROOT"));
});

test("obsolete preset/math module sources and assets are not bundled", () => {
  for (const name of [
    "src/features/math-video",
    "src/features/preset-video",
    "server/models/PresetVideo.ts",
    "server/routes/presetVideoMediaRoutes.ts",
    "server/services/PresetVideoRenderService.ts",
    "server/services/PresetVideoMediaService.ts",
    "server/services/MathNarrationService.ts",
    "server/services/MathV1DefaultAudioService.ts",
    "public/preset-assets",
  ]) {
    assert.equal(fs.existsSync(path.join(root, name)), false, `obsolete module remains: ${name}`);
  }
});

test("algorithm, TTS and shared render contracts stay intact", () => {
  for (const file of [
    "src/features/remotion-video/remotion/AlgorithmExplainerComposition.tsx",
    "src/features/remotion-video/remotion/TimelineComposition.tsx",
    "src/features/remotion-video/remotion/index.ts",
    "src/features/remotion-video/components/RemotionVideoGenerator.tsx",
    "src/features/video-editor/lib/videoEditorTypes.ts",
    "src/pages/TextToSpeech.tsx",
    "server/routes/generateRoutes.ts",
    "server/routes/piperRuntimeRoutes.ts",
    "server/routes/supertonicRoutes.ts",
    "server/routes/vieneuRoutes.ts",
    "server/routes/gptSoVitsRoutes.ts",
    "server/routes/elevenLabsRoutes.ts",
    "server/routes/rvcApplioRoutes.ts",
    "server/services/RemotionTimelineRenderService.ts",
  ]) assert.ok(fs.existsSync(path.join(root, file)), `kept code missing: ${file}`);
});

test("Remotion public template contract is algorithm-only and keeps maze/bars", () => {
  for (const file of [
    "src/features/remotion-video/lib/remotionVideoTypes.ts",
    "src/features/remotion-video/components/RemotionVideoGenerator.tsx",
    "src/features/remotion-video/remotion/AlgorithmExplainerComposition.tsx",
    "server/models/RemotionVideo.ts",
    "server/services/RemotionRenderService.ts",
  ]) {
    assert.doesNotMatch(read(file), /news-card|story-card/, `unrelated template still in ${file}`);
  }
  const algorithm = read("src/features/remotion-video/remotion/AlgorithmExplainerComposition.tsx");
  assert.match(algorithm, /MazePathVisual/);
  assert.match(algorithm, /AnimatedBars/);
  const normalizer = read("src/features/remotion-video/lib/remotionVideoTypes.ts");
  assert.match(normalizer, /"algorithm-explainer"/);
});
