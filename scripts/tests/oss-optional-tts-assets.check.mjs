import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { trackedFilesUnder } from "./helpers/oss-tracked-source.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("no downloaded speech-model weights are tracked or bundled", () => {
  const trackedModels = trackedFilesUnder(root, "models");
  const weights = trackedModels.filter((file) => /\.(?:onnx(?:\.json)?|pt|pth|safetensors|ckpt)$/i.test(file));
  assert.deepEqual(weights, [], "downloaded TTS model weights must be installed by each user");
  const pkg = JSON.parse(read("package.json"));
  const resources = (pkg.build?.extraResources || []).map((item) => item.from);
  assert.ok(!resources.includes("models"), "desktop package must not embed the local model directory");
  assert.match(read(".gitignore"), /models\/\*\*\/\*\.onnx/);
});

test("optional local TTS runtimes default off and use external sibling checkouts", () => {
  const defaults = read("server/config/runtimeDefaults.ts");
  for (const provider of ["SUPERTONIC", "APPLIO", "VIENEU", "GPT_SOVITS"]) {
    assert.match(defaults, new RegExp("KAI_PROVIDER_" + provider + '_ENABLED: "false"'));
  }
  assert.match(defaults, /GPT_SOVITS_SOURCE_DIR: "\.\.\/GPT-SoVITS"/);
  assert.match(defaults, /VIENEU_SOURCE_DIR: "\.\.\/VieNeu-TTS"/);
  assert.match(defaults, /VIENEU_AUTO_START: "false"/);
  for (const script of ["scripts/start-supertonic.mjs", "scripts/start-applio.mjs", "scripts/start-vieneu.mjs"]) {
    assert.match(read(script), /providerEnabled\([^,]+, false\)/, script + " must skip by default");
  }
});

test("README provides separate download, install, start and health-check steps", () => {
  const readme = read("README.md");
  for (const required of [
    "piper-tts", "PIPER_EXE", "MODEL_DIR=../tts-models", "Settings → Voice",
    "npm run supertonic:install", "npm run supertonic:serve", "/v1/health",
    "git clone https://github.com/pnnbao97/VieNeu-TTS.git ../VieNeu-TTS",
    "npm run vieneu:install", "npm run vieneu:health",
    "git clone https://github.com/RVC-Boss/GPT-SoVITS.git ../GPT-SoVITS",
    "npm run gpt-sovits:serve",
    "git clone https://github.com/IAHispano/Applio.git ../Applio",
    "npm run dev:applio", "npm run applio:install",
    "ElevenLabs is hosted/proprietary, not open source",
    "Expected behavior with no downloaded model or external runtime",
  ]) assert.ok(readme.includes(required), "README missing setup detail: " + required);
});

test("core app and TTS routes remain available without installed model assets", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts.dev, /dev:client/);
  assert.match(pkg.scripts.dev, /dev:server/);
  for (const providerScript of ["dev:supertonic", "dev:applio", "dev:vieneu", "dev:gpt-sovits"]) {
    assert.ok(!pkg.scripts.dev.includes(providerScript), "base dev must not start " + providerScript);
  }
  const server = read("server/index.ts");
  for (const router of [
    "createGenerateRouter", "createPiperRuntimeRouter", "createSupertonicRouter",
    "createVieneuRouter", "createGptSoVitsRouter", "createElevenLabsRouter", "createRvcApplioRouter",
  ]) assert.ok(server.includes(router + "()"), "TTS route missing: " + router);
});
