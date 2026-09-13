import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GATEWAY_EVIDENCE_FILES } from "@/features/preset-video/presets/gpts-mcp-promo/GatewayControlPlaneEvidence";
import { GATEWAY_CONTROL_PLANE_BEATS, GATEWAY_CONTROL_PLANE_DURATION, GATEWAY_MEDIA_ROOT } from "@/features/preset-video/presets/gpts-mcp-promo/gatewayControlPlaneContent";
import { gptsMcpControlPlanePreset } from "@/features/preset-video/presets/gpts-mcp-promo/gatewayControlPlanePreset";
import { createDefaultPresetVideoSettings, loadPresetVideoSettings, savePresetVideoSettings } from "@/features/preset-video/lib/presetVideoDraft";

describe("GPTs MCP control plane promo", () => {
  it("moves from the Codex token-limit hook to GPT, Gateway, MCP and the CTA without timeline gaps", () => {
    expect(gptsMcpControlPlanePreset.defaultDurationSeconds).toBe(GATEWAY_CONTROL_PLANE_DURATION);
    expect(gptsMcpControlPlanePreset.defaultOutputPreset).toBe("portrait-1080p");
    for (const language of ["vi", "en"] as const) {
      const beats = GATEWAY_CONTROL_PLANE_BEATS[language];
      expect(beats.map((beat) => beat.id)).toEqual(["hook", "switch", "gateway", "action", "runtime", "continue", "cta"]);
      expect(beats[0].start).toBe(0);
      expect(beats.at(-1)?.end).toBe(GATEWAY_CONTROL_PLANE_DURATION);
      for (let index = 1; index < beats.length; index += 1) expect(beats[index].start).toBe(beats[index - 1].end);
      const lyrics = language === "vi" ? gptsMcpControlPlanePreset.editableLyrics : gptsMcpControlPlanePreset.localizations?.en?.editableLyrics;
      expect(lyrics).toHaveLength(beats.length);
      lyrics?.forEach((lyric, index) => {
        expect(lyric.start).toBeGreaterThanOrEqual(beats[index].start);
        expect(lyric.end).toBeLessThanOrEqual(beats[index].end);
      });
    }
    expect(gptsMcpControlPlanePreset.editableLyrics?.[0].lines.join(" ")).toContain("Codex báo hết token");
  });

  it("includes the supplied screenshot and short clips in the published preset assets", () => {
    expect(GATEWAY_EVIDENCE_FILES).toHaveLength(5);
    for (const file of GATEWAY_EVIDENCE_FILES) {
      const path = resolve("public", GATEWAY_MEDIA_ROOT, file);
      expect(existsSync(path), file).toBe(true);
      expect(statSync(path).size, file).toBeGreaterThan(10_000);
    }
  });

  it("drops a saved voice-over from the previous script revision", () => {
    window.localStorage.clear();
    savePresetVideoSettings(gptsMcpControlPlanePreset.id, {
      ...createDefaultPresetVideoSettings(gptsMcpControlPlanePreset),
      lyricTimingRevision: 1,
      voiceoverAudioRelativePath: "old-script.mp3",
      voiceoverAudioUrl: "/old-script.mp3",
    });

    const settings = loadPresetVideoSettings(gptsMcpControlPlanePreset);
    expect(settings.voiceoverAudioRelativePath).toBe("");
    expect(settings.voiceoverAudioUrl).toBe("");
    expect(settings.lyricTimings["control-7"]).toEqual({ start: 46.2, end: 52.8 });
  });
});
