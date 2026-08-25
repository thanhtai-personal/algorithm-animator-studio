import { describe, expect, it } from "vitest";
import {
  REFERENCE_CLIP_PRESET_MAP,
  REFERENCE_VIDEO_PRESET_IDS,
} from "../features/rhythmic-studio/lib/referenceVideoPresets";
import { RHYTHMIC_PRESET_IDS, presetById } from "../features/rhythmic-studio/lib/studioPresets";

const CLIP_IDS = ["013b", "0e70", "3949", "4739", "4fd7", "54ce", "a154", "ad97", "hB8lCZ8xGZo_005"] as const;

describe("reference video presets", () => {
  it("maps every clip while collapsing visually similar references", () => {
    expect(Object.keys(REFERENCE_CLIP_PRESET_MAP).sort()).toEqual([...CLIP_IDS].sort());
    expect(REFERENCE_VIDEO_PRESET_IDS).toHaveLength(7);
    expect(REFERENCE_CLIP_PRESET_MAP["0e70"]).toBe(REFERENCE_CLIP_PRESET_MAP["4fd7"]);
    expect(REFERENCE_CLIP_PRESET_MAP["3949"]).toBe(REFERENCE_CLIP_PRESET_MAP["4739"]);

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

  it("assigns every collected reference marble style to a reference preset", () => {
    const assignedStyles = REFERENCE_VIDEO_PRESET_IDS.map((id) => presetById(id).settings.ballStyle);
    expect(assignedStyles).toEqual(expect.arrayContaining(["flower", "fire", "water", "rainbow"]));
  });

  it("keeps the fast-era clip as a distinct mixed-instrument corridor", () => {
    const presetId = REFERENCE_CLIP_PRESET_MAP.hB8lCZ8xGZo_005;
    const settings = presetById(presetId).settings;

    expect(settings.instrumentFamily).toBe("mixed");
    expect(settings.instrumentLayout).toBe("corridor");
    expect(settings.platformPrimaryStyle).toBe("instrument-pad");
  });
});
