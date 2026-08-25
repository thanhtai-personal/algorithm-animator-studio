import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import { projectPresetCamera } from "../features/rhythmic-studio/lib/presetCamera";
import {
  PLATFORM_PRELOAD_MARGIN_PX,
  platformIsInside2DRenderWindow,
  platformsMountedFor3D,
} from "../features/rhythmic-studio/lib/platformViewport";

function platform(overrides: Partial<MarblePlatform> = {}): MarblePlatform {
  return {
    index: 0,
    x: 360,
    y: 240,
    width: 100,
    thickness: 24,
    tiltRad: 0,
    color: "#ff5d68",
    contactX: 360,
    contactY: 225,
    hitX: 360,
    hitY: 210,
    normalX: 0,
    normalY: -1,
    outVX: 0,
    outVY: -1,
    gravity: 900,
    contactMode: "surface",
    event: { id: "note", timeMs: -60_000, midi: 60, velocity: 1, durationMs: 120 },
    ...overrides,
  };
}

describe("rhythmic platform viewport lifecycle", () => {
  it("keeps every 3D instrument mounted so Three can frustum-cull it spatially", () => {
    const items = [
      platform({ index: 0, event: { ...platform().event, id: "past", timeMs: -60_000 } }),
      platform({ index: 1, event: { ...platform().event, id: "future", timeMs: 60_000 } }),
    ];

    expect(platformsMountedFor3D(items)).toEqual(items);
  });

  it("preloads a 2D instrument before entry and keeps it after leaving the frame", () => {
    const viewport = { width: 720, height: 1280, cameraX: 0, cameraY: 0 };
    const beforeEntry = platform({ y: -PLATFORM_PRELOAD_MARGIN_PX + 20 });
    const afterExit = platform({ y: 1280 + PLATFORM_PRELOAD_MARGIN_PX - 20 });

    expect(platformIsInside2DRenderWindow(beforeEntry, DEFAULT_SETTINGS, viewport)).toBe(true);
    expect(platformIsInside2DRenderWindow(afterExit, DEFAULT_SETTINGS, viewport)).toBe(true);
  });

  it("removes a 2D instrument only after its full bounds clear the overscan", () => {
    const viewport = { width: 720, height: 1280, cameraX: 0, cameraY: 0 };
    const farAbove = platform({ y: -PLATFORM_PRELOAD_MARGIN_PX - 100 });
    const farBelow = platform({ y: 1280 + PLATFORM_PRELOAD_MARGIN_PX + 100 });

    expect(platformIsInside2DRenderWindow(farAbove, DEFAULT_SETTINGS, viewport)).toBe(false);
    expect(platformIsInside2DRenderWindow(farBelow, DEFAULT_SETTINGS, viewport)).toBe(false);
  });

  it("uses visual platform bounds instead of event age or hitY ordering", () => {
    const viewport = { width: 720, height: 1280, cameraX: 0, cameraY: 0 };
    const stillCrossingRightEdge = platform({
      x: 790,
      y: 500,
      hitY: -20_000,
      visualWidth: 220,
      event: { ...platform().event, timeMs: -90_000 },
    });

    expect(platformIsInside2DRenderWindow(stillCrossingRightEdge, DEFAULT_SETTINGS, viewport)).toBe(true);
  });
});

describe("rhythmic 2D camera projection", () => {
  it("preserves platform angles for every camera profile", () => {
    const origin = { x: 360, y: 640 };
    const angle = 0.63;
    const endpoint = { x: origin.x + Math.cos(angle) * 120, y: origin.y + Math.sin(angle) * 120 };

    for (const cameraProfile of ["follow", "xylophone", "tube-board", "comet"] as const) {
      const settings = { ...DEFAULT_SETTINGS, cameraProfile };
      const projectedOrigin = projectPresetCamera(origin, settings, 720, 1280);
      const projectedEndpoint = projectPresetCamera(endpoint, settings, 720, 1280);
      const projectedAngle = Math.atan2(
        projectedEndpoint.y - projectedOrigin.y,
        projectedEndpoint.x - projectedOrigin.x,
      );

      expect(projectedAngle, cameraProfile).toBeCloseTo(angle, 10);
    }
  });
});
