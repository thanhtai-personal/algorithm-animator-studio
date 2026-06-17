export type MenuFeatureId =
  | "algorithm-shorts"
  | "algorithm-agentic"
  | "algorithm-manual"
  | "maze-pathfinding"
  | "algorithm-long"
  | "github-trending"
  | "football-commentary"
  | "football-agentic"
  | "football-manual"
  | "story-video"
  | "story-agentic"
  | "story-manual"
  | "story-author"
  | "story-review"
  | "common-video-agentic"
  | "common-video-manual"
  | "text-to-speech"
  | "youtube-tools"
  | "mu-news"
  | "jobs"
  | "channel"
  | "assets";

export type MenuFeatureSettings = Record<MenuFeatureId, boolean>;

export const MENU_FEATURE_SETTINGS_EVENT = "kai-studio:menu-feature-settings-change";
const STORAGE_KEY = "kai-studio.menuFeatureSettings";

export const DEFAULT_MENU_FEATURE_SETTINGS: MenuFeatureSettings = {
  "algorithm-shorts": false,
  "algorithm-agentic": false,
  "algorithm-manual": false,
  "maze-pathfinding": false,
  "algorithm-long": false,
  "github-trending": false,
  "football-commentary": false,
  "football-agentic": false,
  "football-manual": false,
  "story-video": false,
  "story-agentic": false,
  "story-manual": false,
  "story-author": false,
  "story-review": false,
  "common-video-agentic": true,
  "common-video-manual": true,
  "text-to-speech": true,
  "youtube-tools": true,
  "mu-news": false,
  jobs: true,
  channel: false,
  assets: true,
};

export const MENU_FEATURE_LABELS: Record<MenuFeatureId, { en: string; vi: string }> = {
  "algorithm-shorts": {
    en: "Algorithm Shorts",
    vi: "Short thuật toán",
  },
  "algorithm-agentic": {
    en: "Algorithm AI Agentic",
    vi: "AI Agentic thuật toán",
  },
  "algorithm-manual": {
    en: "Algorithm Manual Create",
    vi: "Tạo thuật toán thủ công",
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
  "football-agentic": {
    en: "Football AI Agentic",
    vi: "AI Agentic bóng đá",
  },
  "football-manual": {
    en: "Football Manual Create",
    vi: "Tạo bóng đá thủ công",
  },
  "story-video": {
    en: "Story Video",
    vi: "Video truyện",
  },
  "story-agentic": {
    en: "Story AI Agentic",
    vi: "AI Agentic truyện",
  },
  "story-manual": {
    en: "Story Manual Create",
    vi: "Tạo truyện thủ công",
  },
  "story-author": {
    en: "Story Author",
    vi: "Sáng tác truyện",
  },
  "story-review": {
    en: "Story Review",
    vi: "Review truyện",
  },
  "common-video-agentic": {
    en: "Common Video AI Agentic",
    vi: "AI Agentic video chung",
  },
  "common-video-manual": {
    en: "Common Video Manual Create",
    vi: "Tạo video chung thủ công",
  },
  "text-to-speech": {
    en: "Text to Speech",
    vi: "Text to Speech",
  },
  "youtube-tools": {
    en: "YouTube Tools",
    vi: "Tải YouTube",
  },
  "mu-news": {
    en: "MU News",
    vi: "Tin tức MU",
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
  if (values["football-agentic"] === true || values["football-manual"] === true || values["mu-news"] === true) {
    output["football-commentary"] = true;
  }
  return output;
}
