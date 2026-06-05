export type Lang = "en" | "vi";

export const SYSTEM_LANG_STORAGE_KEY = "algoshorts.systemLanguage";
export const SYSTEM_LANG_CHANGE_EVENT = "algoshorts:system-language-change";

export function normalizeLang(value: unknown, fallback: Lang = "en"): Lang {
  return value === "vi" || value === "en" ? value : fallback;
}

export function readSystemLang(fallback: Lang = "en"): Lang {
  if (typeof window === "undefined") return fallback;
  return normalizeLang(window.localStorage.getItem(SYSTEM_LANG_STORAGE_KEY), fallback);
}

export function writeSystemLang(lang: Lang) {
  if (typeof window === "undefined") return;
  const nextLang = normalizeLang(lang);
  window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, nextLang);
  window.dispatchEvent(new CustomEvent(SYSTEM_LANG_CHANGE_EVENT, { detail: nextLang }));
}

export function subscribeSystemLang(listener: (lang: Lang) => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === SYSTEM_LANG_STORAGE_KEY) listener(normalizeLang(event.newValue));
  };
  const onCustom = (event: Event) => {
    listener(normalizeLang((event as CustomEvent<Lang>).detail));
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(SYSTEM_LANG_CHANGE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SYSTEM_LANG_CHANGE_EVENT, onCustom);
  };
}


