import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";

export type RemoteControlConfig = {
  enabled: boolean;
  allowedUserIds: string[];
  ollamaEnabled: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
  allowPowerActions: boolean;
  appAliases: Record<string, string>;
};

export type RemoteControlRuntimeStatus = {
  running: boolean;
  botUsername: string;
  lastError: string;
  lastUpdateAt: string;
};

export type RemoteControlSettingsResponse = {
  config: RemoteControlConfig;
  tokenConfigured: boolean;
  runtime: RemoteControlRuntimeStatus;
};

export type RemoteControlSettingsUpdate = RemoteControlConfig & {
  botToken?: string;
  removeBotToken?: boolean;
};

export async function getRemoteControlSettings() {
  return parseApiResponse<RemoteControlSettingsResponse>(
    await fetch(buildApiUrl("/api/remote-control/settings")),
  );
}

export async function updateRemoteControlSettings(input: RemoteControlSettingsUpdate) {
  return parseApiResponse<RemoteControlSettingsResponse>(
    await fetch(buildApiUrl("/api/remote-control/settings"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
