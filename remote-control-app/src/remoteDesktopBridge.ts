export type RemoteDesktopPreferences = {
  launchAtLogin: boolean;
  packaged: boolean;
  platform: string;
  startupSupported: boolean;
};

export type KaiRemoteDesktopApi = {
  getPreferences: () => Promise<RemoteDesktopPreferences>;
  setLaunchAtLogin: (enabled: boolean) => Promise<RemoteDesktopPreferences>;
};

type DesktopBridgeHost = {
  kaiRemote?: KaiRemoteDesktopApi;
};

const BROWSER_PREFERENCES: RemoteDesktopPreferences = {
  launchAtLogin: false,
  packaged: false,
  platform: "web",
  startupSupported: false,
};

export async function readRemoteDesktopPreferences(
  host: DesktopBridgeHost = window,
): Promise<RemoteDesktopPreferences> {
  return host.kaiRemote?.getPreferences() ?? BROWSER_PREFERENCES;
}

export async function setRemoteLaunchAtLogin(
  enabled: boolean,
  host: DesktopBridgeHost = window,
): Promise<RemoteDesktopPreferences> {
  if (!host.kaiRemote) {
    throw new Error("Khởi động cùng Windows chỉ khả dụng trong ứng dụng KAI Remote đã đóng gói.");
  }

  return host.kaiRemote.setLaunchAtLogin(enabled);
}

declare global {
  interface Window {
    kaiRemote?: KaiRemoteDesktopApi;
  }
}
