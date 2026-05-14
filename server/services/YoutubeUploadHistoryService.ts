import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, SERVER_DATA_DIR } from "../config/paths";
import type { YoutubeUploadHistoryItem } from "../models/Resource";
import { ensureDirectoryExists } from "../utils/audioOutput";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";

const HISTORY_FILE_NAME = "youtube-upload-history.json";
const MAX_HISTORY_ITEMS = 500;

export function listYoutubeUploadHistory(envOverrides: RuntimeEnvValues = {}): YoutubeUploadHistoryItem[] {
  return readHistory(envOverrides);
}

export function recordYoutubeUploadHistory(
  item: Omit<YoutubeUploadHistoryItem, "id" | "attemptedAtMs">,
  envOverrides: RuntimeEnvValues = {}
) {
  const nextItem: YoutubeUploadHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    attemptedAtMs: Date.now(),
  };
  const nextHistory = [nextItem, ...readHistory(envOverrides)].slice(0, MAX_HISTORY_ITEMS);
  writeHistory(nextHistory, envOverrides);
  return nextItem;
}

function readHistory(envOverrides: RuntimeEnvValues = {}): YoutubeUploadHistoryItem[] {
  const historyFile = getHistoryFile(envOverrides);

  if (!fs.existsSync(historyFile)) {
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(historyFile, "utf8")) as YoutubeUploadHistoryItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeHistory(items: YoutubeUploadHistoryItem[], envOverrides: RuntimeEnvValues = {}) {
  const dataDir = getServerDataDir(envOverrides);
  ensureDirectoryExists(dataDir);
  fs.writeFileSync(path.join(dataDir, HISTORY_FILE_NAME), JSON.stringify(items, null, 2), "utf8");
}

function getHistoryFile(envOverrides: RuntimeEnvValues = {}) {
  return path.join(getServerDataDir(envOverrides), HISTORY_FILE_NAME);
}

function getServerDataDir(envOverrides: RuntimeEnvValues = {}) {
  const configuredPath = readEnvValues(envOverrides).SERVER_DATA_DIR || SERVER_DATA_DIR;
  const trimmed = configuredPath.trim();

  if (!trimmed) {
    return SERVER_DATA_DIR;
  }

  return path.isAbsolute(trimmed) ? trimmed : path.resolve(PROJECT_ROOT, trimmed);
}
