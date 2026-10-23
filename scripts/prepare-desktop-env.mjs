import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

const root = process.cwd();
const envPath = path.join(root, ".env");
const outDir = path.join(root, "dist-electron");
const outPath = path.join(outDir, "desktop-env.json");

const allowedKeys = [
  "PORT",
  "SERVER_ORIGIN",
  "CLIENT_ORIGIN",
  "VITE_CLIENT_ORIGIN",
  "VITE_API_URL",
  "KATA_STUDIO_HOME",
  "MODEL_DIR",
  "PIPER_EXE",
  "SERVER_DATA_DIR",
  "MUSIC_LIBRARY_DIR",
  "FFMPEG_EXE",
  "FFPROBE_EXE",
  "VITE_PUBLIC_WEB",
  "VITE_NEST_API_BASE_URL",
  "SUPERTONIC_BASE_URL",
  "SUPERTONIC_MODEL",
  "SUPERTONIC_HEALTH_ENDPOINT",
  "SUPERTONIC_STYLES_ENDPOINT",
  "SUPERTONIC_IMPORT_STYLE_ENDPOINT",
  "SUPERTONIC_TTS_ENDPOINT",
  "RVC_APPLIO_BASE_URL",
  "RVC_APPLIO_START_COMMAND",
  "RVC_APPLIO_API_NAME",
  "RVC_APPLIO_PYTHON",
  "VIENEU_SOURCE_DIR",
  "VIENEU_PYTHON",
  "VIENEU_START_MODE",
  "VIENEU_AUTO_START",
  "VIENEU_MODE",
  "VIENEU_EMOTION",
  "VIENEU_DEFAULT_VOICE_ID",
  "VIENEU_REFERENCE_AUDIO",
  "VIENEU_REFERENCE_TEXT",
  "VIENEU_REMOTE_API_BASE",
  "VIENEU_REMOTE_MODEL",
  "VIENEU_TIMEOUT_MS",
];

const blockedPatterns = [
  /_SECRET$/i,
  /_API_KEY$/i,
  /^ELEVENLABS_API_KEY$/i,
  /^YOUTUBE_CLIENT_SECRET$/i,
  /^TIKTOK_CLIENT_SECRET$/i,
  /^FACEBOOK_APP_SECRET$/i,
  /^INSTAGRAM_APP_SECRET$/i,
];

function isBlocked(key) {
  return blockedPatterns.some((pattern) => pattern.test(key));
}

const parsed = fs.existsSync(envPath) ? parse(fs.readFileSync(envPath)) : {};
const output = {};

for (const key of allowedKeys) {
  const value = process.env[key] ?? parsed[key];
  if (value === undefined || value === null || String(value).trim() === "") continue;
  if (isBlocked(key)) continue;
  output[key] = String(value);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`[desktop-env] Wrote ${Object.keys(output).length} safe runtime env values to ${path.relative(root, outPath)}`);
console.log("[desktop-env] Secrets/API keys are intentionally excluded. Configure them at runtime instead of packing them into the installer.");
