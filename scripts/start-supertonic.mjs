import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const envFile = readDotEnv(path.resolve(process.cwd(), ".env"));
const env = { ...envFile, ...process.env };

const baseUrl = env.SUPERTONIC_BASE_URL || "http://127.0.0.1:6688";
const url = new URL(baseUrl);
const host = env.SUPERTONIC_HOST || url.hostname || "127.0.0.1";
const port = env.SUPERTONIC_PORT || url.port || "6688";
const model = env.SUPERTONIC_MODEL || "supertonic-3";
const cors = env.SUPERTONIC_CORS || env.CLIENT_ORIGIN || "http://localhost:3000";

const args = ["serve", "--host", host, "--port", port, "--model", model, "--cors", cors];
console.log(`[supertonic] starting ${model} at http://${host}:${port}`);

const child = spawn("supertonic", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("error", (error) => {
  console.error("[supertonic] failed to start:", error.message);
  console.error("[supertonic] run: npm run supertonic:install");
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
        const value = rawValue.replace(/^['\"]|['\"]$/g, "");
        return [key, value];
      })
  );
}
