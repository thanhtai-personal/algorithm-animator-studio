export type MenuFeatureId =
  | "algorithm-shorts"
  | "maze-pathfinding"
  | "algorithm-long"
  | "github-trending"
  | "story-video"
  | "story-author"
  | "story-review"
  | "mu-news"
  | "channel";

export type MenuFeatureSettings = Record<MenuFeatureId, boolean>;

export const MENU_FEATURE_SETTINGS_EVENT = "kai-studio:menu-feature-settings-change";
const STORAGE_KEY = "kai-studio.menuFeatureSettings";

export const DEFAULT_MENU_FEATURE_SETTINGS: MenuFeatureSettings = {
  "algorithm-shorts": false,
  "maze-pathfinding": false,
  "algorithm-long": false,
  "github-trending": false,
  "story-video": false,
  "story-author": false,
  "story-review": false,
  "mu-news": false,
  channel: false,
};

export const MENU_FEATURE_LABELS: Record<MenuFeatureId, { en: string; vi: string }> = {
  "algorithm-shorts": {
    en: "Algorithm Shorts",
    vi: "Short thuật toán",
  },
  "maze-pathfinding": {
    en: "Maze Pathfinding",
    vi: "Tìm đường mê cung",
  },
  "algorithm-long": {
    en: "Algorithm Long",
    vi: "Video thuật toán dài",
  },
  "github-trending": {
    en: "GitHub Trend Video",
    vi: "Video GitHub trend",
  },
  "story-video": {
    en: "Story Video",
    vi: "Video truyện",
  },
  "story-author": {
    en: "Story Author",
    vi: "Sáng tác truyện",
  },
  "story-review": {
    en: "Story Review",
    vi: "Review truyện",
  },
  "mu-news": {
    en: "MU News",
    vi: "Tin tức MU",
  },
  channel: {
    en: "Channel Manager",
    vi: "Quản lý kênh",
  },
};

export function getMenuFeatureSettings(): MenuFeatureSettings {
  if (typeof window === "undefined") return { ...DEFAULT_MENU_FEATURE_SETTINGS };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, unknown>;
    return sanitizeMenuFeatureSettings(parsed);
  } catch {
    return { ...DEFAULT_MENU_FEATURE_SETTINGS };
  }
}

export function saveMenuFeatureSettings(settings: MenuFeatureSettings) {
  const sanitized = sanitizeMenuFeatureSettings(settings);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  window.dispatchEvent(new CustomEvent(MENU_FEATURE_SETTINGS_EVENT, { detail: sanitized }));
  return sanitized;
}

export function clearMenuFeatureSettings() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(MENU_FEATURE_SETTINGS_EVENT, { detail: { ...DEFAULT_MENU_FEATURE_SETTINGS } }));
}

export function subscribeMenuFeatureSettings(listener: (settings: MenuFeatureSettings) => void) {
  const handleChange = (event: Event) => {
    listener(event instanceof CustomEvent && event.detail ? sanitizeMenuFeatureSettings(event.detail) : getMenuFeatureSettings());
  };
  window.addEventListener(MENU_FEATURE_SETTINGS_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(MENU_FEATURE_SETTINGS_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function sanitizeMenuFeatureSettings(values: Record<string, unknown>): MenuFeatureSettings {
  const output = { ...DEFAULT_MENU_FEATURE_SETTINGS };
  for (const key of Object.keys(output) as MenuFeatureId[]) {
    output[key] = values[key] === true;
  }
  return output;
}
