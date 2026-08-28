import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { presetObstaclePlan } from "../features/rhythmic-studio/engine/presetObstaclePlan";
import type { InstrumentFamily } from "../features/rhythmic-studio/types";

function stylesFor(family: InstrumentFamily, count = 224) {
  const settings = { ...DEFAULT_SETTINGS, instrumentFamily: family };
  return Array.from({ length: count }, (_, index) => presetObstaclePlan(index, settings)?.style);
}

describe("gong and flute scene planning", () => {
  it("builds dedicated gong and flute instrument families", () => {
    expect(new Set(stylesFor("gong"))).toEqual(new Set(["gong-disc"]));
    expect(new Set(stylesFor("flute"))).toEqual(new Set(["flute-pipe"]));
  });

  it("includes figurative instruments in mixed and wind/metal corridor arrangements", () => {
    expect(stylesFor("mixed")).toContain("gong-disc");
    expect(stylesFor("mixed")).toContain("flute-pipe");
    expect(stylesFor("mixed")).toContain("trumpet-horn");
    expect(stylesFor("mixed")).toContain("guitar-body");
    expect(stylesFor("mixed")).toContain("bronze-drum");
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" as const, instrumentLayout: "corridor" as const };
    const corridor = Array.from({ length: 224 }, (_, index) => presetObstaclePlan(index, settings)?.style);
    expect(corridor).toContain("gong-disc");
    expect(corridor).toContain("flute-pipe");
  });
});