export const STRINGS = {
  appTitle: { en: "KAI STUDIO", vi: "KAI STUDIO" },
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
  bgMusicPreset: { en: "Music preset", vi: "Nhạc nền có sẵn" },
  uploadMusic: { en: "Upload background music (.mp3/.wav)", vi: "Upload nhạc nền (.mp3/.wav)" },
  audioInVideo: { en: "Audio is embedded into the exported video.", vi: "Âm thanh sẽ được nhúng vào video khi xuất." },
  test: { en: "Test", vi: "Thử" },
  off: { en: "Off", vi: "Tắt" },
  none: { en: "None", vi: "Không" },
  language: { en: "Language", vi: "Ngôn ngữ" },
  exportDone: { en: "Video exported!", vi: "Đã xuất video!" },
  unsupportedExport: { en: "Browser does not support export", vi: "Trình duyệt không hỗ trợ xuất video" },
  customCodeHint: { en: "Available: arr, n, vis", vi: "Có sẵn: arr, n, vis" },
  settingsTitle: { en: "Settings", vi: "Cài đặt" },
  settingsSave: { en: "Save settings", vi: "Lưu settings" },
  settingsCheckAgain: { en: "Check again", vi: "Kiểm tra lại" },
  settingsClearOverrides: { en: "Reset", vi: "Đặt lại" },
  settingsVoiceTab: { en: "Voice", vi: "Voice" },
  settingsDataTab: { en: "Data", vi: "Data" },
  settingsApiKeyTab: { en: "API Key", vi: "API Key" },
  settingsHealthCheckTab: { en: "Health Check", vi: "Health Check" },
  settingsModelDirLabel: { en: "Model directory", vi: "Thư mục model" },
  settingsPiperExeLabel: { en: "Piper executable", vi: "Tệp chạy Piper" },
  settingsElevenLabsVoicesLabel: { en: "ElevenLabs voices", vi: "Danh sách giọng ElevenLabs" },
  settingsSupertonicDefaultVoiceLabel: { en: "Supertonic default voice", vi: "Giọng Supertonic mặc định" },
  settingsSupertonicTotalStepsLabel: { en: "Supertonic total steps", vi: "Số bước Supertonic" },
  settingsServerDataDirLabel: { en: "Generated data directory", vi: "Thư mục dữ liệu được tạo" },
  settingsMusicLibraryDirLabel: { en: "Music library directory", vi: "Thư mục thư viện nhạc" },
  settingsElevenLabsApiKeyLabel: { en: "ElevenLabs API key", vi: "API key ElevenLabs" },
  settingsSupertonicBaseUrlLabel: { en: "Supertonic base URL", vi: "URL gốc Supertonic" },
  settingsSupertonicModelLabel: { en: "Supertonic model", vi: "Model Supertonic" },
  settingsVoiceDescription: {
    en: "Piper paths, voice mapping, and default voice settings.",
    vi: "Đường dẫn Piper, voice mapping và thông số voice mặc định.",
  },
  settingsModelDirDescription: {
    en: "Folder containing .onnx and .onnx.json model files.",
    vi: "Thư mục chứa các file model .onnx và .onnx.json.",
  },
  settingsSelectPiperModelsFolder: { en: "Select the Piper models folder", vi: "Chọn thư mục chứa Piper models" },
  settingsPiperExeDescription: {
    en: "Path to piper.exe, for example models/.venv/Scripts/piper.exe.",
    vi: "Đường dẫn tới piper.exe, ví dụ models/.venv/Scripts/piper.exe.",
  },
  settingsSelectPiperExe: { en: "Select piper.exe", vi: "Chọn piper.exe" },
  settingsDefaultVoiceDescription: {
    en: "Default voice, for example M1/F1 or an imported custom voice.",
    vi: "Voice mặc định, ví dụ M1/F1 hoặc custom voice đã import.",
  },
  settingsTotalStepsDescription: { en: "Quality from 5-12, default 8.", vi: "Chất lượng 5-12, mặc định 8." },
  settingsDataDescription: {
    en: "Configure where app-generated data and the background music library are stored.",
    vi: "Cấu hình nơi lưu dữ liệu được tạo bởi app và thư viện nhạc nền.",
  },
  settingsServerDataDirDescription: {
    en: "Root folder for files generated by the app, including audio, previews, videos, and rendered background music.",
    vi: "Thư mục gốc để lưu các file app tạo ra như audio, preview, video và background music đã render.",
  },
  settingsSelectGeneratedDataFolder: { en: "Select the generated data folder", vi: "Chọn thư mục lưu dữ liệu được tạo" },
  settingsMusicLibraryDirDescription: {
    en: "Folder containing the background music library. Each track should be in its own folder, with License.txt when YouTube credit is needed.",
    vi: "Thư mục chứa thư viện nhạc nền. Mỗi track nằm trong một folder riêng, kèm License.txt nếu cần ghi credit YouTube.",
  },
  settingsSelectMusicLibraryFolder: { en: "Select the background music library folder", vi: "Chọn thư mục thư viện nhạc nền" },
  settingsApiKeyDescription: {
    en: "API keys and connection settings for local/cloud voice providers.",
    vi: "API key và cấu hình kết nối tới các voice provider local/cloud.",
  },
  settingsElevenLabsApiKeyDescription: {
    en: "API key for ElevenLabs PRO. The value is stored locally in the browser and sent to the backend through runtime headers.",
    vi: "API key dùng cho ElevenLabs PRO. Giá trị lưu local trong trình duyệt và gửi tới backend qua runtime header.",
  },
  settingsSupertonicBaseUrlDescription: {
    en: "URL of the local Supertonic server, default http://127.0.0.1:6688.",
    vi: "URL của Supertonic local server, mặc định http://127.0.0.1:6688.",
  },
  settingsSupertonicModelDescription: {
    en: "Supertonic model to use, for example supertonic-3.",
    vi: "Model Supertonic cần dùng, ví dụ supertonic-3.",
  },
  settingsHealthDescription: {
    en: "Check the local backend, piper.exe, voice services, and available models.",
    vi: "Kiểm tra backend local, piper.exe, voice services và danh sách model hiện có.",
  },
  settingsConnected: { en: "Connected", vi: "Đã kết nối" },
  settingsNotChecked: { en: "Not checked", vi: "Chưa kiểm tra" },
  settingsModelsReady: { en: "models ready", vi: "model sẵn sàng" },
  settingsVoicesConfigured: { en: "voices configured", vi: "voice đã cấu hình" },
  settingsNoApiKey: { en: "No API key", vi: "Chưa có API key" },
  settingsServerNotRunning: { en: "Server is not running", vi: "Chưa chạy server" },
  settingsGeneratedData: { en: "Generated data", vi: "Generated data" },
  settingsActiveModelDir: { en: "Active model directory", vi: "Thư mục model đang dùng" },
  settingsReady: { en: "Ready", vi: "Sẵn sàng" },
  settingsMissing: { en: "Missing", vi: "Thiếu" },
  settingsSelect: { en: "Select", vi: "Chọn" },
  settingsOpen: { en: "Open", vi: "Mở" },
  settingsElevenLabsVoicesDescription: {
    en: "Declare the voices that appear in the ElevenLabs dropdown.",
    vi: "Khai báo các voice sẽ xuất hiện trong dropdown ElevenLabs.",
  },
  settingsAddVoice: { en: "Add voice", vi: "Thêm voice" },
  settingsRemove: { en: "Remove", vi: "Xóa" },
  settingsMainVoice: { en: "Main voice", vi: "Giọng đọc chính" },
  settingsRemoveVoice: { en: "Remove voice", vi: "Xóa voice" },
  settingsNoVoices: {
    en: "No voices yet. Click Add voice to enter a Voice ID.",
    vi: "Chưa có voice. Bấm Thêm voice để nhập Voice ID.",
  },
  settingsCheck: { en: "Check", vi: "Kiểm tra" },
  settingsCouldNotCheckPiper: { en: "Could not check Piper.", vi: "Không kiểm tra được Piper." },
  settingsRuntimeSaved: { en: "Runtime settings saved.", vi: "Đã lưu settings runtime." },
  settingsOverridesCleared: {
    en: "Local runtime overrides cleared. The app will use .env/default values.",
    vi: "Đã xoá cấu hình runtime local. App sẽ dùng .env/default.",
  },
  settingsOpeningPathPicker: { en: "Opening path picker...", vi: "Đang mở hộp chọn đường dẫn..." },
  settingsPathSelected: { en: "Path selected.", vi: "Đã chọn đường dẫn." },
  settingsCouldNotSelectPath: { en: "Could not select the path.", vi: "Không chọn được đường dẫn." },
  settingsCouldNotOpenFolder: { en: "Could not open the folder.", vi: "Không mở được Explorer." },
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
  { id: "off",     label: { en: "Off",     vi: "Tắt" } },
  { id: "pop",     label: { en: "Pop",     vi: "Pop" } },
  { id: "click",   label: { en: "Click",   vi: "Click" } },
  { id: "beep",    label: { en: "Beep",    vi: "Beep" } },
  { id: "marimba", label: { en: "Marimba", vi: "Marimba" } },
  { id: "piano",   label: { en: "Piano",   vi: "Piano" } },
  { id: "key",     label: { en: "Keyboard",vi: "Phím" } },
  { id: "retro",   label: { en: "Retro 8-bit", vi: "Retro 8-bit" } },
  { id: "blip",    label: { en: "Blip",    vi: "Blip" } },
  { id: "swap-snap", label: { en: "Swap Snap", vi: "Swap Snap" } },
  { id: "swap-whoosh", label: { en: "Swap Whoosh", vi: "Swap Whoosh" } },
  { id: "swap-tick", label: { en: "Swap Double Tick", vi: "Swap Double Tick" } },
  { id: "swap-punch", label: { en: "Swap Punch", vi: "Swap Punch" } },
  { id: "swap-spark", label: { en: "Swap Spark", vi: "Swap Spark" } },
] as const;

export const MUSIC_PRESETS = [
  { id: "off",     label: { en: "Off",                 vi: "Tắt" } },
  { id: "lofi",    label: { en: "Lo-Fi Chill",         vi: "Lo-Fi Chill" } },
  { id: "ambient", label: { en: "Ambient Calm",        vi: "Ambient nhẹ nhàng" } },
  { id: "chill",   label: { en: "Chill Beats",         vi: "Chill Beats" } },
  { id: "upbeat",  label: { en: "Upbeat Pop",          vi: "Upbeat Pop" } },
  { id: "custom",  label: { en: "Custom (uploaded)",   vi: "Tự upload" } },
] as const;
