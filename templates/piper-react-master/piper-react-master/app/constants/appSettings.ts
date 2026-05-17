export type AppSettingGroupId =
  | "appServer"
  | "youtubeDefaults"
  | "aiShorts"
  | "elevenlabs";

export type AppSettingGroup = {
  id: AppSettingGroupId;
  title: string;
  description: string;
};

export type AppSettingDefinition = {
  key: string;
  groupId: AppSettingGroupId;
  label: string;
  description: string;
  defaultValue: string;
  placeholder?: string;
  sensitive?: boolean;
  multiline?: boolean;
  inputMode?: "text" | "password" | "url" | "number";
};

export const APP_SETTINGS_STORAGE_KEY = "kata.studio.envSettings";

export const APP_SETTING_GROUPS: AppSettingGroup[] = [
  {
    id: "appServer",
    title: "App & server",
    description: "Frontend, backend, giọng local, FFmpeg và app-server đồng bộ settings.",
  },
  {
    id: "youtubeDefaults",
    title: "YouTube defaults",
    description: "Metadata mặc định khi upload video lên YouTube.",
  },
  {
    id: "aiShorts",
    title: "Gemini Veo",
    description: "API tạo video Shorts bằng Google Gemini Veo 3.1 Fast.",
  },
  {
    id: "elevenlabs",
    title: "PRO voices / ElevenLabs",
    description: "API key, voice id và danh sách giọng đọc tính phí.",
  },
];

