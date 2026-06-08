import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";

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
  status: SetupWizardStatus;
};

export async function getSetupWizardStatus() {
  return parseApiResponse<SetupWizardStatus>(
    await fetch(buildApiUrl("/api/setup/status"), { headers: buildRuntimeSettingsHeaders() }),
  );
}

export async function runSetupWizardTask(taskId: SetupTaskId) {
  return parseApiResponse<SetupTaskResult>(
    await fetch(buildApiUrl(`/api/setup/tasks/${taskId}/run`), {
      method: "POST",
      headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    }),
  );
}
