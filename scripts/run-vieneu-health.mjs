import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const dotEnv = readDotEnv(path.join(projectRoot, ".env"));
const runtimeEnv = { ...dotEnv, ...process.env };
const DEFAULT_SOURCE_DIR = path.resolve(projectRoot, "..", "VieNeu-TTS");
const sourceDir = path.resolve(runtimeEnv.VIENEU_SOURCE_DIR || DEFAULT_SOURCE_DIR);
const venvDir = path.join(sourceDir, ".venv");
const defaultVenvPython = process.platform === "win32"
  ? path.join(venvDir, "Scripts", "python.exe")
  : path.join(venvDir, "bin", "python");
const pythonExe = resolveVieneuPython(runtimeEnv.VIENEU_PYTHON || "", defaultVenvPython);
const healthScript = path.join(projectRoot, "scripts", "vieneu-health.py");

if (!commandLooksExecutable(pythonExe)) {
  console.error(`Không tìm thấy VieNeu Python: ${pythonExe}`);
  console.error("Hãy chạy npm run vieneu:install trước, hoặc set VIENEU_PYTHON=python trong .env nếu muốn dùng Python global.");
  process.exit(1);
}

const result = spawnSync(pythonExe, [healthScript], {
  stdio: "inherit",
  cwd: projectRoot,
  env: buildVieneuEnv(runtimeEnv, sourceDir, pythonExe),
});
process.exit(result.status || 0);

function resolveVieneuPython(value, defaultVenvPython) {
  const requested = String(value || "").trim();
  const configured = requested ? resolveCommand(requested) : defaultVenvPython;

  if (commandLooksExecutable(configured)) return configured;

  if (!requested || samePath(configured, defaultVenvPython)) {
    return process.platform === "win32" ? "python" : "python3";
  }

  return configured;
}

function resolveCommand(value) {
  if (path.isAbsolute(value) || !looksLikePath(value)) return value;
  return path.resolve(projectRoot, value);
}

function commandLooksExecutable(command) {
  if (["python", "python3", "py"].includes(command)) return true;
  return fs.existsSync(command);
}

function buildVieneuEnv(baseEnv, sourceDir, pythonExe) {
  const sourceSrcDir = path.join(sourceDir, "src");
  const pythonPath = [
    fs.existsSync(sourceSrcDir) ? sourceSrcDir : "",
    baseEnv.PYTHONPATH || "",
  ].filter(Boolean).join(path.delimiter);

  return {
    ...baseEnv,
    VIENEU_SOURCE_DIR: sourceDir,
    VIENEU_PYTHON: pythonExe,
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    ...(pythonPath ? { PYTHONPATH: pythonPath } : {}),
  };
}

function looksLikePath(value) {
  return value.includes("/") || value.includes("\\");
}

function samePath(left, right) {
  return path.normalize(left).toLowerCase() === path.normalize(right).toLowerCase();
}

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
