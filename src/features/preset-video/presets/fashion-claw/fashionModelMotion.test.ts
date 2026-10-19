import { describe, expect, it } from "vitest";
import { getFashionModelMotion, getFashionModelPose } from "./fashionModelMotion";

describe("T04 Fashion Fan model poses / entrance", () => {
  it("rolls in from left sofa, not from screen top", () => {
    const start = getFashionModelMotion(0);
    expect(start.x).toBeLessThan(-90);
    expect(Math.abs(start.y)).toBeLessThan(25);
    expect(start.rotationDeg).toBeGreaterThan(-100);
    expect(start.rotationDeg).toBeLessThan(-20);
    const half=getFashionModelMotion(.4);
    expect(half.x).toBeGreaterThan(start.x);
    expect(half.x).toBeLessThan(0);
    expect(half.rotationDeg).toBeGreaterThan(start.rotationDeg);
    expect(half.rotationDeg).toBeLessThan(0);
    expect(getFashionModelMotion(.8).x).toBeCloseTo(0,4);
    expect(getFashionModelMotion(.8).rotationDeg).toBeCloseTo(0,4);
  });

  it("never spins 310 degrees or jumps outside the side entrance", () => {
    for(let frame=0;frame<296;frame++) {
      const state=getFashionModelMotion(frame/30);
      expect(state.rotationDeg).toBeGreaterThanOrEqual(-75);
      expect(state.rotationDeg).toBeLessThanOrEqual(15);
      expect(state.x).toBeGreaterThanOrEqual(-150);
      expect(state.x).toBeLessThanOrEqual(6);
      expect(state.y).toBeGreaterThan(-25);
      expect(state.y).toBeLessThan(26);
      if(frame>24) expect(Math.abs(state.rotationDeg)).toBeLessThan(3);
    }
  });

  it("animates both arms, legs and head across reference looks", () => {
    const black=getFashionModelPose(1.7);
    const champagne=getFashionModelPose(5.4);
    const silver=getFashionModelPose(7.2);
    const pink=getFashionModelPose(9.1);
    expect(Math.abs(black.leftArmDeg-champagne.leftArmDeg)).toBeGreaterThan(20);
    expect(Math.abs(champagne.rightArmDeg-pink.rightArmDeg)).toBeGreaterThan(15);
    expect(Math.abs(silver.leftLegDeg-silver.rightLegDeg)).toBeGreaterThan(15);
    expect(Math.abs(pink.leftArmDeg)).toBeGreaterThan(15);
    expect(Math.abs(pink.rightArmDeg)).toBeGreaterThan(15);
  });

  it("is bounded, deterministic and safe for invalid times", () => {
    for(let frame=0;frame<296;frame++) {
      const time=frame/30;
      const model=getFashionModelMotion(time);
      const pose=getFashionModelPose(time);
      expect(Number.isFinite(model.x+model.y+model.rotationDeg+model.breathScale)).toBe(true);
      expect(getFashionModelPose(time)).toEqual(pose);
      expect(Math.abs(pose.leftArmDeg)).toBeLessThan(125);
      expect(Math.abs(pose.rightArmDeg)).toBeLessThan(125);
      expect(Math.abs(pose.leftLegDeg)).toBeLessThan(32);
      expect(Math.abs(pose.rightLegDeg)).toBeLessThan(32);
    }
    expect(getFashionModelMotion(Number.NaN)).toEqual(getFashionModelMotion(0));
    expect(getFashionModelPose(Number.NaN)).toEqual(getFashionModelPose(0));
  });
});
