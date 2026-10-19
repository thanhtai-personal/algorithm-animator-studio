import { describe, expect, it } from "vitest";
import { getFashionVisualState, getFashionGarmentDetail } from "./fashionVisualStyle";
describe("T06 material and cinematic finish", () => {
  it("has four visibly different garment builds", () => {
    const styles=[0,1,2,3].map(getFashionGarmentDetail);
    expect(styles.map(s=>s.type)).toEqual(["maid","champagne","silver","tulle"]);
    expect(styles.map(s=>s.layerCount)).toEqual([2,3,3,4]);
    expect(styles.map(s=>s.sparkleCount)).toEqual([0,21,13,0]);
  });
  it("limits transition illumination to a few frames at each cut", () => {
    for(let frame=0;frame<296;frame++) {
      const v=getFashionVisualState(frame/30).transitionVeil;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0.12);
      if([139,184,248].every(f=>Math.abs(f-frame)>4)) expect(v).toBe(0);
    }
    for(const frame of [139,184,248]) expect(getFashionVisualState(frame/30).transitionVeil).toBeGreaterThan(0.09);
  });
  it("keeps hair drift, contact shadow and vignette bounded for all frames",()=>{
    for(let f=0;f<296;f++) {
      const v=getFashionVisualState(f/30);
      expect(v).toEqual(getFashionVisualState(f/30));
      expect(Math.abs(v.hairSway)).toBeLessThan(3);
      expect(v.shadowOpacity).toBeGreaterThanOrEqual(0.15);
      expect(v.shadowOpacity).toBeLessThanOrEqual(0.5);
      expect(v.vignetteOpacity).toBeLessThanOrEqual(0.16);
    }
    expect(getFashionVisualState(-1)).toEqual(getFashionVisualState(0));
    expect(getFashionVisualState(Number.NaN)).toEqual(getFashionVisualState(0));
  });
  it("clamps invalid and extra outfit indices",()=>{
    expect(getFashionGarmentDetail(100).type).toBe("tulle");
    expect(getFashionGarmentDetail(Number.NaN).type).toBe("maid");
  });
});
