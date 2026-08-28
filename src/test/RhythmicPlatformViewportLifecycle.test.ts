import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import {
  cameraOffsetFor2DFocus,
  presetCameraAnchorX,
  presetCameraScale,
  projectPresetCamera,
  unprojectPresetCamera,
} from "../features/rhythmic-studio/lib/presetCamera";
import {
  KOROBEINIKI_3D_RETAIN_BEHIND_PX,
  PLATFORM_3D_PRELOAD_AHEAD_PX,
  PLATFORM_3D_RETAIN_BEHIND_PX,
  PLATFORM_PRELOAD_AHEAD_COUNT,
  platformRenderMargin2D,
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
  it("preloads 3D instruments before entry and removes only items beyond the spatial overscan", () => {
    const focusY = 5_000;
    const items = [
      platform({ index: 0, y: focusY - PLATFORM_3D_RETAIN_BEHIND_PX - 300 }),
      platform({ index: 1, y: focusY - PLATFORM_3D_RETAIN_BEHIND_PX + 100 }),
      platform({ index: 2, y: focusY }),
      platform({ index: 3, y: focusY + PLATFORM_3D_PRELOAD_AHEAD_PX - 100 }),
      platform({ index: 4, y: focusY + PLATFORM_3D_PRELOAD_AHEAD_PX + 300 }),
    ];

    expect(platformsMountedFor3D(items, 2).map((item) => item.index)).toEqual([1, 2, 3]);
  });

  it("keeps Korobeiniki wall tubes mounted longer so their shadows do not pop out early", () => {
    const focusY = 5_000;
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: "boomwhacker" as const, instrumentLayout: "wall-score" as const };
    const items = [
      platform({ index: 0, y: focusY - KOROBEINIKI_3D_RETAIN_BEHIND_PX + 120 }),
      platform({ index: 1, y: focusY }),
      platform({ index: 2, y: focusY + 400 }),
    ];

    expect(platformsMountedFor3D(items, 1, settings).map((item) => item.index)).toEqual([0, 1, 2]);
    expect(platformsMountedFor3D(items, 1).map((item) => item.index)).toEqual([1, 2]);
  });

  it("preloads a 2D instrument before entry and keeps it after leaving the frame", () => {
    const viewport = { width: 720, height: 1280, cameraX: 0, cameraY: 0 };
    const margin = platformRenderMargin2D(DEFAULT_SETTINGS);
    const beforeY = unprojectPresetCamera({ x: 360, y: -margin.vertical + 60 }, DEFAULT_SETTINGS, 720, 1280).y;
    const afterY = unprojectPresetCamera({ x: 360, y: 1280 + margin.vertical - 60 }, DEFAULT_SETTINGS, 720, 1280).y;
    const beforeEntry = platform({ y: beforeY });
    const afterExit = platform({ y: afterY });

    expect(platformIsInside2DRenderWindow(beforeEntry, DEFAULT_SETTINGS, viewport)).toBe(true);
    expect(platformIsInside2DRenderWindow(afterExit, DEFAULT_SETTINGS, viewport)).toBe(true);
  });

  it("removes a 2D instrument only after its full bounds clear the overscan", () => {
    const viewport = { width: 720, height: 1280, cameraX: 0, cameraY: 0 };
    const margin = platformRenderMargin2D(DEFAULT_SETTINGS);
    const aboveY = unprojectPresetCamera({ x: 360, y: -margin.vertical - 160 }, DEFAULT_SETTINGS, 720, 1280).y;
    const belowY = unprojectPresetCamera({ x: 360, y: 1280 + margin.vertical + 160 }, DEFAULT_SETTINGS, 720, 1280).y;
    const farAbove = platform({ y: aboveY });
    const farBelow = platform({ y: belowY });

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

  it("preloads a full run of fast instruments before any edge can pop into view", () => {
    const margin = platformRenderMargin2D(DEFAULT_SETTINGS);
    const cameraScale = presetCameraScale(DEFAULT_SETTINGS);

    expect(margin.vertical / cameraScale).toBeGreaterThanOrEqual(
      DEFAULT_SETTINGS.platformGap * PLATFORM_PRELOAD_AHEAD_COUNT + DEFAULT_SETTINGS.platformWidth,
    );
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

  it("keeps every 2D preset close enough for instrument faces to remain readable", () => {
    for (const cameraProfile of ["follow", "xylophone", "tube-board", "comet"] as const) {
      const settings = { ...DEFAULT_SETTINGS, cameraProfile };
      const minimumReadableScale = cameraProfile === "xylophone" ? 1.45 : 1.28;
      expect(presetCameraScale(settings), cameraProfile).toBeGreaterThanOrEqual(minimumReadableScale);
    }
  });

  it("places the tracked marble exactly on the requested screen anchor after preset zoom", () => {
    const focus = { x: 488, y: 914 };
    for (const [width, height] of [[720, 1280], [1280, 720]] as const) {
      for (const cameraProfile of ["follow", "xylophone", "tube-board", "comet"] as const) {
        const settings = { ...DEFAULT_SETTINGS, cameraProfile, cameraAnchor: 0.43 };
        const camera = cameraOffsetFor2DFocus(focus, settings, width, height);
        const screen = projectPresetCamera({
          x: focus.x - camera.x,
          y: focus.y - camera.y,
        }, settings, width, height);

        expect(screen.x, `${cameraProfile} ${width}x${height}`).toBeCloseTo(width * presetCameraAnchorX(settings), 8);
        expect(screen.y, `${cameraProfile} ${width}x${height}`).toBeCloseTo(height * settings.cameraAnchor, 8);
      }
    }
  });
});
