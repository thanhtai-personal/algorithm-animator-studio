import fs from "node:fs";
import path from "node:path";
import { REMOTE_CONTROL_HOME } from "../config/remoteControlPaths";
import type { RemoteControlConfig, RemoteControlConfigUpdate } from "../models/RemoteControl";

const CONFIG_PATH = path.join(REMOTE_CONTROL_HOME, "remote-control.json");
const SECRET_PATH = path.join(REMOTE_CONTROL_HOME, "remote-control.env");
const AUDIT_PATH = path.join(REMOTE_CONTROL_HOME, "remote-control-audit.log");

export const DEFAULT_REMOTE_CONTROL_CONFIG: RemoteControlConfig = {
  enabled: false,
  allowedUserIds: [],
  ollamaEnabled: false,
  ollamaBaseUrl: "http://127.0.0.1:11434",
  ollamaModel: "",
  allowPowerActions: false,
  appAliases: {},
};

export function readRemoteControlConfig(): RemoteControlConfig {
  if (!fs.existsSync(CONFIG_PATH)) return { ...DEFAULT_REMOTE_CONTROL_CONFIG, appAliases: {} };

  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as unknown;
    return normalizeRemoteControlConfig(parsed);
  } catch (error) {
    console.warn("[remote-control] Could not read config:", error);
    return { ...DEFAULT_REMOTE_CONTROL_CONFIG, appAliases: {} };
  }
}

export function saveRemoteControlConfig(update: RemoteControlConfigUpdate): RemoteControlConfig {
  const current = readRemoteControlConfig();
  const next = normalizeRemoteControlConfig({ ...current, ...update });
  const nextBotToken = typeof update.botToken === "string" && update.botToken.trim()
    ? normalizeBotToken(update.botToken)
    : "";

  ensureHomeDirectory();
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });

  if (update.removeBotToken) {
    fs.rmSync(SECRET_PATH, { force: true });
  } else if (nextBotToken) {
    writeBotToken(nextBotToken);
  }

  return next;
}

export function readTelegramBotToken(): string {
  if (!fs.existsSync(SECRET_PATH)) return "";

  const line = fs.readFileSync(SECRET_PATH, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("TELEGRAM_BOT_TOKEN="));

  return line?.slice("TELEGRAM_BOT_TOKEN=".length).trim() || "";
}

export function hasTelegramBotToken(): boolean {
  return Boolean(readTelegramBotToken());
}

export function appendRemoteControlAudit(entry: Record<string, unknown>) {
  ensureHomeDirectory();
  fs.appendFileSync(AUDIT_PATH, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

export function normalizeRemoteControlConfig(value: unknown): RemoteControlConfig {
  const source = isRecord(value) ? value : {};
  const aliases = normalizeAliases(source.appAliases);

  const config: RemoteControlConfig = {
    enabled: source.enabled === true,
    allowedUserIds: normalizeUserIds(source.allowedUserIds),
    ollamaEnabled: source.ollamaEnabled === true,
    ollamaBaseUrl: normalizeOllamaBaseUrl(source.ollamaBaseUrl),
    ollamaModel: typeof source.ollamaModel === "string" ? source.ollamaModel.trim() : "",
    allowPowerActions: source.allowPowerActions === true,
    appAliases: aliases,
  };

  if (config.enabled && config.allowedUserIds.length === 0) {
    throw new Error("Remote Control cần ít nhất một Telegram user ID được phép.");
  }

  if (config.ollamaEnabled && !config.ollamaModel) {
    throw new Error("Cần chọn Ollama model khi bật hiểu lệnh tự nhiên.");
  }

  return config;
}

function normalizeUserIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((item) => {
      if (!/^\d{1,20}$/.test(item)) throw new Error(`Telegram user ID không hợp lệ: ${item}`);
      return item;
    }))];
}

function normalizeAliases(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};

  const aliases: Record<string, string> = {};
  for (const [rawAlias, rawExecutable] of Object.entries(value)) {
    const alias = rawAlias.trim().toLowerCase();
    const executable = typeof rawExecutable === "string" ? rawExecutable.trim() : "";

    if (!alias && !executable) continue;
    if (!/^[a-z0-9][a-z0-9._-]{0,31}$/.test(alias)) {
      throw new Error(`Alias ứng dụng không hợp lệ: ${rawAlias}`);
    }
    if (!executable) throw new Error(`Alias "${alias}" chưa có executable.`);
    aliases[alias] = executable;
  }

  return aliases;
}

function normalizeOllamaBaseUrl(value: unknown): string {
  const raw = typeof value === "string" && value.trim()
    ? value.trim()
    : DEFAULT_REMOTE_CONTROL_CONFIG.ollamaBaseUrl;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Ollama base URL không hợp lệ.");
  }

  const hostname = url.hostname.toLowerCase();
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(hostname)) {
    throw new Error("Remote Control chỉ cho phép Ollama chạy trên localhost.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Ollama base URL phải dùng http hoặc https.");
  }

  return url.origin;
}

function writeBotToken(token: string) {
  ensureHomeDirectory();
  fs.writeFileSync(SECRET_PATH, `TELEGRAM_BOT_TOKEN=${token}\n`, { encoding: "utf8", mode: 0o600 });
}

function normalizeBotToken(token: string): string {
  const normalized = token.trim();
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(normalized)) {
    throw new Error("Telegram bot token không đúng định dạng.");
  }
  return normalized;
}

function ensureHomeDirectory() {
  fs.mkdirSync(REMOTE_CONTROL_HOME, { recursive: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
