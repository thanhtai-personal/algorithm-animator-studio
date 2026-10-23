import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import { buildRuntimeSettingsHeaders } from "./runtimeSettings";

export type StartupProviderId = "supertonic" | "applio" | "vieneu" | "gpt-sovits";

export type StartupProviderSetting = {
  id: StartupProviderId;
  label: string;
  description: string;
  envKey: string;
  enabled: boolean;
  defaultEnabled: boolean;
  restartRequired: boolean;
  heavy: boolean;
  note: string;
};

export type ProviderStartupSettingsResponse = {
  ok: boolean;
  restartRequired: boolean;
  envPath: string;
  providers: StartupProviderSetting[];
};

export async function getProviderStartupSettings() {
  return parseApiResponse<ProviderStartupSettingsResponse>(await fetch(buildApiUrl("/api/providers/startup"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function updateProviderStartupSetting(providerId: StartupProviderId, enabled: boolean) {
  return parseApiResponse<{
    ok: boolean;
    restartRequired: boolean;
    envPath: string;
    provider: StartupProviderSetting;
    message: string;
  }>(await fetch(buildApiUrl(`/api/providers/startup/${providerId}`), {
    method: "PATCH",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ enabled }),
  }));
}
