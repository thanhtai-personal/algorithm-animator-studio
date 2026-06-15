import fs from "node:fs";
import type { YoutubeToolsHealth } from "../models/YoutubeTools";
import type { RuntimeEnvValues } from "./EnvFileService";
import { resolveRuntimeExecutable } from "./RuntimeEnvService";

export function buildYtDlpRuntimeArgs(env: RuntimeEnvValues) {
  const args: string[] = [];
  const jsRuntime = sanitizeYtDlpOption(env.YOUTUBE_JS_RUNTIME || "node");
  const remoteComponents = sanitizeYtDlpOption(env.YOUTUBE_REMOTE_COMPONENTS || "ejs:github");
  const cookiesFromBrowser = sanitizeYtDlpOption(env.YOUTUBE_COOKIES_FROM_BROWSER || "");
  const cookiesFile = env.YOUTUBE_COOKIES_FILE?.trim();
  if (jsRuntime) args.push("--js-runtimes", jsRuntime);
  if (remoteComponents) args.push("--remote-components", remoteComponents);
  if (cookiesFile) args.push("--cookies", resolveRuntimeExecutable(cookiesFile));
  else if (cookiesFromBrowser) args.push("--cookies-from-browser", cookiesFromBrowser);
  return args;
}

export function getYtDlpRuntimeStatus(env: RuntimeEnvValues): Pick<YoutubeToolsHealth, "cookieMode" | "cookieStatus" | "jsRuntime" | "remoteComponents"> {
  const jsRuntime = sanitizeYtDlpOption(env.YOUTUBE_JS_RUNTIME || "node");
  const remoteComponents = sanitizeYtDlpOption(env.YOUTUBE_REMOTE_COMPONENTS || "ejs:github");
  const cookiesFile = env.YOUTUBE_COOKIES_FILE?.trim();
  const cookiesFromBrowser = sanitizeYtDlpOption(env.YOUTUBE_COOKIES_FROM_BROWSER || "");
  const cookieMode = cookiesFile ? "file" : cookiesFromBrowser ? "browser" : "none";
  const cookiePath = cookiesFile ? resolveRuntimeExecutable(cookiesFile) : "";
  const cookieStatus = cookiesFile
    ? { ok: fs.existsSync(cookiePath), command: "YOUTUBE_COOKIES_FILE", version: cookiePath, detail: fs.existsSync(cookiePath) ? undefined : "Không tìm thấy file cookies.txt." }
    : cookiesFromBrowser
      ? { ok: true, command: "YOUTUBE_COOKIES_FROM_BROWSER", version: cookiesFromBrowser }
      : { ok: false, command: "YouTube cookies", detail: "Chưa cấu hình cookie; chỉ cần khi YouTube báo bot/429." };
  return {
    cookieMode,
    cookieStatus,
    jsRuntime: { ok: Boolean(jsRuntime), command: "YOUTUBE_JS_RUNTIME", version: jsRuntime || "node" },
    remoteComponents: { ok: Boolean(remoteComponents), command: "YOUTUBE_REMOTE_COMPONENTS", version: remoteComponents || "ejs:github" },
  };
}

function sanitizeYtDlpOption(value: string) {
  const trimmed = value.trim();
  return /^[\w.+:/\\-]+$/.test(trimmed) ? trimmed : "";
}
