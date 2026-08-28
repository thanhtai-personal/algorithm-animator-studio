import { describe, expect, it } from "vitest";
import {
  OLYMPIC_ROAD_CAMERA_SHOTS,
  olympicRoadCameraAnchorProgress,
  olympicRoadCameraShot,
} from "../features/marble-tower-video/camera/olympicRoadCameraPlan";

describe("Marble Tower Map 2 long-road camera", () => {
  it("covers the eight road sectors with chase and side-follow shots", () => {
    expect(OLYMPIC_ROAD_CAMERA_SHOTS.map((shot) => shot.id)).toEqual([
      "launch-follow",
      "s-bend-sweep",
      "ridge-follow",
      "choice-gates",
      "switchback-chase",
      "slalom-chase",
      "final-slope-chase",
      "finish-front",
    ]);
  });

  it("keeps the camera behind or beside the pack until the finish instead of locking above a spiral", () => {
    OLYMPIC_ROAD_CAMERA_SHOTS.slice(0, -1).forEach((shot) => {
      expect(shot.behind, shot.id).toBeGreaterThanOrEqual(9);
      expect(shot.lift, shot.id).toBeLessThanOrEqual(10);
    });
    expect(olympicRoadCameraShot(0.98).behind).toBeLessThan(0);
  });

  it("retains a stable per-sector midpoint for preview thumbnails and editor helpers", () => {
    OLYMPIC_ROAD_CAMERA_SHOTS.forEach((shot) => {
      const anchor = olympicRoadCameraAnchorProgress(shot);
      expect(anchor, shot.id).toBeGreaterThan(shot.from);
      expect(anchor, shot.id).toBeLessThan(shot.to);
      expect(anchor, shot.id).toBeCloseTo(shot.from + (shot.to - shot.from) * 0.52, 5);
    });
  });

  it("alternates side angles while keeping the final camera ahead of the marbles", () => {
    const sides = OLYMPIC_ROAD_CAMERA_SHOTS.map((shot) => Math.sign(shot.side));
    expect(sides).toContain(-1);
    expect(sides).toContain(1);
    expect(olympicRoadCameraShot(0.98).behind).toBeLessThan(0);
  });

  it("keeps every shot wide enough to show road context without revealing stacked decks", () => {
    OLYMPIC_ROAD_CAMERA_SHOTS.forEach((shot) => {
      expect(Math.hypot(shot.behind, shot.lift, shot.side), shot.id).toBeGreaterThanOrEqual(10);
      expect(shot.lift, shot.id).toBeGreaterThanOrEqual(7);
      expect(shot.fov, shot.id).toBeGreaterThanOrEqual(46);
      expect(shot.fov, shot.id).toBeLessThanOrEqual(52);
    });
  });
});
