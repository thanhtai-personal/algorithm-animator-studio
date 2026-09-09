import { describe, expect, it } from "vitest";
import { normalizeRemoteControlConfig } from "../../server/services/RemoteControlConfigService";

describe("RemoteControlConfigService", () => {
  it("normalizes allowed users, aliases, and localhost Ollama URL", () => {
    const config = normalizeRemoteControlConfig({
      enabled: true,
      allowedUserIds: ["123456", "123456", 987654],
      ollamaEnabled: true,
      ollamaBaseUrl: "http://localhost:11434/",
      ollamaModel: " qwen2.5:7b ",
      allowPowerActions: false,
      appAliases: {
        Chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      },
    });

    expect(config.allowedUserIds).toEqual(["123456", "987654"]);
    expect(config.ollamaBaseUrl).toBe("http://localhost:11434");
    expect(config.ollamaModel).toBe("qwen2.5:7b");
    expect(config.appAliases.chrome).toContain("chrome.exe");
  });

  it("rejects non-local Ollama hosts", () => {
    expect(() => normalizeRemoteControlConfig({
      ollamaBaseUrl: "https://example.com:11434",
    })).toThrow(/localhost/);
  });

  it("requires an allowlisted Telegram user when remote control is enabled", () => {
    expect(() => normalizeRemoteControlConfig({
      enabled: true,
      allowedUserIds: [],
    })).toThrow(/Telegram user ID/);
  });
});
