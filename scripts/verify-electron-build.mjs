import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const requiredFiles = [
  "dist/index.html",
  "dist-electron/server/index.js",
  "electron/main.cjs",
  "electron/runtime-bootstrap.cjs",
  "electron/setup.html",
  "scripts/ensure-electron-binary.mjs",
  "scripts/vieneu-health.py",
  "scripts/vieneu-generate.py",
];

const requiredPackageResources = [
  ["dist", "desktop-client"],
  ["scripts", "electron-runtime/scripts"],
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing ${file}`);
  }
}

runNodeCheck("electron/main.cjs");
runNodeCheck("electron/runtime-bootstrap.cjs");
runNodeCheck("scripts/ensure-electron-binary.mjs");

const packageJson = readJson(path.join(root, "package.json"));
if (packageJson) {
  const extraResources = packageJson.build?.extraResources || [];
  // VieNeu SDK and model weights are user-managed external dependencies.
  // Desktop packaging must not copy either into an OSS installer.
  for (const entry of extraResources) {
    const from = String(entry?.from || "").replaceAll("\\", "/").replace(/\/+$/, "");
    if (from === "libs/VieNeu-TTS" || from.startsWith("libs/VieNeu-TTS/") ||
        from === "models" || from.startsWith("models/")) {
      errors.push(`Do not bundle optional TTS weights or VieNeu SDK: ${from}`);
    }
  }
  for (const [from, to] of requiredPackageResources) {
    const matched = extraResources.some((item) => item?.from === from && item?.to === to);
    if (!matched) errors.push(`package.json build.extraResources missing ${from} -> ${to}`);
  }

  const files = packageJson.build?.files || [];
  for (const expected of ["dist-electron/**/*", "electron/**/*", "package.json"]) {
    if (!files.includes(expected)) errors.push(`package.json build.files missing ${expected}`);
  }
}

if (errors.length) {
  console.error("\n[electron-verify] Build chưa sẵn sàng:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("[electron-verify] OK: desktop build assets and Electron runtime look ready.");

function runNodeCheck(file) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0) {
    errors.push(`${file} syntax error: ${(result.stderr || result.stdout).trim()}`);
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
