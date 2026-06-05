import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const envFile = readDotEnv(path.resolve(process.cwd(), ".env"));
const env = { ...envFile, ...process.env };
const command = String(env.RVC_APPLIO_START_COMMAND || "").trim();

if (!command) {
  console.log("[applio] RVC_APPLIO_START_COMMAND is empty; skipping Applio startup.");
  process.exit(0);
}

console.log(`[applio] starting: ${command}`);
const child = spawn(command, {
  stdio: "inherit",
  shell: true,
  env: process.env,
  cwd: process.cwd(),
});

child.on("error", (error) => {
  console.error("[applio] failed to start:", error.message);
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
      })
  );
}
