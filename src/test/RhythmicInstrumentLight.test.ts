import { describe, expect, it } from "vitest";
import { activeInstrumentLight, instrumentLightAtTime } from "../features/rhythmic-studio/lib/instrumentLight";

describe("instrument note light envelope", () => {
  it("flashes clearly and then remains visibly latched in the exact note color", () => {
    const color = "#ff5d68";
    expect(instrumentLightAtTime(1_000, 999, color).intensity).toBe(0);
    expect(instrumentLightAtTime(1_000, 1_000, color).intensity).toBe(1);
    expect(instrumentLightAtTime(1_000, 1_220, color).intensity).toBeGreaterThanOrEqual(0.7);
    expect(instrumentLightAtTime(1_000, 10_000, color)).toEqual({ active: true, color, intensity: 0.72 });
  });

  it("restarts on the newest hit and switches to exactly its note color", () => {
    const light = activeInstrumentLight([
      { timeMs: 1_000, color: "#ff5d68" },
      { timeMs: 1_120, color: "#42cfe8" },
    ], 1_140);
    expect(light.color).toBe("#42cfe8");
    expect(light.intensity).toBeGreaterThan(0);
  });

  it("keeps the newest triggered light active until the timeline rewinds before it", () => {
    expect(activeInstrumentLight([{ timeMs: 100, color: "#70d66b" }], 1_000)).toEqual({
      active: true,
      color: "#70d66b",
      intensity: 0.72,
    });
    expect(activeInstrumentLight([{ timeMs: 100, color: "#70d66b" }], 99).active).toBe(false);
  });
});
