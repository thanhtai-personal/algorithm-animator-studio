import "dotenv/config";
import path from "node:path";
import { pathToFileURL } from "node:url";
import concurrently from "concurrently";

const DEFAULT_API_ORIGIN = "http://localhost:5050";
const API_HEALTH_TIMEOUT_MS = 2_000;

export function createProductionCommands(apiHealthy) {
  const commands = [];

  if (!apiHealthy) {
    commands.push({
      command: "npm run start:server",
      name: "api",
      prefixColor: "green",
    });
  }

  commands.push({
    command: "npm run preview -- --host 0.0.0.0 --port 3000 --strictPort",
    name: "web",
    prefixColor: "cyan",
  });

  return commands;
}

export async function isApiHealthy(healthUrl, request = fetch) {
  try {
    const response = await request(healthUrl, {
      signal: AbortSignal.timeout(API_HEALTH_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function resolveApiHealthUrl(env = process.env) {
  const configuredOrigin = env.VITE_API_URL || env.SERVER_ORIGIN || DEFAULT_API_ORIGIN;

  try {
    return new URL("/api/health", `${configuredOrigin.replace(/\/+$/, "")}/`).toString();
  } catch {
    return `${DEFAULT_API_ORIGIN}/api/health`;
  }
}

async function main() {
  const healthUrl = resolveApiHealthUrl();
  const apiHealthy = await isApiHealthy(healthUrl);

  if (apiHealthy) {
    console.log(`[api] Reusing the healthy backend at ${healthUrl}`);
  } else {
    console.log(`[api] No healthy backend found at ${healthUrl}; starting a local backend.`);
  }

  let interrupted = false;
  process.once("SIGINT", () => { interrupted = true; });
  process.once("SIGTERM", () => { interrupted = true; });

  const { result } = concurrently(createProductionCommands(apiHealthy), {
    prefix: "name",
    killOthersOn: ["failure"],
  });

  try {
    await result;
  } catch (error) {
    if (!interrupted) throw error;
  }
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isEntryPoint()) {
  main().catch((error) => {
    console.error("[ERROR] Production startup failed.", error);
    process.exitCode = 1;
  });
}
