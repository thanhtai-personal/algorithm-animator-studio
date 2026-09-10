import { describe, expect, it, vi } from "vitest";
import {
  readRemoteDesktopPreferences,
  setRemoteLaunchAtLogin,
  type KaiRemoteDesktopApi,
} from "../src/remoteDesktopBridge";

describe("KAI Remote desktop bridge", () => {
  it("returns a safe browser fallback when Electron is unavailable", async () => {
    await expect(readRemoteDesktopPreferences({})).resolves.toEqual({
      launchAtLogin: false,
      packaged: false,
      platform: "web",
      startupSupported: false,
    });
  });

  it("forwards startup changes to the isolated preload API", async () => {
    const setLaunchAtLogin = vi.fn().mockResolvedValue({
      launchAtLogin: true,
      packaged: true,
      platform: "win32",
      startupSupported: true,
    });
    const api: KaiRemoteDesktopApi = {
      getPreferences: vi.fn(),
      setLaunchAtLogin,
    };

    await expect(setRemoteLaunchAtLogin(true, { kaiRemote: api })).resolves.toMatchObject({
      launchAtLogin: true,
      startupSupported: true,
    });
    expect(setLaunchAtLogin).toHaveBeenCalledWith(true);
  });

  it("rejects startup changes outside the packaged Windows app", async () => {
    await expect(setRemoteLaunchAtLogin(true, {})).rejects.toThrow(/Windows/);
  });
});
