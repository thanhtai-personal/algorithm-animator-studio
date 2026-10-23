import type { EndpointCheckStatus } from "./EndpointHealth";

export type RvcApplioTemplateStatus = {
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

export type RvcApplioConfigStatus = {
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
  templates: RvcApplioTemplateStatus[];
  ttsTemplates: RvcApplioTemplateStatus[];
  ttsTemplateConfigured: boolean;
  endpointChecks: EndpointCheckStatus[];
  endpointsOk: boolean;
  error?: string;
};

export type RvcApplioConvertBody = {
  audioRelativePath: string;
  fileName?: string;
  templateId?: string;
  pitch?: number;
  f0Method?: string;
  indexRate?: number;
  protect?: number;
  filterRadius?: number;
};

export type RvcApplioTextToSpeechBody = {
  text: string;
  segments?: string[];
  fileName?: string;
  templateId?: string;
  ttsVoice?: string;
  ttsSpeed?: number;
};
