import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders, getRuntimeSettingsToken } from "@/lib/runtimeSettings";

export type SetupTaskId =
  | "generated-data"
  | "piper-runtime"
  | "piper-models"
  | "supertonic"
  | "applio-client"
  | "applio-start"
  | "vieneu";

export type SetupTaskStatus = {
  id: SetupTaskId | "elevenlabs";
  label: string;
  description: string;
  ready: boolean;
  optional: boolean;
  canAutoFix: boolean;
  detail: string;
  command?: string;
};

export type SetupWizardStatus = {
  coreReady: boolean;
  generatedDir: string;
  piperExe: string;
  modelDir: string;
  tasks: SetupTaskStatus[];
};

export type SetupTaskResult = {
  ok: boolean;
  taskId: SetupTaskId;
  message: string;
  output?: string;
  command?: string;
  status: SetupWizardStatus;
};

const SETUP_STATUS_CACHE_TTL_MS = 60_000;

let setupStatusCache: { token: string; expiresAt: number; value: SetupWizardStatus } | null = null;
let setupStatusRequest: { token: string; promise: Promise<SetupWizardStatus> } | null = null;

export function getCachedSetupWizardStatusSnapshot(ttlMs = SETUP_STATUS_CACHE_TTL_MS) {
  const token = getRuntimeSettingsToken();
  if (setupStatusCache && setupStatusCache.token === token && setupStatusCache.expiresAt > Date.now()) {
    return setupStatusCache.value;
  }
  return null;
}

export function clearSetupWizardStatusCache() {
  setupStatusCache = null;
  setupStatusRequest = null;
}

export async function getSetupWizardStatus(options: { force?: boolean; ttlMs?: number } = {}) {
  const ttlMs = options.ttlMs ?? SETUP_STATUS_CACHE_TTL_MS;
  const token = getRuntimeSettingsToken();
  const cached = getCachedSetupWizardStatusSnapshot(ttlMs);
  if (!options.force && cached) return cached;
  if (!options.force && setupStatusRequest?.token === token) return setupStatusRequest.promise;

  const promise = fetch(buildApiUrl("/api/setup/status"), { headers: buildRuntimeSettingsHeaders() }).then((response) => (
    parseApiResponse<SetupWizardStatus>(response)
  )).then((value) => {
    setupStatusCache = { token, value, expiresAt: Date.now() + ttlMs };
    return value;
  }).finally(() => {
    if (setupStatusRequest?.promise === promise) setupStatusRequest = null;
  });

  setupStatusRequest = { token, promise };
  return promise;
}

export async function runSetupWizardTask(taskId: SetupTaskId) {
  const result = await parseApiResponse<SetupTaskResult>(
    await fetch(buildApiUrl(`/api/setup/tasks/${taskId}/run`), {
      method: "POST",
      headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    }),
  );
  setupStatusCache = { token: getRuntimeSettingsToken(), value: result.status, expiresAt: Date.now() + SETUP_STATUS_CACHE_TTL_MS };
  return result;
}
