export type RuntimeSettings = {
  MODEL_DIR?: string;
  PIPER_EXE?: string;
  SERVER_DATA_DIR?: string;
  MUSIC_LIBRARY_DIR?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICES?: string;
  SUPERTONIC_BASE_URL?: string;
  SUPERTONIC_MODEL?: string;
  SUPERTONIC_DEFAULT_VOICE?: string;
  SUPERTONIC_TOTAL_STEPS?: string;
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
  RVC_APPLIO_SOURCE_PIPER_MODEL?: string;
  RVC_APPLIO_MODEL_NAME?: string;
  RVC_APPLIO_INDEX_PATH?: string;
  RVC_APPLIO_PITCH?: string;
  RVC_APPLIO_F0_METHOD?: string;
  RVC_APPLIO_INDEX_RATE?: string;
  RVC_APPLIO_PROTECT?: string;
  RVC_APPLIO_FILTER_RADIUS?: string;
};

const STORAGE_KEY = "algo.runtimeSettings";
const KNOWN_KEYS = ["MODEL_DIR", "PIPER_EXE", "SERVER_DATA_DIR", "MUSIC_LIBRARY_DIR", "ELEVENLABS_API_KEY", "ELEVENLABS_VOICES", "SUPERTONIC_BASE_URL", "SUPERTONIC_MODEL", "SUPERTONIC_DEFAULT_VOICE", "SUPERTONIC_TOTAL_STEPS", "VIENEU_PYTHON", "VIENEU_MODE", "VIENEU_EMOTION", "VIENEU_DEFAULT_VOICE_ID", "VIENEU_REFERENCE_AUDIO", "VIENEU_REFERENCE_TEXT", "VIENEU_REMOTE_API_BASE", "VIENEU_REMOTE_MODEL", "VIENEU_TIMEOUT_MS", "RVC_APPLIO_BASE_URL", "RVC_APPLIO_START_COMMAND", "RVC_APPLIO_API_NAME", "RVC_APPLIO_PYTHON", "RVC_APPLIO_SOURCE_PIPER_MODEL", "RVC_APPLIO_MODEL_NAME", "RVC_APPLIO_INDEX_PATH", "RVC_APPLIO_PITCH", "RVC_APPLIO_F0_METHOD", "RVC_APPLIO_INDEX_RATE", "RVC_APPLIO_PROTECT", "RVC_APPLIO_FILTER_RADIUS"] as const;

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
