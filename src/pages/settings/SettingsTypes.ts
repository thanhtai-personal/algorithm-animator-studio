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

export type VieneuConfigResponse = {
  enabled: boolean;
  sdkInstalled: boolean;
  pythonExe: string;
  pythonExists: boolean;
  bridgeExists: boolean;
  mode: string;
  emotion: string;
  defaultVoiceId: string;
  referenceAudioPath: string;
  referenceAudioExists: boolean;
  referenceTextConfigured: boolean;
  remoteApiBase: string;
  remoteModel: string;
  timeoutMs: number;
  version?: string;
  error?: string;
};

export type RvcApplioTemplateResponse = {
  id: string;
  label: string;
  apiName: string;
  modelName: string;
  indexPath: string;
  argTemplateConfigured: boolean;
  ttsVoice?: string;
  ttsSpeed?: number;
};

export type RvcApplioConfigResponse = {
  enabled: boolean;
  serverOk: boolean;
  baseUrl: string;
  startCommand: string;
  startCommandConfigured: boolean;
  apiName: string;
  modelName: string;
  indexPath: string;
  pythonExe: string;
  pythonExists: boolean;
  bridgeExists: boolean;
  argTemplateConfigured: boolean;
  f0Method: string;
  pitch: number;
  indexRate: number;
  protect: number;
  filterRadius: number;
  templates: RvcApplioTemplateResponse[];
  ttsTemplates: RvcApplioTemplateResponse[];
  ttsTemplateConfigured: boolean;
  error?: string;
};

export type RvcApplioTemplateFileResponse = {
  filePath: string;
  convertTemplatesJson: string;
  ttsTemplatesJson: string;
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
  | "VIENEU_PYTHON"
  | "VIENEU_MODE"
  | "VIENEU_EMOTION"
  | "VIENEU_DEFAULT_VOICE_ID"
  | "VIENEU_REFERENCE_AUDIO"
  | "VIENEU_REFERENCE_TEXT"
  | "VIENEU_REMOTE_API_BASE"
  | "VIENEU_REMOTE_MODEL"
  | "VIENEU_TIMEOUT_MS"
  | "RVC_APPLIO_BASE_URL"
  | "RVC_APPLIO_START_COMMAND"
  | "RVC_APPLIO_API_NAME"
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
  VIENEU_PYTHON: "",
  VIENEU_MODE: "",
  VIENEU_EMOTION: "",
  VIENEU_DEFAULT_VOICE_ID: "",
  VIENEU_REFERENCE_AUDIO: "",
  VIENEU_REFERENCE_TEXT: "",
  VIENEU_REMOTE_API_BASE: "",
  VIENEU_REMOTE_MODEL: "",
  VIENEU_TIMEOUT_MS: "",
  RVC_APPLIO_BASE_URL: "",
  RVC_APPLIO_START_COMMAND: "",
  RVC_APPLIO_API_NAME: "",
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
