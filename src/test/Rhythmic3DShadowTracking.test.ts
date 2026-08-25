import { describe, expect, it } from "vitest";
import {
  SHOWCASE_SHADOW_LIGHT_OFFSET,
  shadowReceiverOffset,
  shadowRigPose,
} from "../features/rhythmic-studio/components/rhythmicSceneMath3D";

describe("rhythmic 3D shadow tracking", () => {
  it("keeps the key light and shadow target centered on a distant course section", () => {
    const pose = shadowRigPose(
      { x: 2.5, y: -72, z: 0 },
      { x: -6.5, y: 8.5, z: 8 },
    );

    expect(pose.target).toEqual({ x: 2.5, y: -72, z: 0 });
    expect(pose.light).toEqual({ x: -4, y: -63.5, z: 8 });
    expect(pose.light.y - pose.target.y).toBe(8.5);
  });

  it("preserves the light direction while the camera follows the marble", () => {
    const start = shadowRigPose(
      { x: 0, y: 0, z: 0 },
      { x: -5, y: 8, z: 9 },
    );
    const later = shadowRigPose(
      { x: -3, y: -128, z: 0 },
      { x: -5, y: 8, z: 9 },
    );

    expect({
      x: later.light.x - later.target.x,
      y: later.light.y - later.target.y,
      z: later.light.z - later.target.z,
    }).toEqual({
      x: start.light.x - start.target.x,
      y: start.light.y - start.target.y,
      z: start.light.z - start.target.z,
    });
  });

  it("keeps wall shadows close enough to remain beside each instrument", () => {
    const shadow = shadowReceiverOffset(4.4, SHOWCASE_SHADOW_LIGHT_OFFSET);

    expect(Math.abs(shadow.x)).toBeLessThan(1);
    expect(Math.abs(shadow.y)).toBeLessThan(1.5);
  });
});
