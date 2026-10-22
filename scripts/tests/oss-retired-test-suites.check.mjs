import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("tests for retired app domains do not remain in Vitest discovery", () => {
  const dir = path.join(root, "src/test");
  const obsolete = fs.readdirSync(dir).filter(name =>
    /^(?:Rhythmic|MarbleTower|AiVideoAgent|MuNewsValidationService|muNewsUtils)/.test(name) &&
    /\.(?:test|spec)\.[jt]sx?$/.test(name)
  );
  assert.deepEqual(obsolete, [], `orphaned tests remain: ${obsolete.join(", ")}`);
});

test("retained algorithm and video rendering regression tests stay", () => {
  for (const name of [
    "Algorithm3DCompletionAudio.test.ts",
    "AlgorithmVideoRenderMode.test.ts",
    "Algorithm3DStory.test.ts",
    "VideoEditorDefaultsAndReset.test.ts",
    "RuntimeSetupGate.test.tsx",
  ]) assert.ok(fs.existsSync(path.join(root, "src/test", name)), `protected test missing: ${name}`);
});
