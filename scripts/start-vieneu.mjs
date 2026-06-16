import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const dotEnv = readDotEnv(path.join(projectRoot, ".env"));
const runtimeEnv = { ...dotEnv, ...process.env };
const DEFAULT_SOURCE_DIR = path.join(projectRoot, "libs", "VieNeu-TTS");
const sourceDir = path.resolve(runtimeEnv.VIENEU_SOURCE_DIR || DEFAULT_SOURCE_DIR);
const venvDir = path.join(sourceDir, ".venv");
const defaultVenvPython = process.platform === "win32"
  ? path.join(venvDir, "Scripts", "python.exe")
  : path.join(venvDir, "bin", "python");
const pythonExe = resolveVieneuPython(runtimeEnv.VIENEU_PYTHON || "", defaultVenvPython);
const startMode = String(runtimeEnv.VIENEU_START_MODE || "bridge").trim().toLowerCase();
const startCommand = String(runtimeEnv.VIENEU_START_COMMAND || "").trim();
const healthScript = path.join(projectRoot, "scripts", "vieneu-health.py");
const env = buildVieneuEnv(runtimeEnv, sourceDir, pythonExe);
const managed = String(runtimeEnv.KAI_STUDIO_MANAGED_SERVICE || "").trim() === "1";

if (!providerEnabled(runtimeEnv.KAI_PROVIDER_VIENEU_ENABLED, true)) {
  console.log("[vieneu] provider disabled by KAI_PROVIDER_VIENEU_ENABLED=false; skipping startup.");
  process.exit(0);
}

if (String(runtimeEnv.VIENEU_AUTO_START || "true").toLowerCase() === "false" || startMode === "off") {
  console.log("[vieneu] auto start disabled; skipping VieNeu dev process.");
  process.exit(0);
}

if (!fs.existsSync(sourceDir)) {
  console.warn(`[vieneu] source not found: ${sourceDir}`);
  console.warn("[vieneu] Put VieNeu-TTS under libs/VieNeu-TTS or set VIENEU_SOURCE_DIR.");
  process.exit(0);
}

if (!commandLooksExecutable(pythonExe)) {
  console.warn(`[vieneu] Python not found: ${pythonExe}`);
  console.warn("[vieneu] Run npm run vieneu:install, or set VIENEU_PYTHON=python in .env to use global Python.");
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
    stdio: managed ? "ignore" : "inherit",
    shell,
    windowsHide: true,
    detached: managed,
  });

  if (managed) {
    child.unref();
    setTimeout(() => process.exit(0), 1800);
  }

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

function providerEnabled(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return fallback;
}
