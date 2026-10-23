import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { trackedFilesUnder } from "./helpers/oss-tracked-source.mjs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const example = fs.readFileSync(path.join(root, ".env.example"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

test("base dev runs with no optional TTS engine installed", () => {
  assert.match(pkg.scripts.dev, /dev:client/);
  assert.match(pkg.scripts.dev, /dev:server/);
  for (const name of ["dev:supertonic", "dev:applio", "dev:vieneu", "dev:gpt-sovits"]) {
    assert.ok(!pkg.scripts.dev.includes(name), `Optional startup leaked into base dev: ${name}`);
    assert.ok(pkg.scripts["dev:full"].includes(name), `Explicit full dev missing: ${name}`);
  }
});

test("optional TTS source and third-party sample voices are not embedded in desktop distribution", () => {
  const resourceSources = (pkg.build?.extraResources || []).map((item) => item.from);
  assert.ok(!resourceSources.includes("libs/VieNeu-TTS"));
  assert.ok(!resourceSources.includes("models"));
  assert.deepEqual(trackedFilesUnder(root, "libs/VieNeu-TTS"), [],
    "local ignored VieNeu files are okay, but Git must not track bundled SDK/voices");
  for (const provider of ["SUPERTONIC", "APPLIO", "VIENEU", "GPT_SOVITS"]) {
    assert.ok(example.includes(`KAI_PROVIDER_${provider}_ENABLED=false`), `${provider} must be opt-in`);
  }
});

test("README links and commands cover separately installed local engines", () => {
  for (const entry of [
    "npm run dev", "npm run supertonic:serve", "npm run vieneu:install",
    "npm run vieneu:health", "npm run gpt-sovits:serve",
    "github.com/OHF-Voice/piper1-gpl",
    "github.com/pnnbao97/VieNeu-TTS",
    "github.com/RVC-Boss/GPT-SoVITS",
    "github.com/IAHispano/Applio",
  ]) assert.ok(readme.includes(entry), `README guidance missing: ${entry}`);
  for (const p of [
    "server/routes/generateRoutes.ts",
    "server/routes/piperRuntimeRoutes.ts",
    "server/routes/supertonicRoutes.ts",
    "server/routes/vieneuRoutes.ts",
    "server/routes/gptSoVitsRoutes.ts",
    "server/routes/rvcApplioRoutes.ts",
    "server/routes/elevenLabsRoutes.ts",
  ]) assert.ok(fs.existsSync(path.join(root, p)), `Kept voice API file missing: ${p}`);
});
