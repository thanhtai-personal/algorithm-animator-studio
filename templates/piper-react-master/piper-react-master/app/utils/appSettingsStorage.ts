import { API_URL } from "../config/env";
import {
  APP_SETTING_KEYS,
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_APP_SETTINGS,
  SENSITIVE_APP_SETTING_KEYS,
} from "../constants/appSettings";

type SettingsRecord = Record<string, string>;

const LEGACY_LOCAL_URL_VALUES: Record<string, Record<string, string>> = {
  CLIENT_ORIGIN: { "http://localhost:5173": "http://localhost:6868", "http://localhost:6666": "http://localhost:6868", "http://localhost:6677": "http://localhost:6868" },
  VITE_CLIENT_ORIGIN: { "http://localhost:5173": "http://localhost:6868", "http://localhost:6666": "http://localhost:6868", "http://localhost:6677": "http://localhost:6868" },
  SERVER_ORIGIN: { "http://localhost:5050": "http://localhost:8888" },
  VITE_API_URL: { "http://localhost:5050": "http://localhost:8888" },
  YOUTUBE_REDIRECT_URI: { "http://localhost:5173/youtube": "http://localhost:6868/youtube", "http://localhost:6666/youtube": "http://localhost:6868/youtube", "http://localhost:6677/youtube": "http://localhost:6868/youtube" },
};

export function getStoredAppSettings(): SettingsRecord {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function getEffectiveAppSettings(): SettingsRecord {
  return {
    ...DEFAULT_APP_SETTINGS,
    ...getStoredAppSettings(),
  };
}

export function saveAppSettings(settings: SettingsRecord) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    APP_SETTINGS_STORAGE_KEY,
    JSON.stringify(sanitizeSettings(settings))
  );
}

export function resetAppSettings() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(APP_SETTINGS_STORAGE_KEY);
}

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Bản Electron chạy client riêng ở port 6868 và backend API riêng ở port 8888.
  // Vì vậy không được dùng relative URL /api/... theo origin 6868; phải gọi thẳng backend.
  const baseUrl = isDesktopRuntime() ? API_URL : getEffectiveAppSettings().VITE_API_URL || API_URL;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}${normalizedPath}`;
}

function isDesktopRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.navigator.userAgent.toLowerCase().includes("electron");
}

export function getRuntimeSettingsHeaders(): HeadersInit {
  const storedSettings = getStoredAppSettings();
  const transportSettings = Object.fromEntries(
    Object.entries(storedSettings).filter(([key, value]) => {
      if (!APP_SETTING_KEYS.includes(key)) {
        return false;
      }

      if (SENSITIVE_APP_SETTING_KEYS.has(key) && !String(value).trim()) {
        return false;
      }

      return true;
    })
  );

  if (!Object.keys(transportSettings).length) {
    return {};
  }

  return {
    "X-Kata-Settings": encodeSettingsHeader(transportSettings),
  };
}

export function withRuntimeSettingsHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    ...getRuntimeSettingsHeaders(),
  };
}

function sanitizeSettings(input: unknown): SettingsRecord {
  if (!input || typeof input !== "object") {
    return {};
  }

  const output: SettingsRecord = {};
  const source = input as Record<string, unknown>;

  for (const key of APP_SETTING_KEYS) {
    const value = source[key];
    if (value === undefined || value === null) {
      continue;
    }
    output[key] = normalizeLegacySettingValue(key, String(value));
  }

  return output;
}

function normalizeLegacySettingValue(key: string, value: string): string {
  const trimmed = value.trim();
  return LEGACY_LOCAL_URL_VALUES[key]?.[trimmed] ?? value;
}

function encodeSettingsHeader(settings: SettingsRecord): string {
  const json = JSON.stringify(settings);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
