export type RemoteControlAction =
  | "help"
  | "status"
  | "lock"
  | "open_app"
  | "shutdown"
  | "restart"
  | "cancel"
  | "unknown";

export type RemoteControlConfig = {
  enabled: boolean;
  allowedUserIds: string[];
  ollamaEnabled: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
  allowPowerActions: boolean;
  appAliases: Record<string, string>;
};

export type RemoteControlConfigUpdate = Partial<RemoteControlConfig> & {
  botToken?: string;
  removeBotToken?: boolean;
};

export type RemoteControlIntent = {
  action: RemoteControlAction;
  alias?: string;
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
