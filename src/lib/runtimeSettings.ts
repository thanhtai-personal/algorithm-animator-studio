export type RuntimeSettings = {
  MODEL_DIR?: string;
  PIPER_EXE?: string;
  SERVER_DATA_DIR?: string;
  MUSIC_LIBRARY_DIR?: string;
  AI_SHORTS_API_URL?: string;
  AI_AGENT_TEXT_MODEL?: string;
  AI_SHORTS_API_KEY?: string;
  AI_AGENT_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_CHAT_MODEL?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICES?: string;
  SUPERTONIC_BASE_URL?: string;
  SUPERTONIC_MODEL?: string;
  SUPERTONIC_HEALTH_ENDPOINT?: string;
  SUPERTONIC_STYLES_ENDPOINT?: string;
  SUPERTONIC_IMPORT_STYLE_ENDPOINT?: string;
  SUPERTONIC_TTS_ENDPOINT?: string;
  VIENEU_PYTHON?: string;
  VIENEU_MODE?: string;
  VIENEU_EMOTION?: string;
  VIENEU_DEFAULT_VOICE_ID?: string;
  VIENEU_REFERENCE_AUDIO?: string;
  VIENEU_REFERENCE_TEXT?: string;
  VIENEU_REMOTE_API_BASE?: string;
  VIENEU_REMOTE_MODEL?: string;
  VIENEU_TIMEOUT_MS?: string;
  RVC_APPLIO_BASE_URL?: string;
  RVC_APPLIO_START_COMMAND?: string;
  RVC_APPLIO_API_NAME?: string;
  RVC_APPLIO_PYTHON?: string;
  YOUTUBE_TOOLS_PYTHON?: string;
  YOUTUBE_DLP_EXE?: string;
  WHISPER_EXE?: string;
  YOUTUBE_TRANSCRIPT_MODEL?: string;
  YOUTUBE_TRANSCRIPT_LANGUAGE?: string;
};

const STORAGE_KEY = "algo.runtimeSettings";
const KNOWN_KEYS = ["MODEL_DIR", "PIPER_EXE", "SERVER_DATA_DIR", "MUSIC_LIBRARY_DIR", "AI_SHORTS_API_URL", "AI_AGENT_TEXT_MODEL", "AI_SHORTS_API_KEY", "AI_AGENT_PROVIDER", "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_CHAT_MODEL", "ELEVENLABS_API_KEY", "ELEVENLABS_VOICES", "SUPERTONIC_BASE_URL", "SUPERTONIC_MODEL", "SUPERTONIC_HEALTH_ENDPOINT", "SUPERTONIC_STYLES_ENDPOINT", "SUPERTONIC_IMPORT_STYLE_ENDPOINT", "SUPERTONIC_TTS_ENDPOINT", "VIENEU_PYTHON", "VIENEU_MODE", "VIENEU_EMOTION", "VIENEU_DEFAULT_VOICE_ID", "VIENEU_REFERENCE_AUDIO", "VIENEU_REFERENCE_TEXT", "VIENEU_REMOTE_API_BASE", "VIENEU_REMOTE_MODEL", "VIENEU_TIMEOUT_MS", "RVC_APPLIO_BASE_URL", "RVC_APPLIO_START_COMMAND", "RVC_APPLIO_API_NAME", "RVC_APPLIO_PYTHON", "YOUTUBE_TOOLS_PYTHON", "YOUTUBE_DLP_EXE", "WHISPER_EXE", "YOUTUBE_TRANSCRIPT_MODEL", "YOUTUBE_TRANSCRIPT_LANGUAGE"] as const;

type RuntimeSettingKey = typeof KNOWN_KEYS[number];

export function getRuntimeSettings(): RuntimeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return sanitizeRuntimeSettings(parsed);
  } catch {
    return {};
  }
}

export function saveRuntimeSettings(settings: RuntimeSettings) {
  const sanitized = sanitizeRuntimeSettings(settings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  window.dispatchEvent(new CustomEvent("algo:runtime-settings-change", { detail: sanitized }));
  return sanitized;
}

export function clearRuntimeSettings() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("algo:runtime-settings-change", { detail: {} }));
}

export function buildRuntimeSettingsHeaders(extra?: HeadersInit): HeadersInit {
  const headers = new Headers(extra);
  const settings = getRuntimeSettings();
  if (Object.keys(settings).length > 0) {
    headers.set("X-Kata-Settings", encodeBase64Url(JSON.stringify(settings)));
  }
  return headers;
}

export function getRuntimeSettingsToken() {
  const settings = getRuntimeSettings();
  return Object.keys(settings).length > 0 ? encodeBase64Url(JSON.stringify(settings)) : "";
}

function sanitizeRuntimeSettings(values: Record<string, unknown>): RuntimeSettings {
  const output: RuntimeSettings = {};
  for (const key of KNOWN_KEYS) {
    const value = values[key as RuntimeSettingKey];
    if (typeof value === "string" && value.trim()) {
      output[key] = value.trim();
    }
  }
  return output;
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
