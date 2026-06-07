import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const dotEnv = readDotEnv(path.join(projectRoot, ".env"));
const runtimeEnv = { ...dotEnv, ...process.env };
const DEFAULT_SOURCE_DIR = path.join(projectRoot, "libs", "VieNeu-TTS");
const sourceDir = path.resolve(runtimeEnv.VIENEU_SOURCE_DIR || DEFAULT_SOURCE_DIR);
const venvDir = path.join(sourceDir, ".venv");
const pythonExe = path.resolve(
  runtimeEnv.VIENEU_PYTHON ||
  (process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python")),
);
const healthScript = path.join(projectRoot, "scripts", "vieneu-health.py");

if (!fs.existsSync(pythonExe)) {
  console.error(`Không tìm thấy VieNeu Python: ${pythonExe}`);
  console.error("Hãy chạy npm run vieneu:install trước, hoặc set VIENEU_PYTHON trong .env.");
  process.exit(1);
}

const result = spawnSync(pythonExe, [healthScript], { stdio: "inherit" });
process.exit(result.status || 0);

function readDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const rawValue = line.slice(index + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}
