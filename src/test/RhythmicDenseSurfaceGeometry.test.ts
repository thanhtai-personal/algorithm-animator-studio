import { describe, expect, it } from "vitest";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import { denseSurfaceSegments } from "../features/rhythmic-studio/engine/denseSurfaceGeometry";

function platform(index: number, x: number, layout: MarblePlatform["denseLayout"], surfaceId = 3): MarblePlatform {
  return {
    index,
    x,
    y: 100,
    width: 30,
    thickness: 8,
    tiltRad: 0,
    color: "#22d3ee",
    contactX: x,
    contactY: 100,
    hitX: x,
    hitY: 86,
    normalX: 0,
    normalY: -1,
    outVX: 150,
    outVY: 0,
    gravity: 680,
    contactMode: "surface",
    event: { id: String(index), timeMs: index * 100, midi: 60 + index, velocity: 0.8, durationMs: 90 },
    motionMode: "roll",
    denseRunId: 1,
    denseSurfaceId: surfaceId,
    denseLayout: layout,
  };
}

describe("dense surface geometry", () => {
  it("builds one continuous segment per neighbouring strike on the same rail", () => {
    const segments = denseSurfaceSegments([
      platform(0, 10, "parallel-rails"),
      platform(1, 34, "connected-keys"),
      platform(2, 46, "connected-keys"),
    ]);

    expect(segments).toEqual([
      expect.objectContaining({ fromX: 10, toX: 34, layout: "parallel-rails" }),
      expect.objectContaining({ fromX: 34, toX: 46, layout: "connected-keys" }),
    ]);
  });

  it("does not bridge separate surfaces or hidden chord members", () => {
    const hidden = { ...platform(1, 30, "parallel-rails"), visualHidden: true };
    expect(denseSurfaceSegments([
      platform(0, 10, "parallel-rails"),
      hidden,
      platform(2, 50, "parallel-rails", 4),
    ])).toEqual([]);
  });
});
