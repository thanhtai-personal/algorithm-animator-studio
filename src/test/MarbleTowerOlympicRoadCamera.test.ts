import { describe, expect, it } from "vitest";
import {
  OLYMPIC_ROAD_CAMERA_SHOTS,
  olympicRoadCameraAnchorProgress,
  olympicRoadCameraShot,
} from "../features/marble-tower-video/camera/olympicRoadCameraPlan";

describe("Marble Tower Map 2 reference camera", () => {
  it("covers the eight visual modules with deliberate overhead and tracking shots", () => {
    expect(OLYMPIC_ROAD_CAMERA_SHOTS.map((shot) => shot.id)).toEqual([
      "launch-crane",
      "hairpin-overhead",
      "spiral-lockoff",
      "choice-gates",
      "switchback-pan",
      "slalom-chase",
      "final-chute-front",
      "finish-podium",
    ]);
  });

  it("locks the spiral bowl into a readable top-down composition", () => {
    const shot = olympicRoadCameraShot(0.38);
    expect(shot.id).toBe("spiral-lockoff");
    expect(shot.lift).toBeGreaterThanOrEqual(15);
    expect(Math.abs(shot.behind)).toBeLessThanOrEqual(3);
    expect(Math.abs(shot.side)).toBeLessThanOrEqual(3);
  });

  it("holds a fixed camera position while the pack crosses each module", () => {
    OLYMPIC_ROAD_CAMERA_SHOTS.forEach((shot) => {
      const anchor = olympicRoadCameraAnchorProgress(shot);
      expect(anchor, shot.id).toBeGreaterThan(shot.from);
      expect(anchor, shot.id).toBeLessThan(shot.to);
      expect(anchor, shot.id).toBeCloseTo(shot.from + (shot.to - shot.from) * 0.52, 5);
    });
  });

  it("pans around the modular road and finishes from ahead of the marbles", () => {
    const sides = OLYMPIC_ROAD_CAMERA_SHOTS.map((shot) => Math.sign(shot.side));
    expect(sides).toContain(-1);
    expect(sides).toContain(1);
    expect(olympicRoadCameraShot(0.93).behind).toBeLessThan(0);
    expect(olympicRoadCameraShot(0.98).behind).toBeLessThan(0);
  });

  it("keeps every shot wide and elevated enough to show the toy-track obstacle context", () => {
    OLYMPIC_ROAD_CAMERA_SHOTS.forEach((shot) => {
      expect(Math.hypot(shot.behind, shot.lift, shot.side), shot.id).toBeGreaterThanOrEqual(10);
      expect(shot.lift, shot.id).toBeGreaterThanOrEqual(7);
      expect(shot.fov, shot.id).toBeGreaterThanOrEqual(46);
      expect(shot.fov, shot.id).toBeLessThanOrEqual(58);
    });
  });
});
