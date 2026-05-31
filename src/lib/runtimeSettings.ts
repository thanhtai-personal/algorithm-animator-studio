export type RuntimeSettings = {
  MODEL_DIR?: string;
  PIPER_EXE?: string;
  MUSIC_LIBRARY_DIR?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICES?: string;
};

const STORAGE_KEY = "algo.runtimeSettings";
const KNOWN_KEYS = ["MODEL_DIR", "PIPER_EXE", "MUSIC_LIBRARY_DIR", "ELEVENLABS_API_KEY", "ELEVENLABS_VOICES"] as const;

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
