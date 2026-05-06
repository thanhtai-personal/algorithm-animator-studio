export type Lang = "en" | "vi";

export const STRINGS = {
  appTitle: { en: "AlgoShorts Studio", vi: "AlgoShorts Studio" },
  tagline: {
    en: "Create algorithm videos for TikTok / Reels / Shorts",
    vi: "Tạo video thuật toán cho TikTok / Reels / Shorts",
  },
  algorithm: { en: "Algorithm", vi: "Thuật toán" },
  inputArr: { en: "Input array (empty = random)", vi: "Mảng input (để trống = ngẫu nhiên)" },
  randomSize: { en: "Random size", vi: "Kích thước ngẫu nhiên" },
  newArray: { en: "New array", vi: "Tạo mảng mới" },
  target: { en: "Search target", vi: "Giá trị cần tìm" },
  codeJs: { en: "Algorithm code (JS)", vi: "Code thuật toán (JS)" },
  showCodeInVideo: { en: "Show code in video", vi: "Hiện code trong video" },
  variables: { en: "Variables", vi: "Variables" },
  play: { en: "Play", vi: "Phát" },
  pause: { en: "Pause", vi: "Tạm dừng" },
  exportVideo: { en: "Export video", vi: "Xuất video" },
  exporting: { en: "Exporting", vi: "Đang xuất" },
  speed: { en: "Speed", vi: "Tốc độ" },
  ui: { en: "Appearance", vi: "Giao diện" },
  motion: { en: "Export", vi: "Xuất" },
  audio: { en: "Audio", vi: "Âm thanh" },
  title: { en: "Title", vi: "Tiêu đề" },
  subtitle: { en: "Subtitle", vi: "Phụ đề" },
  fps: { en: "FPS", vi: "FPS" },
  platform: { en: "Platform / Aspect", vi: "Nền tảng / Tỉ lệ" },
  format: { en: "Format", vi: "Định dạng" },
  exportNote: {
    en: "Real-time render via MediaRecorder; takes ~ video length.",
    vi: "Export render real-time qua MediaRecorder, sẽ mất ~ thời gian video.",
  },
  videoIncludes: {
    en: "Video exports include chart and code panel.",
    vi: "Video xuất bao gồm chart và panel code.",
  },
  sfxCompare: { en: "SFX on compare (optional)", vi: "SFX khi so sánh (tuỳ chọn)" },
  sfxSwap: { en: "SFX on swap", vi: "SFX khi swap cột" },
  bgMusic: { en: "Background music", vi: "Nhạc nền" },
  uploadMusic: { en: "Upload background music (.mp3/.wav)", vi: "Upload nhạc nền (.mp3/.wav)" },
  audioInVideo: { en: "Audio is embedded into the exported video.", vi: "Âm thanh sẽ được nhúng vào video khi xuất." },
  test: { en: "Test", vi: "Thử" },
  off: { en: "Off", vi: "Tắt" },
  none: { en: "None", vi: "Không" },
  language: { en: "Language", vi: "Ngôn ngữ" },
  exportDone: { en: "Video exported!", vi: "Đã xuất video!" },
  unsupportedExport: { en: "Browser does not support export", vi: "Trình duyệt không hỗ trợ xuất video" },
  customCodeHint: { en: "Available: arr, n, vis", vi: "Có sẵn: arr, n, vis" },
} as const;

export type StringKey = keyof typeof STRINGS;
export const t = (lang: Lang, k: StringKey) => STRINGS[k][lang];

export const PLATFORMS = [
  { id: "tiktok", label: "TikTok 9:16 (1080×1920)", w: 1080, h: 1920 },
  { id: "reel", label: "Facebook Reel 9:16 (1080×1920)", w: 1080, h: 1920 },
  { id: "shorts", label: "YouTube Shorts 9:16 (1080×1920)", w: 1080, h: 1920 },
  { id: "square", label: "Square 1:1 (1080×1080)", w: 1080, h: 1080 },
  { id: "landscape", label: "Landscape 16:9 (1920×1080)", w: 1920, h: 1080 },
] as const;

export const SFX_OPTIONS = [
  { id: "off", label: { en: "Off", vi: "Tắt" } },
  { id: "pop", label: { en: "Pop", vi: "Pop" } },
  { id: "click", label: { en: "Click", vi: "Click" } },
  { id: "beep", label: { en: "Beep", vi: "Beep" } },
] as const;
