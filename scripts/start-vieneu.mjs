import { spawn, spawnSync } from "node:child_process";
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
const startMode = String(runtimeEnv.VIENEU_START_MODE || "bridge").trim().toLowerCase();
const startCommand = String(runtimeEnv.VIENEU_START_COMMAND || "").trim();
const healthScript = path.join(projectRoot, "scripts", "vieneu-health.py");
const env = {
  ...runtimeEnv,
  VIENEU_SOURCE_DIR: sourceDir,
  VIENEU_PYTHON: pythonExe,
};

if (String(runtimeEnv.VIENEU_AUTO_START || "true").toLowerCase() === "false" || startMode === "off") {
  console.log("[vieneu] auto start disabled; skipping VieNeu dev process.");
  process.exit(0);
}

if (!fs.existsSync(sourceDir)) {
  console.warn(`[vieneu] source not found: ${sourceDir}`);
  console.warn("[vieneu] Put VieNeu-TTS under libs/VieNeu-TTS or set VIENEU_SOURCE_DIR.");
  process.exit(0);
}

if (!fs.existsSync(pythonExe)) {
  console.warn(`[vieneu] Python venv not found: ${pythonExe}`);
  console.warn("[vieneu] Run npm run vieneu:install, then restart npm run dev.");
  process.exit(0);
}

if (startCommand) {
  startShellCommand(startCommand);
} else if (startMode === "gradio") {
  startProcess(pythonExe, ["-m", "apps.gradio_main"], sourceDir);
} else {
  runBridgeHealthAndStayAlive();
}

function runBridgeHealthAndStayAlive() {
  console.log(`[vieneu] source: ${sourceDir}`);
  console.log(`[vieneu] python: ${pythonExe}`);
  const result = spawnSync(pythonExe, [healthScript], {
    cwd: projectRoot,
    env,
    encoding: "utf8",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    console.warn("[vieneu] Health check failed. The main app will keep running, but VieNeu generation may fail.");
    console.warn("[vieneu] Try npm run vieneu:install or npm run vieneu:health for details.");
    process.exit(0);
  }

  console.log("[vieneu] bridge ready. Backend will call /api/vieneu/generate on demand.");
  console.log("[vieneu] Set VIENEU_START_MODE=gradio if you want to open VieNeu Gradio during dev.");
  keepAlive();
}

function startShellCommand(command) {
  console.log(`[vieneu] starting custom command: ${command}`);
  startProcess(command, [], sourceDir, true);
}

function startProcess(command, args, cwd, shell = false) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: "inherit",
    shell,
  });

  child.on("error", (error) => {
    console.error("[vieneu] failed to start:", error.message);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}

function keepAlive() {
  const timer = setInterval(() => undefined, 60_000);
  const shutdown = () => {
    clearInterval(timer);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
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
