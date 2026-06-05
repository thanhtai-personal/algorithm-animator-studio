import type { RuntimeSettings } from "@/lib/runtimeSettings";

export type HealthResponse = {
  ok: boolean;
  piperExe: string;
  piperExists: boolean;
  modelDir: string;
  generatedDir?: string;
};

export type PiperModel = {
  key: string;
  label: string;
  lang: "vi" | "en";
  available: boolean;
  modelPath: string;
  jsonPath: string;
};

export type SelectPathResponse = { ok: boolean; path: string };

export type ElevenLabsConfigResponse = {
  hasApiKey: boolean;
  voices: { id: string; label: string }[];
};

export type SupertonicConfigResponse = {
  serverOk: boolean;
  baseUrl: string;
  model: string;
  defaultVoice: string;
  voices: { id: string; label: string }[];
  error?: string;
};

export type SettingsForm = Required<Pick<
  RuntimeSettings,
  | "MODEL_DIR"
  | "PIPER_EXE"
  | "SERVER_DATA_DIR"
  | "MUSIC_LIBRARY_DIR"
  | "ELEVENLABS_API_KEY"
  | "ELEVENLABS_VOICES"
  | "SUPERTONIC_BASE_URL"
  | "SUPERTONIC_MODEL"
  | "SUPERTONIC_DEFAULT_VOICE"
  | "SUPERTONIC_TOTAL_STEPS"
  | "RVC_APPLIO_BASE_URL"
  | "RVC_APPLIO_API_NAME"
  | "RVC_APPLIO_ARG_TEMPLATE_JSON"
  | "RVC_APPLIO_PYTHON"
  | "RVC_APPLIO_SOURCE_PIPER_MODEL"
  | "RVC_APPLIO_MODEL_NAME"
  | "RVC_APPLIO_INDEX_PATH"
  | "RVC_APPLIO_PITCH"
  | "RVC_APPLIO_F0_METHOD"
  | "RVC_APPLIO_INDEX_RATE"
  | "RVC_APPLIO_PROTECT"
  | "RVC_APPLIO_FILTER_RADIUS"
>>;

export const EMPTY_FORM: SettingsForm = {
  MODEL_DIR: "",
  PIPER_EXE: "",
  SERVER_DATA_DIR: "",
  MUSIC_LIBRARY_DIR: "",
  ELEVENLABS_API_KEY: "",
  ELEVENLABS_VOICES: "",
  SUPERTONIC_BASE_URL: "",
  SUPERTONIC_MODEL: "",
  SUPERTONIC_DEFAULT_VOICE: "",
  SUPERTONIC_TOTAL_STEPS: "",
  RVC_APPLIO_BASE_URL: "",
  RVC_APPLIO_API_NAME: "",
  RVC_APPLIO_ARG_TEMPLATE_JSON: "",
  RVC_APPLIO_PYTHON: "",
  RVC_APPLIO_SOURCE_PIPER_MODEL: "",
  RVC_APPLIO_MODEL_NAME: "",
  RVC_APPLIO_INDEX_PATH: "",
  RVC_APPLIO_PITCH: "",
  RVC_APPLIO_F0_METHOD: "",
  RVC_APPLIO_INDEX_RATE: "",
  RVC_APPLIO_PROTECT: "",
  RVC_APPLIO_FILTER_RADIUS: "",
};

export type SettingsFormKey = keyof SettingsForm;
