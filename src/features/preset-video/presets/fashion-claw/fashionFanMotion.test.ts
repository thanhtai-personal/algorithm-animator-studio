import { describe, expect, it } from "vitest";
import { FAN_BLADE_ANGLES, FAN_HUB, getFashionFanMotion } from "./fashionFanMotion";

describe("T03 reference ceiling-fan motion", () => {
  it("fixes the shaft and offsets exactly three flat blades at 120 degrees", () => {
    expect(FAN_HUB).toEqual({ x: 180, y: 36 });
    expect(FAN_BLADE_ANGLES).toEqual([0, 120, 240]);
  });
  it("holds the initial diagonal pose until 3.4 seconds", () => {
    for (const time of [0, 0.4, 0.9, 1.6, 2.8, 3.3]) {
      expect(getFashionFanMotion(time).angleDegrees).toBe(60);
      expect(getFashionFanMotion(time).blurStrength).toBe(0);
    }
  });
  it("passes the subject near the observed transition windows", () => {
    for (const [time, target] of [[3.8, 120], [4.55, 360], [6.22, 480], [8.33, 720], [9.1, 775]]) {
      expect(getFashionFanMotion(time).angleDegrees).toBeCloseTo(target, 5);
    }
    expect(getFashionFanMotion(4.2).angleDegrees).toBeGreaterThan(190);
    expect(getFashionFanMotion(4.92).angleDegrees).toBe(450);
  });
  it("is deterministic, continuous and bounded over all 296 source frames", () => {
    let previous = getFashionFanMotion(0).angleDegrees;
    for (let frame = 0; frame < 296; frame += 1) {
      const state = getFashionFanMotion(frame / 30);
      expect(Number.isFinite(state.angleDegrees)).toBe(true);
      expect(state.angleDegrees).toBeGreaterThanOrEqual(previous - 1e-9);
      expect(state.angleDegrees - previous).toBeLessThanOrEqual(43);
      expect(state.blurStrength).toBeGreaterThanOrEqual(0);
      expect(state.blurStrength).toBeLessThanOrEqual(1);
      previous = state.angleDegrees;
    }
  });
  it("only draws trailing poses behind the main sweep", () => {
    for (const time of [3.72, 4.43, 6.31, 8.22]) {
      const state = getFashionFanMotion(time);
      expect(state.blurStrength).toBeGreaterThan(0);
      expect(state.trails).toHaveLength(3);
      for (const angle of state.trails) expect(angle).toBeLessThan(state.angleDegrees);
    }
    expect(getFashionFanMotion(Number.NaN).angleDegrees).toBe(60);
    expect(getFashionFanMotion(-1).angleDegrees).toBe(60);
  });
});
