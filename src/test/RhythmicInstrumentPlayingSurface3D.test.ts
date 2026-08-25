import { describe, expect, it } from "vitest";
import {
  instrumentPlayingSurface3D,
  instrumentPressOffset3D,
  instrumentSurfaceFrame3D,
} from "../features/rhythmic-studio/components/instrumentPlayingSurface3D";
import type { PlatformStyle } from "../features/rhythmic-studio/types";

const BALL_RADIUS = 0.18;

function expectBallToTouchFace(style: PlatformStyle) {
  const surface = instrumentPlayingSurface3D(style, 1, 0.14, 0.54, BALL_RADIUS);
  const distanceAlongFaceNormal = (BALL_RADIUS + surface.contactCorrection) * surface.normalY
    + surface.marbleContactZ * surface.normalZ;

  expect(surface.normalY).toBeGreaterThan(0.55);
  expect(surface.normalZ).toBeGreaterThan(0.4);
  expect(surface.marbleContactZ).toBeGreaterThan(0);
  expect(distanceAlongFaceNormal).toBeCloseTo(BALL_RADIUS, 6);
  return surface;
}

describe("3D instrument playing surfaces", () => {
  it.each<PlatformStyle>(["drum-disc", "gong-disc", "instrument-cymbal", "instrument-pad"])(
    "lands on the visible playing face of %s instead of its rim",
    (style) => {
      const surface = expectBallToTouchFace(style);
      expect(surface.faceKind).toBe("front");
      expect(surface.pitchRad).toBeLessThan(0);
      expect(surface.localStrikeY).toBe(0);
      expect(surface.localStrikeZ).toBeGreaterThan(0);
    },
  );

  it("uses the cymbal bell as the foremost contact instead of intersecting it", () => {
    const surface = instrumentPlayingSurface3D("instrument-cymbal", 1, 0.14, 0.54, BALL_RADIUS);

    expect(surface.localStrikeZ).toBeGreaterThan(0.12);
  });

  it.each<PlatformStyle>(["piano-key", "piano-keyboard"])(
    "lands on the upper face of %s instead of its underside",
    (style) => {
      const surface = expectBallToTouchFace(style);
      expect(surface.faceKind).toBe("top");
      expect(surface.pitchRad).toBeGreaterThan(0);
      expect(surface.localStrikeY).toBeGreaterThan(0);
      expect(surface.localStrikeZ).toBeGreaterThanOrEqual(0);
    },
  );

  it.each<[PlatformStyle, number]>([
    ["boomwhacker-tube", 0.11],
    ["tube-cylinder", 0.11],
    ["toy-peg", 0.12],
    ["flute-pipe", 0.085],
    ["instrument-wire", 0.126],
    ["instrument-rail", 0.145],
  ])("uses the actual upper tangent of %s as its playing surface", (style, expectedTop) => {
    const surface = expectBallToTouchFace(style);

    expect(surface.faceKind).toBe("top");
    expect(surface.pitchRad).toBeGreaterThan(0);
    expect(surface.localStrikeY).toBeCloseTo(expectedTop, 6);
    expect(surface.localStrikeZ).toBe(0);
  });

  it("depresses piano keys away from the marble along the playing-face normal", () => {
    const surface = instrumentPlayingSurface3D("piano-key", 1, 0.14, 0.54, BALL_RADIUS);
    const offset = instrumentPressOffset3D(surface, 0.06);

    expect(offset.y).toBeLessThan(0);
    expect(offset.z).toBeLessThan(0);
    expect(offset.y * surface.normalY + offset.z * surface.normalZ).toBeCloseTo(-0.06, 6);
  });

  it("keeps the ball tangent when the visible instrument angle is clamped", () => {
    const normalAlignment = Math.cos(32 * Math.PI / 180);
    const surface = instrumentPlayingSurface3D(
      "piano-key",
      1,
      0.14,
      0.54,
      BALL_RADIUS,
      normalAlignment,
    );
    const distance = (BALL_RADIUS * normalAlignment + surface.contactCorrection) * surface.normalY
      + surface.marbleContactZ * surface.normalZ;

    expect(distance).toBeCloseTo(BALL_RADIUS, 6);
  });

  it("turns the playable side toward the ball when an undirected bar angle is flipped", () => {
    const frame = instrumentSurfaceFrame3D(0, 0, 1);

    expect(frame.angleRad).toBeCloseTo(Math.PI);
    expect(frame.normalX).toBeCloseTo(0);
    expect(frame.normalY).toBeCloseTo(1);
    expect(frame.normalAlignment).toBeCloseTo(1);
  });

  it("keeps ordinary bars aligned by their top edge", () => {
    const surface = instrumentPlayingSurface3D("neon-bar", 1, 0.14, 0.54, BALL_RADIUS);

    expect(surface.pitchRad).toBe(0);
    expect(surface.faceKind).toBe("edge");
    expect(surface.normalY).toBe(1);
    expect(surface.normalZ).toBe(0);
    expect(surface.marbleContactZ).toBe(0);
    expect(surface.localStrikeY).toBeCloseTo(0.07);
    expect(surface.localStrikeZ).toBeCloseTo(0.27);
    expect(surface.contactCorrection).toBe(0);
    expect(surface.centerInset).toBeCloseTo(0.07);
    expect(surface.frontDepth).toBeCloseTo(0.27);
  });
});
