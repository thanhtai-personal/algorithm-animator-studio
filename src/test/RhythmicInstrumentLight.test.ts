import { describe, expect, it } from "vitest";
import { activeInstrumentLight, instrumentLightAtTime } from "../features/rhythmic-studio/lib/instrumentLight";

describe("instrument note light envelope", () => {
  it("attacks, holds, decays and fully returns to its base level", () => {
    const color = "#ff5d68";
    expect(instrumentLightAtTime(1_000, 999, color).intensity).toBe(0);
    expect(instrumentLightAtTime(1_000, 1_020, color).intensity).toBeGreaterThan(0);
    expect(instrumentLightAtTime(1_000, 1_060, color).intensity).toBe(1);
    expect(instrumentLightAtTime(1_000, 1_220, color).intensity).toBeGreaterThan(0);
    expect(instrumentLightAtTime(1_000, 1_500, color)).toEqual({ active: false, color, intensity: 0 });
  });

  it("restarts on the newest hit and switches to exactly its note color", () => {
    const light = activeInstrumentLight([
      { timeMs: 1_000, color: "#ff5d68" },
      { timeMs: 1_120, color: "#42cfe8" },
    ], 1_140);
    expect(light.color).toBe("#42cfe8");
    expect(light.intensity).toBeGreaterThan(0);
  });

  it("does not latch an old hit indefinitely", () => {
    expect(activeInstrumentLight([{ timeMs: 100, color: "#70d66b" }], 1_000).active).toBe(false);
  });
});
