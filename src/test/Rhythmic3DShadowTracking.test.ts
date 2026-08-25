import { describe, expect, it } from "vitest";
import {
  RHYTHMIC_SHADOW_RECEIVER_Z,
  RHYTHMIC_AUTO_SHADOW_RECEIVER_Z,
  RHYTHMIC_SHOWCASE_WALL_CENTER_Y,
  RHYTHMIC_SHOWCASE_WALL_HEIGHT,
  SHOWCASE_SHADOW_LIGHT_OFFSET,
  shadowReceiverOffset,
  shadowRigPose,
  wallMountProfile,
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

  it("anchors the mount foot on the same plane that receives its shadow", () => {
    const frontDepth = 0.27;
    const mount = wallMountProfile(frontDepth);
    const platformGroupZ = -frontDepth;

    expect(platformGroupZ + mount.anchorZ).toBeCloseTo(RHYTHMIC_SHADOW_RECEIVER_Z, 6);
    expect(mount.stemLength).toBeGreaterThan(3);
  });

  it("anchors compact automatic instruments to their nearer shadow receiver", () => {
    const frontDepth = 0.24;
    const mount = wallMountProfile(frontDepth, RHYTHMIC_AUTO_SHADOW_RECEIVER_Z);

    expect(-frontDepth + mount.anchorZ).toBeCloseTo(RHYTHMIC_AUTO_SHADOW_RECEIVER_Z, 6);
    expect(mount.stemLength).toBeLessThan(1.3);
  });

  it("keeps the shadow wall behind a complete long-form course", () => {
    expect(RHYTHMIC_SHOWCASE_WALL_CENTER_Y + RHYTHMIC_SHOWCASE_WALL_HEIGHT * 0.5).toBeGreaterThanOrEqual(0);
    expect(RHYTHMIC_SHOWCASE_WALL_CENTER_Y - RHYTHMIC_SHOWCASE_WALL_HEIGHT * 0.5).toBeLessThanOrEqual(-540);
  });
});
