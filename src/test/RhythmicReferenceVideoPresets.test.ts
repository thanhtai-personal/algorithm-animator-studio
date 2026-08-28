import { describe, expect, it } from "vitest";
import {
  REFERENCE_CLIP_PRESET_MAP,
  REFERENCE_VIDEO_PRESET_IDS,
} from "../features/rhythmic-studio/lib/referenceVideoPresets";
import { RHYTHMIC_PRESET_IDS, presetById } from "../features/rhythmic-studio/lib/studioPresets";

const CLIP_IDS = ["013b", "0e70", "3949", "4739", "4fd7", "54ce", "57c8", "a154", "ad97", "hB8lCZ8xGZo_005", "tXxHSu15xU8_002"] as const;

describe("reference video presets", () => {
  it("maps every clip while collapsing visually similar references", () => {
    expect(Object.keys(REFERENCE_CLIP_PRESET_MAP).sort()).toEqual([...CLIP_IDS].sort());
    expect(REFERENCE_VIDEO_PRESET_IDS).toHaveLength(7);
    expect(REFERENCE_CLIP_PRESET_MAP["0e70"]).toBe(REFERENCE_CLIP_PRESET_MAP["4fd7"]);
    expect(REFERENCE_CLIP_PRESET_MAP["3949"]).toBe(REFERENCE_CLIP_PRESET_MAP["4739"]);
    expect(REFERENCE_CLIP_PRESET_MAP["3949"]).toBe(REFERENCE_CLIP_PRESET_MAP["54ce"]);
    expect(REFERENCE_CLIP_PRESET_MAP["3949"]).toBe(REFERENCE_CLIP_PRESET_MAP["57c8"]);
    expect(REFERENCE_CLIP_PRESET_MAP.ad97).toBe("neon-comet");

    for (const clipId of CLIP_IDS) {
      const presetId = REFERENCE_CLIP_PRESET_MAP[clipId];
      expect(RHYTHMIC_PRESET_IDS).toContain(presetId);
      expect(presetById(presetId).referenceClipIds).toContain(clipId);
    }
  });

  it("uses physics-first settings and genuinely distinct visual signatures", () => {
    const signatures = REFERENCE_VIDEO_PRESET_IDS.map((id) => {
      const settings = presetById(id).settings;
      expect(settings.curveIntensity).toBe(0);
      expect(settings.curvePathLength).toBe(0);
      return JSON.stringify([
        settings.backgroundColor,
        settings.instrumentFamily,
        settings.platformPrimaryStyle,
        settings.platformSecondaryStyle,
        settings.colorPaletteMode,
      ]);
    });
    expect(new Set(signatures).size).toBe(REFERENCE_VIDEO_PRESET_IDS.length);
  });

  it("keeps only visually meaningful marble archetypes after consolidation", () => {
    const assignedStyles = REFERENCE_VIDEO_PRESET_IDS.map((id) => presetById(id).settings.ballStyle);
    expect(assignedStyles).toEqual(expect.arrayContaining(["flower", "fire", "rainbow", "prism", "glass", "striped"]));
    expect(assignedStyles).not.toContain("water");
    expect(assignedStyles).not.toContain("patchwork");
  });

  it("keeps the fast-era clip as a distinct mixed-instrument corridor", () => {
    const presetId = REFERENCE_CLIP_PRESET_MAP.hB8lCZ8xGZo_005;
    const settings = presetById(presetId).settings;

    expect(settings.instrumentFamily).toBe("mixed");
    expect(settings.instrumentLayout).toBe("corridor");
    expect(settings.platformPrimaryStyle).toBe("instrument-pad");
  });

  it("collapses the mallet-bar references into one gallery preset", () => {
    const ids = ["3949", "4739", "54ce", "57c8"].map((clipId) => REFERENCE_CLIP_PRESET_MAP[clipId as keyof typeof REFERENCE_CLIP_PRESET_MAP]);

    expect(new Set(ids)).toEqual(new Set(["vibraphone-wall"]));
    expect(presetById("vibraphone-wall").referenceClipIds).toEqual(expect.arrayContaining(["3949", "4739", "54ce", "57c8"]));
  });

  it("uses dark scene backgrounds for presets built around luminous instruments", () => {
    const luminousPresetIds = ["neon-comet", "reference-cyan-piano"] as const;

    for (const presetId of luminousPresetIds) {
      const background = presetById(presetId).settings.backgroundColor;
      expect(background).toMatch(/^#[0-9a-f]{6}$/i);

      const rgb = background!.slice(1).match(/.{2}/g)!.map((channel) => Number.parseInt(channel, 16));
      const perceivedLightness = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      expect(perceivedLightness, `${presetId} background should stay dark`).toBeLessThan(50);
    }
  });
});
