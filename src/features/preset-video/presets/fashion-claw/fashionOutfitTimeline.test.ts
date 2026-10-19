import { describe, expect, it } from "vitest";
import { getFashionFanAngle } from "./fashionFanMotion";
import {
  FASHION_LOOK_CUT_FRAMES, FASHION_LOOKS,
  getFashionLookAtFrame, getFashionLookAtSeconds, resolveFashionOutfitSource,
} from "./fashionOutfitTimeline";

describe("T05 Fashion Fan reference outfit transitions", () => {
  it("changes outfits precisely three times over 296 source frames", () => {
    expect(FASHION_LOOK_CUT_FRAMES).toEqual([139, 184, 248]);
    const cuts: number[] = [];
    for (let f = 1; f < 296; f++) {
      if (getFashionLookAtFrame(f).index !== getFashionLookAtFrame(f - 1).index) cuts.push(f);
    }
    expect(cuts).toEqual([139, 184, 248]);
    expect([0, 139, 184, 248, 295].map((frame) => getFashionLookAtFrame(frame).id))
      .toEqual(["black-white", "champagne", "silver-blue", "pink", "pink"]);
  });

  it("only cuts while a wide ceiling-fan blade crosses the subject", () => {
    for (const frame of FASHION_LOOK_CUT_FRAMES) {
      const angle = getFashionFanAngle(frame / 30);
      const distanceFromVerticalBlade = Math.abs(angle - Math.round(angle / 120) * 120);
      expect(distanceFromVerticalBlade).toBeLessThan(12);
    }
  });

  it("does not switch during still opening or outside occlusion windows", () => {
    expect(getFashionLookAtFrame(138).index).toBe(0);
    expect(getFashionLookAtFrame(183).index).toBe(1);
    expect(getFashionLookAtFrame(247).index).toBe(2);
    for (let f = 0; f < 132; f++) expect(getFashionLookAtFrame(f).index).toBe(0);
  });

  it("is seek-safe and based on source seconds rather than output fps", () => {
    for (let f = 0; f < 296; f++) {
      expect(getFashionLookAtSeconds(f / 30)).toEqual(getFashionLookAtFrame(f));
    }
    expect(getFashionLookAtSeconds(4.6).index).toBe(0);
    expect(getFashionLookAtSeconds(4.65).index).toBe(1);
    expect(getFashionLookAtSeconds(Number.NaN).index).toBe(0);
    expect(getFashionLookAtFrame(-10).index).toBe(0);
  });

  it("switches handbags and shoes atomically with the four looks", () => {
    expect(FASHION_LOOKS.map((look) => look.id)).toEqual([
      "black-white", "champagne", "silver-blue", "pink",
    ]);
    expect(FASHION_LOOKS.map((look) => look.handbag))
      .toEqual([null, "blush", "blue-grey", "pink"]);
    expect(FASHION_LOOKS[1].shoeColor).toBe("#f7f5ee");
    expect(FASHION_LOOKS[3].shoeColor).toBe("#e9b0ba");
  });

  it("holds the last photo when user uploads fewer than four, without cycling", () => {
    expect(resolveFashionOutfitSource(["a.png", "b.png"], 0)).toBe("a.png");
    expect(resolveFashionOutfitSource(["a.png", "b.png"], 1)).toBe("b.png");
    expect(resolveFashionOutfitSource(["a.png", "b.png"], 3)).toBe("b.png");
    expect(resolveFashionOutfitSource(["a", "b", "c", "d", "e"], 3)).toBe("d");
    expect(resolveFashionOutfitSource([], 2)).toBeUndefined();
  });
});