export const APP_SETTING_DEFINITIONS: AppSettingDefinition[] = [
  {
    key: "VITE_API_URL",
    groupId: "appServer",
    label: "VITE_API_URL",
    description: "Backend API URL mà frontend gọi. Mặc định dùng server local.",
    defaultValue: "http://localhost:8888",
    placeholder: "http://localhost:8888",
    inputMode: "url",
  },
  {
    key: "VITE_CLIENT_ORIGIN",
    groupId: "appServer",
    label: "VITE_CLIENT_ORIGIN",
    description: "Origin frontend dùng khi cần tạo URL callback.",
    defaultValue: "http://localhost:6868",
    placeholder: "http://localhost:6868",
    inputMode: "url",
  },
  {
    key: "CLIENT_ORIGIN",
    groupId: "appServer",
    label: "CLIENT_ORIGIN",
    description: "Origin frontend phía backend dùng cho OAuth và CORS logic.",
    defaultValue: "http://localhost:6868",
    placeholder: "http://localhost:6868",
    inputMode: "url",
  },
  {
    key: "SERVER_ORIGIN",
    groupId: "appServer",
    label: "SERVER_ORIGIN",
    description: "Origin backend dùng để tạo link audio/video trả về UI.",
    defaultValue: "http://localhost:8888",
    placeholder: "http://localhost:8888",
    inputMode: "url",
  },
  {
    key: "PIPER_EXE",
    groupId: "appServer",
    label: "PIPER_EXE",
    description: "Đường dẫn công cụ giọng local (piper.exe). Có thể dùng đường dẫn tương đối từ thư mục project.",
    defaultValue: "models/.venv/Scripts/piper.exe",
    placeholder: "models/.venv/Scripts/piper.exe",
  },
  {
    key: "FFMPEG_EXE",
    groupId: "appServer",
    label: "FFMPEG_EXE",
    description: "Lệnh hoặc đường dẫn FFmpeg. Nếu đã cài vào PATH thì để ffmpeg.",
    defaultValue: "ffmpeg",
    placeholder: "ffmpeg",
  },
  {
    key: "FFPROBE_EXE",
    groupId: "appServer",
    label: "FFPROBE_EXE",
    description: "Lệnh hoặc đường dẫn FFprobe. Nếu đã cài vào PATH thì để ffprobe.",
    defaultValue: "ffprobe",
    placeholder: "ffprobe",
  },
  {
    key: "SERVER_DATA_DIR",
    groupId: "appServer",
    label: "Chọn nơi app-server local lưu dữ liệu trên máy",
    description: "Dữ liệu như lịch sử upload và dữ liệu phụ trợ sẽ được lưu vào thư mục này.",
    defaultValue: "server/data",
    placeholder: "server/data hoặc D:/KataStudio/data",
  },
  {
    key: "YOUTUBE_TITLE",
    groupId: "youtubeDefaults",
    label: "YOUTUBE_TITLE",
    description: "Tiêu đề mặc định khi upload video.",
    defaultValue: "Video tạo từ Kata Studio",
    placeholder: "Video tạo từ Kata Studio",
  },
  {
    key: "YOUTUBE_DESCRIPTION",
    groupId: "youtubeDefaults",
    label: "YOUTUBE_DESCRIPTION",
    description: "Mô tả mặc định cho video YouTube.",
    defaultValue: "",
    placeholder: "Mô tả mặc định...",
    multiline: true,
  },
  {
    key: "YOUTUBE_TAGS",
    groupId: "youtubeDefaults",
    label: "YOUTUBE_TAGS",
    description: "Tag mặc định, cách nhau bằng dấu phẩy.",
    defaultValue: "truyen audio,tts,kata studio",
    placeholder: "truyen audio,tts,kata studio",
  },
  {
    key: "YOUTUBE_CATEGORY_ID",
    groupId: "youtubeDefaults",
    label: "YOUTUBE_CATEGORY_ID",
    description: "ID danh mục YouTube. 22 là People & Blogs.",
    defaultValue: "22",
    placeholder: "22",
    inputMode: "number",
  },
  {
    key: "YOUTUBE_PRIVACY_STATUS",
    groupId: "youtubeDefaults",
    label: "YOUTUBE_PRIVACY_STATUS",
    description: "Trạng thái mặc định: private, unlisted hoặc public.",
    defaultValue: "unlisted",
    placeholder: "unlisted",
  },
  {
    key: "YOUTUBE_MADE_FOR_KIDS",
    groupId: "youtubeDefaults",
    label: "YOUTUBE_MADE_FOR_KIDS",
    description: "true/false. Mặc định false.",
    defaultValue: "false",
    placeholder: "false",
  },
  {
    key: "YOUTUBE_NOTIFY_SUBSCRIBERS",
    groupId: "youtubeDefaults",
    label: "YOUTUBE_NOTIFY_SUBSCRIBERS",
    description: "true/false. Mặc định không thông báo subscriber.",
    defaultValue: "false",
    placeholder: "false",
  },
  {
    key: "YOUTUBE_CONTAINS_SYNTHETIC_MEDIA",
    groupId: "youtubeDefaults",
    label: "YOUTUBE_CONTAINS_SYNTHETIC_MEDIA",
    description: "true/false. Mặc định true vì video có giọng AI.",
    defaultValue: "true",
    placeholder: "true",
  },

  {
    key: "AI_SHORTS_API_URL",
    groupId: "aiShorts",
    label: "AI_SHORTS_API_URL",
    description: "Google Gemini API base URL dùng cho Veo video generation.",
    defaultValue: "https://generativelanguage.googleapis.com/v1beta",
    placeholder: "https://generativelanguage.googleapis.com/v1beta",
    inputMode: "url",
  },
  {
    key: "AI_SHORTS_API_KEY",
    groupId: "aiShorts",
    label: "AI_SHORTS_API_KEY",
    description: "Gemini API key lấy từ Google AI Studio để gọi Veo 3.1 Fast.",
    defaultValue: "",
    placeholder: "Gemini API key",
    sensitive: true,
    inputMode: "password",
  },
  {
    key: "AI_SHORTS_MODEL",
    groupId: "aiShorts",
    label: "AI_SHORTS_MODEL",
    description: "Model Gemini Veo dùng để tạo Shorts. Nên giữ mặc định bản Fast để tiết kiệm thời gian/chi phí.",
    defaultValue: "veo-3.1-fast-generate-preview",
    placeholder: "veo-3.1-fast-generate-preview",
  },
  {
    key: "AI_SHORTS_PROVIDER",
    groupId: "aiShorts",
    label: "AI_SHORTS_PROVIDER",
    description: "Provider cố định cho tính năng tạo Shorts.",
    defaultValue: "gemini-veo",
    placeholder: "gemini-veo",
  },
  {
    key: "ELEVENLABS_API_KEY",
    groupId: "elevenlabs",
    label: "ELEVENLABS_API_KEY",
    description: "API key của ElevenLabs. Không có key thì giọng PRO không hoạt động.",
    defaultValue: "",
    placeholder: "sk_...",
    sensitive: true,
    inputMode: "password",
  },
  {
    key: "ELEVENLABS_VOICES",
    groupId: "elevenlabs",
    label: "ELEVENLABS_VOICES",
    description: "Danh sách voice PRO. Nhập từng dòng bằng form, app sẽ tự lưu về JSON.",
    defaultValue: "",
    placeholder: '[{"id":"voice_id","label":"Tên giọng"}]',
    multiline: true,
  },
];

export const DEFAULT_APP_SETTINGS = APP_SETTING_DEFINITIONS.reduce<Record<string, string>>(
  (settings, definition) => {
    settings[definition.key] = definition.defaultValue;
    return settings;
  },
  {}
);

export const SENSITIVE_APP_SETTING_KEYS = new Set(
  APP_SETTING_DEFINITIONS.filter((definition) => definition.sensitive).map((definition) => definition.key)
);

export const APP_SETTING_KEYS = APP_SETTING_DEFINITIONS.map((definition) => definition.key);
