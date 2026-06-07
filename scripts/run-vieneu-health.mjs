import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_SOURCE_DIR = "C:/DATA/working/sources/VieNeu-TTS";
const projectRoot = process.cwd();
const sourceDir = path.resolve(process.env.VIENEU_SOURCE_DIR || DEFAULT_SOURCE_DIR);
const venvDir = path.join(sourceDir, ".venv");
const pythonExe = path.resolve(
  process.env.VIENEU_PYTHON ||
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
