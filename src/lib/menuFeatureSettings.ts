export type MenuFeatureId =
  | "algorithm-studio"
  | "maze-pathfinding"
  | "algorithm-long"
  | "text-to-speech"
  | "assets";

export type MenuFeatureSettings = Record<MenuFeatureId, boolean>;

export const MENU_FEATURE_SETTINGS_EVENT = "kai-studio:menu-feature-settings-change";

// Fresh OSS namespace: legacy channel flags must not hide algorithm/TTS on first run.
const STORAGE_KEY = "algorithm-animator.oss.menuFeatures.v1";

export const DEFAULT_MENU_FEATURE_SETTINGS: MenuFeatureSettings = {
  "algorithm-studio": true,
  "maze-pathfinding": true,
  "algorithm-long": true,
  "text-to-speech": true,
  "assets": true,
};

export const MENU_FEATURE_LABELS: Record<MenuFeatureId, { en: string; vi: string }> = {
  "algorithm-studio": { en: "Algorithm Animation", vi: "Video thuật toán" },
  "maze-pathfinding": { en: "Maze Pathfinding", vi: "Tìm đường mê cung" },
  "algorithm-long": { en: "Algorithm Long Video", vi: "Video thuật toán dài" },
  "text-to-speech": { en: "Text to Speech", vi: "Chuyển văn bản thành giọng nói" },
  "assets": { en: "Generated Files", vi: "Tệp đã tạo" },
};

export function getMenuFeatureSettings(): MenuFeatureSettings {
  if (typeof window === "undefined") return { ...DEFAULT_MENU_FEATURE_SETTINGS };
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as unknown;
    return sanitizeMenuFeatureSettings(stored);
  } catch {
    return { ...DEFAULT_MENU_FEATURE_SETTINGS };
  }
}

export function saveMenuFeatureSettings(settings: MenuFeatureSettings): MenuFeatureSettings {
  const sanitized = sanitizeMenuFeatureSettings(settings);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  window.dispatchEvent(new CustomEvent(MENU_FEATURE_SETTINGS_EVENT, { detail: sanitized }));
  return sanitized;
}

export function clearMenuFeatureSettings(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(MENU_FEATURE_SETTINGS_EVENT, {
    detail: { ...DEFAULT_MENU_FEATURE_SETTINGS },
  }));
}

export function subscribeMenuFeatureSettings(listener: (settings: MenuFeatureSettings) => void): () => void {
  const handleChange = (event: Event) => {
    listener(
      event instanceof CustomEvent && event.detail
        ? sanitizeMenuFeatureSettings(event.detail)
        : getMenuFeatureSettings(),
    );
  };
  window.addEventListener(MENU_FEATURE_SETTINGS_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(MENU_FEATURE_SETTINGS_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function sanitizeMenuFeatureSettings(values: unknown): MenuFeatureSettings {
  const defaults = { ...DEFAULT_MENU_FEATURE_SETTINGS };
  if (!values || typeof values !== "object") return defaults;
  const options = values as Record<string, unknown>;
  for (const key of Object.keys(defaults) as MenuFeatureId[]) {
    if (typeof options[key] === "boolean") defaults[key] = options[key];
  }
  return defaults;
}
