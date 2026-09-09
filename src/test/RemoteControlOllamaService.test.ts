import { describe, expect, it } from "vitest";
import { parseRemoteControlIntent } from "../../server/services/RemoteControlOllamaService";

describe("RemoteControlOllamaService", () => {
  it("accepts only the supported action schema", () => {
    expect(parseRemoteControlIntent('{"action":"open_app","alias":"Chrome"}')).toEqual({
      action: "open_app",
      alias: "chrome",
    });
  });

  it("downgrades arbitrary command intents to unknown", () => {
    expect(parseRemoteControlIntent('{"action":"shell","command":"rm -rf /"}')).toEqual({
      action: "unknown",
    });
  });

  it("returns unknown for malformed model output", () => {
    expect(parseRemoteControlIntent("not json")).toEqual({ action: "unknown" });
  });
});
