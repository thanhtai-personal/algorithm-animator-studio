import { describe, expect, it } from "vitest";
import {
  DENSE_CHASSIS_CENTER_Z,
  DENSE_CHASSIS_DEPTH,
  RHYTHMIC_SHADOW_RECEIVER_Z,
  RHYTHMIC_AUTO_SHADOW_RECEIVER_Z,
  RHYTHMIC_SHOWCASE_WALL_CENTER_Y,
  RHYTHMIC_SHOWCASE_WALL_HEIGHT,
  SHOWCASE_SHADOW_LIGHT_OFFSET,
  denseChassisMountProfile,
  courseBackdropBounds,
  needsDedicatedShadowReceiver,
  rhythmicRecordingRenderProfile,
  shadowReceiverZForSettings,
  shadowReceiverOffset,
  shadowRigPose,
  wallMountProfile,
} from "../features/rhythmic-studio/components/rhythmicSceneMath3D";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";

describe("rhythmic 3D shadow tracking", () => {
  it("uses an adaptive recording profile without disabling physical shadows", () => {
    expect(rhythmicRecordingRenderProfile(30)).toEqual({
      dpr: 1.5,
      transmissionResolutionScale: 0.78,
      shadowMapSize: 1024,
    });
    expect(rhythmicRecordingRenderProfile(60)).toEqual({
      dpr: 1.35,
      transmissionResolutionScale: 0.68,
      shadowMapSize: 1024,
    });
    expect(rhythmicRecordingRenderProfile(120)).toEqual({
      dpr: 1,
      transmissionResolutionScale: 0.55,
      shadowMapSize: 512,
    });
  });

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

  it("uses one authoritative receiver plane for automatic and showcase scenes", () => {
    expect(shadowReceiverZForSettings(DEFAULT_SETTINGS)).toBe(RHYTHMIC_AUTO_SHADOW_RECEIVER_Z);
    expect(shadowReceiverZForSettings({ ...DEFAULT_SETTINGS, instrumentFamily: "piano" })).toBe(RHYTHMIC_SHADOW_RECEIVER_Z);
  });

  it("does not add a second shadow receiver in rooms that already receive shadows", () => {
    expect(needsDedicatedShadowReceiver("neutral")).toBe(false);
    expect(needsDedicatedShadowReceiver("xylophone")).toBe(false);
    expect(needsDedicatedShadowReceiver("tube-board")).toBe(false);
    expect(needsDedicatedShadowReceiver("comet")).toBe(true);
  });

  it.each([
    ["automatic", RHYTHMIC_AUTO_SHADOW_RECEIVER_Z],
    ["showcase", RHYTHMIC_SHADOW_RECEIVER_Z],
  ])("joins the dense-run chassis to the %s receiver without a floating gap", (_label, receiverZ) => {
    const mount = denseChassisMountProfile(receiverZ);
    const chassisBackZ = DENSE_CHASSIS_CENTER_Z - DENSE_CHASSIS_DEPTH * 0.5;
    const stemNearEndZ = mount.stemCenterZ + mount.stemLength * 0.5;
    const stemFarEndZ = mount.stemCenterZ - mount.stemLength * 0.5;

    expect(stemNearEndZ).toBeCloseTo(chassisBackZ, 6);
    expect(stemFarEndZ).toBeCloseTo(receiverZ + mount.anchorThickness, 6);
    expect(mount.anchorCenterZ - mount.anchorThickness * 0.5).toBeCloseTo(receiverZ, 6);
  });

  it("keeps the shadow wall behind a complete long-form course", () => {
    expect(RHYTHMIC_SHOWCASE_WALL_CENTER_Y + RHYTHMIC_SHOWCASE_WALL_HEIGHT * 0.5).toBeGreaterThanOrEqual(0);
    expect(RHYTHMIC_SHOWCASE_WALL_CENTER_Y - RHYTHMIC_SHOWCASE_WALL_HEIGHT * 0.5).toBeLessThanOrEqual(-540);
  });

  it("expands the receiver and room backdrop to cover a real long MIDI course", () => {
    // Measured from Anh Chi Biet Cam Nin Nghe Tieng Em Khoc.mid (1,018 notes).
    const bounds = courseBackdropBounds([-2.8282, -891.3458]);

    expect(bounds.topY).toBeGreaterThan(-2.8282);
    expect(bounds.bottomY).toBeLessThan(-891.3458);
    expect(bounds.height).toBeGreaterThan(900);
    expect(bounds.centerY + bounds.height * 0.5).toBeCloseTo(bounds.topY, 6);
    expect(bounds.centerY - bounds.height * 0.5).toBeCloseTo(bounds.bottomY, 6);
  });
});
