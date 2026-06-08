export type VieneuGenerateBody = {
  text?: string;
  segments?: string[];
  fileName?: string;
  mode?: string;
  emotion?: string;
  voiceId?: string;
  referenceAudioPath?: string;
  referenceText?: string;
};

export type VieneuConfigStatus = {
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
