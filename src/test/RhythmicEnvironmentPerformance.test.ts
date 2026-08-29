import { describe, expect, it } from "vitest";
import { RHYTHMIC_UI_UPDATE_MS } from "../features/rhythmic-studio/components/rhythmicSceneMath3D";
import { sampledBackdropRepeatIndices } from "../features/rhythmic-studio/lib/backdropRepeatLayout";

describe("rhythmic long-session performance limits", () => {
  it("caps repeated room decorations while covering the complete MIDI course", () => {
    const indices = sampledBackdropRepeatIndices(12_000, 10, 48);

    expect(indices).toHaveLength(48);
    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(1_199);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it("keeps every decoration for short courses", () => {
    expect(sampledBackdropRepeatIndices(45, 10, 48)).toEqual([0, 1, 2, 3, 4]);
  });

  it("limits high-frequency MobX timeline publications to at most six per second", () => {
    expect(RHYTHMIC_UI_UPDATE_MS).toBeGreaterThanOrEqual(1000 / 6);
  });
});
