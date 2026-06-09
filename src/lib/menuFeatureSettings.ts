export type MenuFeatureId =
  | "algorithm-shorts"
  | "maze-pathfinding"
  | "algorithm-long"
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
  "story-video": false,
  "story-author": false,
  "story-review": false,
  "mu-news": false,
  channel: false,
};

export const MENU_FEATURE_LABELS: Record<MenuFeatureId, { en: string; vi: string; descriptionEn: string; descriptionVi: string }> = {
  "algorithm-shorts": {
    en: "Algorithm Shorts",
    vi: "Short thuật toán",
    descriptionEn: "Short-form algorithm video studio.",
    descriptionVi: "Màn hình sản xuất video ngắn thuật toán.",
  },
  "maze-pathfinding": {
    en: "Maze Pathfinding",
    vi: "Tìm đường mê cung",
    descriptionEn: "Maze/pathfinding race content studio.",
    descriptionVi: "Màn hình sản xuất nội dung đua tìm đường mê cung.",
  },
  "algorithm-long": {
    en: "Algorithm Long",
    vi: "Video thuật toán dài",
    descriptionEn: "Long-form algorithm explainer studio.",
    descriptionVi: "Màn hình sản xuất video dài giải thích thuật toán.",
  },
  "story-video": {
    en: "Story Video",
    vi: "Video truyện",
    descriptionEn: "Story video production workflow.",
    descriptionVi: "Màn hình sản xuất video truyện.",
  },
  "story-author": {
    en: "Story Author",
    vi: "Sáng tác truyện",
    descriptionEn: "Story writing and chapter drafting workflow.",
    descriptionVi: "Màn hình sáng tác truyện và soạn chương.",
  },
  "story-review": {
    en: "Story Review",
    vi: "Review truyện",
    descriptionEn: "Story review script and video workflow.",
    descriptionVi: "Màn hình tạo review truyện.",
  },
  "mu-news": {
    en: "MU News",
    vi: "Tin tức MU",
    descriptionEn: "Football news channel workflow.",
    descriptionVi: "Màn hình build kênh tin bóng đá.",
  },
  channel: {
    en: "Channel Manager",
    vi: "Quản lý kênh",
    descriptionEn: "Social channel publishing and account manager.",
    descriptionVi: "Màn hình quản lý/publish kênh mạng xã hội.",
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
