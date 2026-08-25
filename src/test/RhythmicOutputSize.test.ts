import { describe, expect, it } from "vitest";
import {
  RHYTHMIC_OUTPUT_PRESETS,
  normalizeRhythmicOutputPreset,
  rhythmicOutputSize,
} from "../features/rhythmic-studio/lib/outputSize";

describe("rhythmic output sizes", () => {
  it("maps portrait and landscape to their exact native dimensions", () => {
    expect(rhythmicOutputSize("portrait-720p")).toEqual({
      preset: "portrait-720p",
      width: 720,
      height: 1280,
      aspectLabel: "9:16",
      resolutionLabel: "720×1280",
    });
    expect(rhythmicOutputSize("landscape-720p")).toEqual({
      preset: "landscape-720p",
      width: 1280,
      height: 720,
      aspectLabel: "16:9",
      resolutionLabel: "1280×720",
    });
  });

  it("keeps the two 720p orientations at the same pixel budget", () => {
    const portrait = rhythmicOutputSize("portrait-720p");
    const landscape = rhythmicOutputSize("landscape-720p");
    expect(portrait.width * portrait.height).toBe(landscape.width * landscape.height);
  });

  it("normalizes missing and legacy values to the portrait default", () => {
    expect(normalizeRhythmicOutputPreset(undefined)).toBe("portrait-720p");
    expect(normalizeRhythmicOutputPreset("unknown-value")).toBe("portrait-720p");
  });

  it("exposes only the two approved presets", () => {
    expect(RHYTHMIC_OUTPUT_PRESETS).toEqual(["portrait-720p", "landscape-720p"]);
  });
});
