import { describe, expect, it } from "vitest";
import { getFashionCameraScale, getFashionRemotePose } from "./fashionSetTiming";

describe("Fashion Fan T02 scene timing", () => {
  it("preserves wide framing for the black and champagne looks", () => {
    expect(getFashionCameraScale(0.9)).toBe(1);
    expect(getFashionCameraScale(5.1)).toBe(1);
  });

  it("zooms the whole frame in the silver look and returns for the pink look", () => {
    expect(getFashionCameraScale(7.2)).toBeCloseTo(1.43, 2);
    expect(getFashionCameraScale(8)).toBeCloseTo(1.43, 2);
    expect(getFashionCameraScale(8.7)).toBe(1);
    expect(getFashionCameraScale(9.8)).toBe(1);
  });

  it("has continuous finite camera scale through transition windows", () => {
    for (let i = 0; i < 296; i++) {
      const scale = getFashionCameraScale(i / 30);
      expect(Number.isFinite(scale)).toBe(true);
      expect(scale).toBeGreaterThanOrEqual(1);
      expect(scale).toBeLessThanOrEqual(1.43);
    }
  });

  it("positions white remote beside the model in early looks", () => {
    const black = getFashionRemotePose(0.9);
    expect(black.visible).toBe(true);
    expect(black.x).toBeCloseTo(308, 1);
    expect(black.y).toBe(325);
    expect(black.rotation).toBe(70);
    const champagne = getFashionRemotePose(5.1);
    expect(champagne.visible).toBe(true);
    expect(champagne.x).toBe(321);
    expect(champagne.rotation).toBe(0);
  });

  it("hides remote for silver and pink looks", () => {
    expect(getFashionRemotePose(7.15).visible).toBe(false);
    expect(getFashionRemotePose(9).visible).toBe(false);
  });
});
