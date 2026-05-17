import { buildApiUrl } from "../utils/appSettingsStorage";

export type SelectDirectoryResponse = {
  ok: boolean;
  path?: string;
  error?: string;
};

export async function selectServerDataDirectory(): Promise<SelectDirectoryResponse> {
  const response = await fetch(buildApiUrl("/api/system/select-directory"), {
    method: "POST",
  });
  const data = (await response.json()) as SelectDirectoryResponse;

  if (!response.ok) {
    throw new Error(data.error || "Could not open folder picker.");
  }

  return data;
}

export type RuntimeDependencyCheck = {
  key: string;
  label: string;
  ok: boolean;
  status: "ready" | "missing" | "checking";
  detail: string;
};

export type RuntimeInstallStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "skipped" | "error";
  detail?: string;
};

export type RuntimeCapabilities = {
  platform: string;
  winget: boolean;
  homebrew: boolean;
  pythonCommand?: string;
  bundledFfmpeg: boolean;
};

export type RuntimeManualAction = {
  key: string;
  tool: "winget" | "python" | "piper" | "models" | "ffmpeg" | "homebrew";
  label: string;
  detail: string;
  primaryUrl: string;
  cta?: string;
  urls?: Array<{ label: string; url: string }>;
};

export type RuntimeDependencyStatus = {
  ok: boolean;
  supported: boolean;
  installing: boolean;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  installRoot: string;
  modelDir: string;
  piperExe: string;
  ffmpegExe: string;
  ffprobeExe: string;
  missing: string[];
  checks: RuntimeDependencyCheck[];
  steps: RuntimeInstallStep[];
  log: string[];
  manualActions?: string[];
  manualActionLinks?: RuntimeManualAction[];
  capabilities?: RuntimeCapabilities;
};

export async function getRuntimeDependencyStatus(): Promise<RuntimeDependencyStatus> {
  const response = await fetch(buildApiUrl("/api/system/dependencies"));
  const data = (await response.json()) as RuntimeDependencyStatus & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Could not check runtime dependencies.");
  }

  return data;
}

export async function startRuntimeDependencyInstall(): Promise<RuntimeDependencyStatus> {
  const response = await fetch(buildApiUrl("/api/system/dependencies/install"), {
    method: "POST",
  });
  const data = (await response.json()) as RuntimeDependencyStatus & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Could not start runtime dependency installation.");
  }

  return data;
}
