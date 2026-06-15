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

export type YoutubeToolStatusResponse = {
  ok: boolean;
  command: string;
  version?: string;
  detail?: string;
};

export type YoutubeToolsHealthResponse = {
  ok: boolean;
  python: YoutubeToolStatusResponse;
  ytDlp: YoutubeToolStatusResponse;
  whisper: YoutubeToolStatusResponse;
  ffmpeg: YoutubeToolStatusResponse;
  ffprobe: YoutubeToolStatusResponse;
  outputDir: string;
  installHint: string[];
};

export type EndpointCheckResponse = {
  label: string;
  method: string;
  url: string;
  ok: boolean;
  detail?: string;
  apiName?: string;
};

export type ElevenLabsConfigResponse = {
  hasApiKey: boolean;
  voices: { id: string; label: string }[];
  endpointChecks?: EndpointCheckResponse[];
  endpointsOk?: boolean;
};

export type SupertonicConfigResponse = {
  serverOk: boolean;
  baseUrl: string;
  endpoints?: { health: string; styles: string; importStyle: string; tts: string };
  model: string;
  defaultVoice: string;
  voices: { id: string; label: string }[];
  endpointChecks?: EndpointCheckResponse[];
  endpointsOk?: boolean;
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
  gradioClientInstalled: boolean;
  gradioClientInstallCommand: string;
  gradioClientCheckError?: string;
  argTemplateConfigured: boolean;
  f0Method: string;
  pitch: number;
  indexRate: number;
  protect: number;
  filterRadius: number;
  templates: RvcApplioTemplateResponse[];
  ttsTemplates: RvcApplioTemplateResponse[];
  ttsTemplateConfigured: boolean;
  endpointChecks?: EndpointCheckResponse[];
  endpointsOk?: boolean;
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
  | "AI_SHORTS_API_URL"
  | "AI_AGENT_TEXT_MODEL"
  | "AI_SHORTS_API_KEY"
  | "AI_AGENT_PROVIDER"
  | "OPENAI_API_KEY"
  | "OPENAI_BASE_URL"
  | "OPENAI_CHAT_MODEL"
  | "ELEVENLABS_API_KEY"
  | "ELEVENLABS_VOICES"
  | "SUPERTONIC_BASE_URL"
  | "SUPERTONIC_MODEL"
  | "SUPERTONIC_HEALTH_ENDPOINT"
  | "SUPERTONIC_STYLES_ENDPOINT"
  | "SUPERTONIC_IMPORT_STYLE_ENDPOINT"
  | "SUPERTONIC_TTS_ENDPOINT"
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
  | "YOUTUBE_TOOLS_PYTHON"
  | "YOUTUBE_DLP_EXE"
  | "WHISPER_EXE"
  | "YOUTUBE_COOKIES_FROM_BROWSER"
  | "YOUTUBE_COOKIES_FILE"
  | "YOUTUBE_JS_RUNTIME"
  | "YOUTUBE_TRANSCRIPT_MODEL"
  | "YOUTUBE_TRANSCRIPT_LANGUAGE"
>>;

export const EMPTY_FORM: SettingsForm = {
  MODEL_DIR: "",
  PIPER_EXE: "",
  SERVER_DATA_DIR: "",
  MUSIC_LIBRARY_DIR: "",
  AI_SHORTS_API_URL: "",
  AI_AGENT_TEXT_MODEL: "",
  AI_SHORTS_API_KEY: "",
  AI_AGENT_PROVIDER: "",
  OPENAI_API_KEY: "",
  OPENAI_BASE_URL: "",
  OPENAI_CHAT_MODEL: "",
  ELEVENLABS_API_KEY: "",
  ELEVENLABS_VOICES: "",
  SUPERTONIC_BASE_URL: "",
  SUPERTONIC_MODEL: "",
  SUPERTONIC_HEALTH_ENDPOINT: "",
  SUPERTONIC_STYLES_ENDPOINT: "",
  SUPERTONIC_IMPORT_STYLE_ENDPOINT: "",
  SUPERTONIC_TTS_ENDPOINT: "",
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
  YOUTUBE_TOOLS_PYTHON: "",
  YOUTUBE_DLP_EXE: "",
  WHISPER_EXE: "",
  YOUTUBE_COOKIES_FROM_BROWSER: "",
  YOUTUBE_COOKIES_FILE: "",
  YOUTUBE_JS_RUNTIME: "",
  YOUTUBE_TRANSCRIPT_MODEL: "",
  YOUTUBE_TRANSCRIPT_LANGUAGE: "",
};

export type SettingsFormKey = keyof SettingsForm;
