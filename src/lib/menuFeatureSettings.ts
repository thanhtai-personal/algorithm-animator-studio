export type MenuFeatureId =
  | "algorithm-studio"
  | "maze-pathfinding"
  | "algorithm-long"
  | "github-trending"
  | "football-commentary"
  | "story-studio"
  | "story-author"
  | "story-review"
  | "common-video"
  | "text-to-speech"
  | "youtube-tools"
  | "jobs"
  | "channel"
  | "assets";

export type MenuFeatureSettings = Record<MenuFeatureId, boolean>;

export const MENU_FEATURE_SETTINGS_EVENT = "kai-studio:menu-feature-settings-change";
const STORAGE_KEY = "kai-studio.menuFeatureSettings";

export const DEFAULT_MENU_FEATURE_SETTINGS: MenuFeatureSettings = {
  "algorithm-studio": false,
  "maze-pathfinding": false,
  "algorithm-long": false,
  "github-trending": false,
  "football-commentary": false,
  "story-studio": false,
  "story-author": false,
  "story-review": false,
  "common-video": true,
  "text-to-speech": true,
  "youtube-tools": true,
  jobs: true,
  channel: false,
  assets: true,
};

export const MENU_FEATURE_LABELS: Record<MenuFeatureId, { en: string; vi: string }> = {
  "algorithm-studio": {
    en: "Algorithm Video",
    vi: "Video thuật toán",
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
  "football-commentary": {
    en: "Football Commentary",
    vi: "Bình luận bóng đá",
  },
  "story-studio": {
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
  "common-video": {
    en: "Create Video",
    vi: "Tạo video",
  },
  "text-to-speech": {
    en: "Text to Speech",
    vi: "Text to Speech",
  },
  "youtube-tools": {
    en: "YouTube Tools",
    vi: "Tải YouTube",
  },
  jobs: {
    en: "Job Manager",
    vi: "Quản lý job",
  },
  channel: {
    en: "Channel Manager",
    vi: "Quản lý kênh",
  },
  assets: {
    en: "Files Management",
    vi: "Quản lý file",
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
    if (typeof values[key] === "boolean") output[key] = values[key];
  }
  if (hasLegacyKeys(values, ["algorithm-shorts", "algorithm-agentic", "algorithm-manual"])) {
    output["algorithm-studio"] = legacyAnyEnabled(values, ["algorithm-shorts", "algorithm-agentic", "algorithm-manual"]);
  }
  if (hasLegacyKeys(values, ["story-video", "story-agentic", "story-manual"])) {
    output["story-studio"] = legacyAnyEnabled(values, ["story-video", "story-agentic", "story-manual"]);
  }
  if (hasLegacyKeys(values, ["common-video-agentic", "common-video-manual"])) {
    output["common-video"] = legacyAnyEnabled(values, ["common-video-agentic", "common-video-manual"]);
  }
  if (hasLegacyKeys(values, ["football-agentic", "football-manual", "mu-news"])) {
    output["football-commentary"] = legacyAnyEnabled(values, ["football-agentic", "football-manual", "mu-news"]);
  }
  return output;
}

function hasLegacyKeys(values: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => typeof values[key] === "boolean");
}

function legacyAnyEnabled(values: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => values[key] === true);
}
