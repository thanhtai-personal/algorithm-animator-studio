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

export function stripYtDlpBrowserCookieArgs(args: readonly string[]) {
  const stripped: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--cookies-from-browser") {
      index += 1;
      continue;
    }
    if (arg.startsWith("--cookies-from-browser=")) continue;
    stripped.push(arg);
  }
  return stripped;
}

export function isYtDlpBrowserCookieAccessError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("could not copy") && normalized.includes("cookie database");
}

export function isYtDlpAuthenticationRequiredError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("sign in to confirm")
    || normalized.includes("not a bot")
    || normalized.includes("http error 429");
}

export function toYtDlpUserMessage(message: string) {
  const normalized = message.toLowerCase();
  if (isYtDlpAuthenticationRequiredError(message)) {
    return [
      "YouTube đang chặn tải tự động hoặc yêu cầu xác thực.",
      "Vào Settings > Data và ưu tiên YOUTUBE_COOKIES_FILE. Nếu dùng YOUTUBE_COOKIES_FROM_BROWSER, hãy đóng hẳn Chrome/Edge hoặc dùng Firefox rồi thử lại.",
      "Nếu vẫn bị cảnh báo JavaScript runtime, giữ YOUTUBE_JS_RUNTIME=node và cài Node/Deno trong môi trường backend.",
    ].join(" ");
  }
  if (normalized.includes("no supported javascript runtime")) {
    return "yt-dlp cần JavaScript runtime để đọc YouTube. Vào Settings > Data và đặt YOUTUBE_JS_RUNTIME=node hoặc deno, sau đó thử lại.";
  }
  return message;
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
