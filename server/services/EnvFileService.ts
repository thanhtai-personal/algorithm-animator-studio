import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";
import { SERVER_ROOT } from "../config/paths";

const ENV_PATH = path.resolve(SERVER_ROOT, "..", ".env");

export const DEFAULT_ENV_VALUES: Record<string, string> = {
  CLIENT_ORIGIN: "http://localhost:3000",
  SERVER_ORIGIN: "http://localhost:5050",
  VITE_CLIENT_ORIGIN: "http://localhost:3000",
  VITE_API_URL: "http://localhost:5050",
  APP_SERVER_URL: "https://text-to-video-server-gamma.vercel.app",
  PIPER_EXE: "models/.venv/Scripts/piper.exe",
  FFMPEG_EXE: "ffmpeg",
  FFPROBE_EXE: "ffprobe",
  SERVER_DATA_DIR: "server/data",
  MUSIC_LIBRARY_DIR: "",
  MODEL_DIR: "models",
  AI_SHORTS_API_URL: "https://generativelanguage.googleapis.com/v1beta",
  AI_SHORTS_API_KEY: "",
  AI_SHORTS_MODEL: "veo-3.1-fast-generate-preview",
  AI_SHORTS_PROVIDER: "gemini-veo",
  YOUTUBE_CLIENT_ID: "",
  YOUTUBE_CLIENT_SECRET: "",
  YOUTUBE_REDIRECT_URI: "http://localhost:3000/youtube",
  YOUTUBE_TITLE: "Algorithm video from AlgoShorts Studio",
  YOUTUBE_DESCRIPTION: "",
  YOUTUBE_TAGS: "algorithm,programming,visualization,code visual lab",
  YOUTUBE_CATEGORY_ID: "22",
  YOUTUBE_PRIVACY_STATUS: "unlisted",
  YOUTUBE_MADE_FOR_KIDS: "false",
  YOUTUBE_NOTIFY_SUBSCRIBERS: "false",
  YOUTUBE_CONTAINS_SYNTHETIC_MEDIA: "true",
  ELEVENLABS_API_KEY: "",
  ELEVENLABS_VOICES: "",
  PRO_PREVIEW_FAST_URL: "fast.mp3",
  PRO_PREVIEW_BALANCED_URL: "balanced.mp3",
  PRO_PREVIEW_MULTILINGUAL_URL: "multilingual.mp3",
  PRO_PREVIEW_EXPRESSIVE_URL: "expressive.mp3",
};

export const KNOWN_ENV_KEYS = Object.keys(DEFAULT_ENV_VALUES);

const LEGACY_LOCAL_ENV_VALUES: Record<string, Record<string, string>> = {

};

export type RuntimeEnvValues = Record<string, string>;

export function readEnvValues(overrides: RuntimeEnvValues = {}): RuntimeEnvValues {
  return normalizeLegacyEnvValues({
    ...DEFAULT_ENV_VALUES,
    ...pickKnownEnv(process.env),
    ...readDotEnvValues(),
    ...pickKnownEnv(overrides),
  });
}

export function pickKnownEnv(values: NodeJS.ProcessEnv | Record<string, unknown>): RuntimeEnvValues {
  const output: RuntimeEnvValues = {};

  for (const key of KNOWN_ENV_KEYS) {
    const value = values[key];
    if (value !== undefined && value !== null) {
      output[key] = normalizeLegacyEnvValue(key, String(value));
    }
  }

  return output;
}

function normalizeLegacyEnvValues(values: RuntimeEnvValues): RuntimeEnvValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, normalizeLegacyEnvValue(key, value)])
  );
}

function normalizeLegacyEnvValue(key: string, value: string): string {
  const trimmed = value.trim();
  return LEGACY_LOCAL_ENV_VALUES[key]?.[trimmed] ?? value;
}

function readDotEnvValues(): RuntimeEnvValues {
  if (!fs.existsSync(ENV_PATH)) {
    return {};
  }

  return pickKnownEnv(parse(fs.readFileSync(ENV_PATH, "utf8")));
}
