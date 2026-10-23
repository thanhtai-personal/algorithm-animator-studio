#!/usr/bin/env node
/**
 * OSS cleanup guard: deletion must not silently remove an algorithm entrypoint
 * or any TTS provider integration. Structural presence != runtime correctness.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const keep = [
  "src/lib/algorithms/index.ts",
  "src/pages/Index.tsx",
  "src/pages/AlgorithmWorld.tsx",
  "src/pages/LongContent.tsx",
  "src/pages/TextToSpeech.tsx",
  "src/lib/voiceApi.ts",
  "server/index.ts",
  "server/config/paths.ts",
  "server/routes/generateRoutes.ts",
  "server/routes/piperRuntimeRoutes.ts",
  "server/routes/supertonicRoutes.ts",
  "server/routes/vieneuRoutes.ts",
  "server/routes/gptSoVitsRoutes.ts",
  "server/routes/elevenLabsRoutes.ts",
  "server/routes/rvcApplioRoutes.ts",
  "server/services/TtsGenerationService.ts",
  "server/services/PiperService.ts",
  "server/services/SupertonicService.ts",
  "server/services/VieneuService.ts",
  "server/services/GptSoVitsService.ts",
  "server/services/ElevenLabsService.ts",
  "server/services/RvcApplioService.ts",
];

const missing = keep.filter((name) => !fs.existsSync(path.join(root, name)));
if (missing.length) {
  console.error("OSS keep-contract missing required modules:");
  for (const name of missing) console.error("  -", name);
  process.exitCode = 1;
} else {
  console.log(`OSS keep-contract: ${keep.length} required algorithm and TTS modules present.`);
}

// Provider UI wiring is not proven by file existence; require a direct
// source-level smoke guard while runtime integration tests are being added.
const voiceFile = path.join(root, "src/pages/TextToSpeech.tsx");
if (fs.existsSync(voiceFile)) {
  const ui = fs.readFileSync(voiceFile, "utf8");
  for (const call of [
    "generatePiperVoice",
    "generateSupertonicVoice",
    "generateVieneuVoice",
    "generateGptSoVitsVoice",
    "generateElevenLabsVoice",
    "generateRvcApplioVoice",
    "convertRvcApplioVoice",
  ]) {
    if (!ui.includes(call)) {
      console.error(`OSS keep-contract: TTS UI missing ${call}`);
      process.exitCode = 1;
    }
  }
}
