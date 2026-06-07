import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import { buildRuntimeSettingsHeaders } from "./runtimeSettings";
import type { Lang } from "./i18n";

export type PiperModel = {
  key: string;
  label: string;
  lang: "vi" | "en";
  available: boolean;
  modelPath: string;
  jsonPath: string;
  canInstall?: boolean;
};

export type PiperRuntimeStatus = {
  ok: boolean;
  piperExe: string;
  piperExists: boolean;
  modelDir: string;
  availableCount: number;
  models: PiperModel[];
  installHint: string[];
};

export type VoiceHealth = {
  ok: boolean;
  piperExe: string;
  piperExists: boolean;
  modelDir: string;
  generatedDir: string;
};

export type ElevenLabsModel = {
  id: string;
  label: string;
  priceUsdPerThousandCharacters: number;
  creditRateLabel: string;
  characterLimit: number;
  languages: string;
  latency: string;
  qualityNote: string;
};

export type ElevenLabsVoice = { id: string; label: string };

export type SupertonicVoice = { id: string; label: string; description?: string };

export type RvcApplioTemplate = {
  id: string;
  label: string;
  apiName: string;
  modelName: string;
  indexPath: string;
  argTemplateConfigured: boolean;
  f0Method: string;
  pitch: number;
  indexRate: number;
  protect: number;
  filterRadius: number;
  ttsVoice?: string;
  ttsSpeed?: number;
};

export type RvcApplioConfig = {
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
  templates: RvcApplioTemplate[];
  ttsTemplates: RvcApplioTemplate[];
  ttsTemplateConfigured: boolean;
  error?: string;
};


export type VieneuConfig = {
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

export type SupertonicConfig = {
  enabled: boolean;
  serverOk: boolean;
  baseUrl: string;
  model: string;
  defaultVoice: string;
  defaultLang: string;
  defaultTotalSteps: number;
  voices: SupertonicVoice[];
  sampleRate?: number;
  version?: string;
  error?: string;
};

export type ElevenLabsConfig = {
  hasApiKey: boolean;
  models: ElevenLabsModel[];
  voices: ElevenLabsVoice[];
  pricing: { sourceLabel: string; sourceUrl: string; disclaimer: string };
};

export type VoiceGenerateResult = {
  ok: boolean;
  fileName: string;
  relativePath: string;
  audioUrl: string;
  model?: string;
  lang?: string;
  warning?: string;
  inputCharacters?: number;
  billedCharacters?: number;
  estimatedUsd?: number;
  segmentDurationsSec?: number[];
};

export async function getVoiceHealth() {
  return parseApiResponse<VoiceHealth>(await fetch(buildApiUrl("/api/health"), { headers: buildRuntimeSettingsHeaders() }));
}

export async function getPiperModels() {
  const data = await parseApiResponse<{ models: PiperModel[] }>(await fetch(buildApiUrl("/api/models"), { headers: buildRuntimeSettingsHeaders() }));
  return data.models;
}

export async function generatePiperVoice(payload: {
  text: string;
  segments?: string[];
  modelKey: string;
  sentenceSilence: number;
  speechRate: number;
  fileName: string;
}) {
  return parseApiResponse<VoiceGenerateResult>(await fetch(buildApiUrl("/api/generate"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function getElevenLabsConfig() {
  return parseApiResponse<ElevenLabsConfig>(await fetch(buildApiUrl("/api/elevenlabs/config"), { headers: buildRuntimeSettingsHeaders() }));
}

export async function getSupertonicConfig() {
  return parseApiResponse<SupertonicConfig>(await fetch(buildApiUrl("/api/supertonic/config"), { headers: buildRuntimeSettingsHeaders() }));
}

export async function getRvcApplioConfig() {
  return parseApiResponse<RvcApplioConfig>(await fetch(buildApiUrl("/api/rvc-applio/config"), { headers: buildRuntimeSettingsHeaders() }));
}

export async function getVieneuConfig() {
  return parseApiResponse<VieneuConfig>(await fetch(buildApiUrl("/api/vieneu/config"), { headers: buildRuntimeSettingsHeaders() }));
}

export async function importSupertonicVoiceStyle(styleJson: unknown) {
  return parseApiResponse<{ ok: boolean; voices: SupertonicVoice[]; model: string }>(await fetch(buildApiUrl("/api/supertonic/styles/import"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ styleJson }),
  }));
}

export async function generateSupertonicVoice(payload: {
  text: string;
  segments?: string[];
  voice: string;
  lang: Lang;
  speed: number;
  totalSteps: number;
  fileName: string;
}) {
  return parseApiResponse<VoiceGenerateResult>(await fetch(buildApiUrl("/api/supertonic/generate"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ ...payload, responseFormat: "wav" }),
  }));
}

export async function generateVieneuVoice(payload: {
  text: string;
  segments?: string[];
  fileName: string;
  mode?: string;
  emotion?: string;
  voiceId?: string;
  referenceAudioPath?: string;
  referenceText?: string;
}) {
  return parseApiResponse<VoiceGenerateResult>(await fetch(buildApiUrl("/api/vieneu/generate"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function convertRvcApplioVoice(payload: {
  audioRelativePath: string;
  fileName?: string;
  templateId?: string;
  pitch?: number;
  f0Method?: string;
}) {
  return parseApiResponse<VoiceGenerateResult>(await fetch(buildApiUrl("/api/rvc-applio/convert"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function generateRvcApplioVoice(payload: {
  text: string;
  segments?: string[];
  fileName: string;
  templateId?: string;
  ttsVoice?: string;
  ttsSpeed?: number;
}) {
  return parseApiResponse<VoiceGenerateResult>(await fetch(buildApiUrl("/api/rvc-applio/tts"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function generateElevenLabsVoice(payload: {
  text: string;
  modelId: string;
  voiceId: string;
  fileName: string;
}) {
  return parseApiResponse<VoiceGenerateResult>(await fetch(buildApiUrl("/api/elevenlabs/generate"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function getPiperRuntimeStatus() {
  return parseApiResponse<PiperRuntimeStatus>(await fetch(buildApiUrl("/api/piper-runtime/status"), { headers: buildRuntimeSettingsHeaders() }));
}

export async function installPiperModel(modelKey: string) {
  return parseApiResponse<{ ok: boolean; model: PiperModel; status: PiperRuntimeStatus }>(await fetch(buildApiUrl("/api/piper-runtime/install-model"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ modelKey }),
  }));
}
