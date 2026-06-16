import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const envFile = readDotEnv(path.resolve(projectRoot, ".env"));
const env = {
  ...envFile,
  ...process.env,
  BROWSER: process.env.BROWSER || "none",
  NO_BROWSER: process.env.NO_BROWSER || "1",
  GRADIO_ANALYTICS_ENABLED: process.env.GRADIO_ANALYTICS_ENABLED || "False",
};
const managed = String(env.KAI_STUDIO_MANAGED_SERVICE || "").trim() === "1";

if (!providerEnabled(env.KAI_PROVIDER_GPT_SOVITS_ENABLED, false)) {
  console.log("[gpt-sovits] provider disabled by KAI_PROVIDER_GPT_SOVITS_ENABLED=false; skipping startup.");
  process.exit(0);
}

const command = String(env.GPT_SOVITS_START_COMMAND || "").trim();
const sourceDir = path.resolve(env.GPT_SOVITS_SOURCE_DIR || path.join(projectRoot, "libs", "GPT-SoVITS"));

if (!command) {
  console.log("[gpt-sovits] GPT_SOVITS_START_COMMAND is empty; skipping startup.");
  console.log("[gpt-sovits] Example: set GPT_SOVITS_START_COMMAND=\"C:/TOOLS/GPT-SoVITS/go-api.bat\" in .env.");
  process.exit(0);
}

const commandCwd = getCommandCwd(command) || (fs.existsSync(sourceDir) ? sourceDir : projectRoot);
console.log(`[gpt-sovits] starting: ${command}`);
if (commandCwd !== projectRoot) console.log(`[gpt-sovits] cwd: ${commandCwd}`);

const child = spawn(command, {
  cwd: commandCwd,
  env,
  stdio: managed ? "ignore" : "inherit",
  shell: true,
  windowsHide: true,
  detached: managed,
});

if (managed) {
  child.unref();
  setTimeout(() => process.exit(0), 1800);
}

child.on("error", (error) => {
  console.error("[gpt-sovits] failed to start:", error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

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

function getCommandCwd(commandValue) {
  const executable = getFirstCommandToken(commandValue);
  if (!/\.(bat|cmd|ps1)$/i.test(executable)) return "";
  if (!/[\\/]|^[A-Za-z]:/.test(executable)) return "";
  return path.dirname(executable.replaceAll("\\", "/"));
}

function getFirstCommandToken(commandValue) {
  const trimmed = commandValue.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith('"')) {
    const endIndex = trimmed.indexOf('"', 1);
    return endIndex > 0 ? trimmed.slice(1, endIndex) : trimmed.slice(1);
  }
  if (trimmed.startsWith("'")) {
    const endIndex = trimmed.indexOf("'", 1);
    return endIndex > 0 ? trimmed.slice(1, endIndex) : trimmed.slice(1);
  }
  return trimmed.split(/\s+/)[0];
}
