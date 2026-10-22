import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { trackedFilesUnder } from "./helpers/oss-tracked-source.mjs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("VieNeu is an optional external checkout without vendored SDK/model/preset artifacts", () => {
  assert.deepEqual(trackedFilesUnder(root, "libs/VieNeu-TTS"), [],
    "upstream VieNeu SDK, model and voice presets must not be committed to Git");
  assert.match(read(".gitignore"), /^libs\\/VieNeu-TTS\\/$/m);
  const example = read(".env.example");
  assert.match(example, /VIENEU_SOURCE_DIR=\.\.\/VieNeu-TTS/);
  assert.match(example, /KAI_PROVIDER_VIENEU_ENABLED=false/);
  assert.match(example, /VIENEU_AUTO_START=false/);
  const script = read("scripts/install-vieneu-from-source.mjs");
  assert.match(script, /DEFAULT_SOURCE_DIR/);
  assert.match(script, /VieNeu-TTS/);
  assert.doesNotMatch(script, /libs\/VieNeu-TTS/);
});

test("README has separate setup instructions for the supported voice engines", () => {
  const readme = read("README.md");
  for (const upstream of [
    "OHF-Voice/piper1-gpl", "supertone-inc/supertonic", "pnnbao97/VieNeu-TTS",
    "RVC-Boss/GPT-SoVITS", "IAHispano/Applio",
  ]) assert.ok(readme.includes(upstream), `missing upstream instructions: ${upstream}`);
  for (const command of [
    "npm run dev", "supertonic:serve", "vieneu:install", "vieneu:health",
    "gpt-sovits:serve", "applio:install",
  ]) assert.ok(readme.includes(command), `missing command: ${command}`);
  assert.match(readme, /ElevenLabs.*not open source/i);
});

test("all original TTS providers remain accessible even with no VieNeu checkout", () => {
  const app = read("server/index.ts");
  const ui = read("src/pages/TextToSpeech.tsx");
  for (const name of [
    "createGenerateRouter", "createSupertonicRouter", "createVieneuRouter",
    "createGptSoVitsRouter", "createElevenLabsRouter", "createRvcApplioRouter",
  ]) assert.ok(app.includes(`${name}()`), `missing router: ${name}`);
  for (const method of [
    "generatePiperVoice", "generateSupertonicVoice", "generateVieneuVoice",
    "generateGptSoVitsVoice", "generateElevenLabsVoice", "generateRvcApplioVoice",
  ]) assert.ok(ui.includes(method), `missing TTS UI path: ${method}`);
});
