import type { RuntimeEnvValues } from "./EnvFileService";
import { getAgentVideoJob, runAgentVideoJob } from "./AiVideoAgentService";

export function startAgentVideoJobInBackground(id: string, envOverrides: RuntimeEnvValues = {}) {
  const current = getAgentVideoJob(id, envOverrides);
  if (!current) throw new Error("Không tìm thấy agent job.");
  if (current.status === "running") return current;

  void runAgentVideoJob(id, envOverrides).catch(() => undefined);
  return getAgentVideoJob(id, envOverrides) || current;
}
