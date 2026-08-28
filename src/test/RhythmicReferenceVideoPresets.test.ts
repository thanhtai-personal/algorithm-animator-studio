import { describe, expect, it } from "vitest";
import {
  REFERENCE_CLIP_PRESET_MAP,
  REFERENCE_VIDEO_PRESET_IDS,
} from "../features/rhythmic-studio/lib/referenceVideoPresets";
import { RHYTHMIC_PRESET_IDS, presetById } from "../features/rhythmic-studio/lib/studioPresets";

const CLIP_IDS = ["013b", "0e70", "3949", "4739", "4fd7", "54ce", "57c8", "a154", "ad97", "hB8lCZ8xGZo_005", "tXxHSu15xU8_002"] as const;
const SHOWCASE_CLIP_IDS = ["0e70", "3949", "4739", "4fd7", "54ce", "57c8", "a154", "hB8lCZ8xGZo_005"] as const;

describe("reference video presets", () => {
  it("maps every clip while collapsing near-identical showcase references", () => {
    expect(Object.keys(REFERENCE_CLIP_PRESET_MAP).sort()).toEqual([...CLIP_IDS].sort());
    expect(REFERENCE_VIDEO_PRESET_IDS).toHaveLength(4);
    expect(REFERENCE_CLIP_PRESET_MAP.ad97).toBe("neon-comet");

    for (const clipId of SHOWCASE_CLIP_IDS) {
      expect(REFERENCE_CLIP_PRESET_MAP[clipId]).toBe("vibraphone-wall");
    }

    for (const clipId of CLIP_IDS) {
      const presetId = REFERENCE_CLIP_PRESET_MAP[clipId];
      expect(RHYTHMIC_PRESET_IDS).toContain(presetId);
      expect(presetById(presetId).referenceClipIds).toContain(clipId);
    }
  });

  it("keeps only four visually meaningful preset families", () => {
    expect(REFERENCE_VIDEO_PRESET_IDS).toEqual([
      "toy-pegboard",
      "neon-comet",
      "vibraphone-wall",
      "reference-korobeiniki-tubes",
    ]);

    const signatures = REFERENCE_VIDEO_PRESET_IDS.map((id) => {
      const settings = presetById(id).settings;
      expect(settings.curveIntensity).toBe(0);
      expect(settings.curvePathLength).toBe(0);
      return JSON.stringify([
        settings.backgroundColor,
        settings.instrumentFamily,
        settings.platformPrimaryStyle,
        settings.colorPaletteMode,
      ]);
    });
    expect(new Set(signatures).size).toBe(REFERENCE_VIDEO_PRESET_IDS.length);
  });

  it("keeps the consolidated instrument gallery linked to all eight showcase clips", () => {
    expect(presetById("vibraphone-wall").referenceClipIds).toEqual(expect.arrayContaining([...SHOWCASE_CLIP_IDS]));
  });

  it("keeps dark luminous work represented by the neon preset instead of a duplicate cyan preset", () => {
    const background = presetById("neon-comet").settings.backgroundColor;
    expect(background).toMatch(/^#[0-9a-f]{6}$/i);

    const rgb = background!.slice(1).match(/.{2}/g)!.map((channel) => Number.parseInt(channel, 16));
    const perceivedLightness = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    expect(perceivedLightness).toBeLessThan(50);
  });
});
