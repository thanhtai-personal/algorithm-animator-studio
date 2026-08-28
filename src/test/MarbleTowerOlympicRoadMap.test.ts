import { describe, expect, it } from "vitest";
import * as CANNON from "cannon-es";
import { createCourseObstacleBodies, createSupportBodies } from "../features/marble-tower-video/physics/buildTowerCoursePhysics";
import { RacePhysics } from "../features/marble-tower-video/physics/RacePhysics";
import { OLYMPIC_ROAD_COURSE, RACE_MAPS, raceCourseForMap } from "../features/marble-tower-video/track/raceCourse";
import {
  OLYMPIC_ROAD_MAP_ID,
  OLYMPIC_ROAD_OBSTACLES,
  OLYMPIC_ROAD_POINTS,
  OLYMPIC_ROAD_SAMPLES,
  OLYMPIC_ROAD_SECTIONS,
} from "../features/marble-tower-video/track/olympicRoadCourse";

describe("Marble Tower Map 2 Olympic Road", () => {
  it("adds a distinct long road map without replacing the original tower", () => {
    expect(RACE_MAPS.map((map) => map.id)).toContain(OLYMPIC_ROAD_MAP_ID);
    expect(raceCourseForMap(OLYMPIC_ROAD_MAP_ID)).toBe(OLYMPIC_ROAD_COURSE);
    expect(OLYMPIC_ROAD_POINTS.length).toBeGreaterThan(30);
    expect(OLYMPIC_ROAD_SAMPLES.length).toBeGreaterThanOrEqual(300);
  });

  it("keeps the road gravity-driven from the high launch chute to the low finish", () => {
    const start = OLYMPIC_ROAD_SAMPLES[0].point;
    const finish = OLYMPIC_ROAD_SAMPLES.at(-1)!.point;
    const courseLength = OLYMPIC_ROAD_SAMPLES.reduce((total, sample) => total + sample.lengthToNext, 0);
    expect(start.y - finish.y).toBeGreaterThan(25);
    expect(courseLength).toBeGreaterThan(400);
    expect(courseLength).toBeLessThan(480);
    expect(OLYMPIC_ROAD_COURSE.specials.finish).toBeGreaterThan(0.97);
    expect(OLYMPIC_ROAD_COURSE.towerInstruments).toBe(false);
  });

  it("contains every major module visible in the reference toy track", () => {
    const sectionIds = OLYMPIC_ROAD_SECTIONS.map((section) => section.id);
    expect(sectionIds).toEqual([
      "road-launch-slope",
      "road-fast-s-bends",
      "road-ridge-run",
      "road-choice-gates",
      "road-downhill-switchbacks",
      "road-slalom",
      "road-final-slope",
      "road-finish-podium",
    ]);
  });

  it("spreads Map 2 forward as one long descending road instead of spiraling around a tower axis", () => {
    const z = OLYMPIC_ROAD_POINTS.map((point) => point[2]);
    const y = OLYMPIC_ROAD_POINTS.map((point) => point[1]);
    expect(z.every((value, index) => index === 0 || value > z[index - 1])).toBe(true);
    expect(y.every((value, index) => index === 0 || value <= y[index - 1])).toBe(true);
    expect(y[0] - y[4]).toBeGreaterThan(7);
    expect(z.at(-1)! - z[0]).toBeGreaterThan(300);
  });

  it("uses varied physical toy obstacles instead of repeating one hazard bar", () => {
    const kinds = new Set(OLYMPIC_ROAD_OBSTACLES.map((obstacle) => obstacle.kind));
    expect(kinds).toEqual(new Set(["hazard-diamond", "choice-gate", "slalom-post", "traffic-light"]));
    expect(OLYMPIC_ROAD_OBSTACLES.length).toBeGreaterThanOrEqual(14);
    expect(OLYMPIC_ROAD_OBSTACLES.every((obstacle) => obstacle.progress > 0 && obstacle.progress < 0.96)).toBe(true);
  });

  it("creates one static collider for every configured road obstacle", () => {
    const world = new CANNON.World();
    const material = new CANNON.Material("toy-road-obstacle");
    const bodies = createCourseObstacleBodies(
      world,
      material,
      OLYMPIC_ROAD_SAMPLES,
      OLYMPIC_ROAD_OBSTACLES,
    );
    expect(bodies).toHaveLength(OLYMPIC_ROAD_OBSTACLES.length);
    expect(bodies.every((body) => body.type === CANNON.Body.STATIC)).toBe(true);
  });

  it("keeps structural supports below the sloped driving surface", () => {
    const world = new CANNON.World();
    const bodies = createSupportBodies(
      world,
      new CANNON.Material("toy-road-support"),
      OLYMPIC_ROAD_SAMPLES,
      OLYMPIC_ROAD_COURSE.trackWidth,
    );
    const supportSamples = OLYMPIC_ROAD_SAMPLES.filter((_, index) => index % 12 === 6 && index > 5);

    bodies.forEach((body, index) => {
      const box = body.shapes[0] as CANNON.Box;
      const supportTop = body.position.y + box.halfExtents.y;
      const owner = supportSamples.find((sample) =>
        Math.hypot(sample.point.x - body.position.x, sample.point.z - body.position.z) < 0.01);
      expect(owner).toBeDefined();
      expect(supportTop).toBeLessThanOrEqual((owner?.point.y ?? 0) - 0.35);

      const crossing = OLYMPIC_ROAD_SAMPLES.find((sample) => {
        if (!owner || Math.abs(sample.index - owner.index) <= 20) return false;
        const horizontalDistance = Math.hypot(sample.point.x - body.position.x, sample.point.z - body.position.z);
        return sample.point.y < supportTop && horizontalDistance < OLYMPIC_ROAD_COURSE.trackWidth / 2 + 0.75;
      });
      expect(crossing, `support at ${owner?.index} crosses road at ${crossing?.index}`).toBeUndefined();
    });
  });

  it("selects the hollow plastic impact profile for the reference toy road", () => {
    expect(OLYMPIC_ROAD_COURSE.obstacleSoundVariant).toBe(1);
  });

  it("leaves a three-marble-wide lane through the choice gates", () => {
    const gates = OLYMPIC_ROAD_OBSTACLES
      .filter((obstacle) => obstacle.kind === "choice-gate")
      .sort((a, b) => a.lateral - b.lateral);
    const openings: number[] = [];
    let previousEdge = -OLYMPIC_ROAD_COURSE.trackWidth / 2;
    gates.forEach((gate) => {
      const halfWidth = gate.collider[0] / 2;
      openings.push(gate.lateral - halfWidth - previousEdge);
      previousEdge = gate.lateral + halfWidth;
    });
    openings.push(OLYMPIC_ROAD_COURSE.trackWidth / 2 - previousEdge);

    expect(Math.max(...openings)).toBeGreaterThanOrEqual(3);
  });

  it("places powered rollers after every long low-energy module", () => {
    [0.33, 0.53, 0.68, 0.93].forEach((progress) => {
      const roller = OLYMPIC_ROAD_COURSE.driveBelts.find((belt) => progress >= belt.from && progress <= belt.to);
      expect(roller, `missing roller at ${progress}`).toBeDefined();
      expect(roller?.targetSpeed).toBeGreaterThanOrEqual(7);
    });
  });

  it("carries the default 24-marble field through the complete road without a traffic jam", () => {
    let winnerTimeMs: number | null = null;
    const physics = new RacePhysics(
      (result) => { winnerTimeMs = result.timeMs; },
      1.05,
      undefined,
      24,
      OLYMPIC_ROAD_MAP_ID,
    );
    try {
      physics.advanceTo(3.05);
      physics.releaseStart();
      physics.advanceTo(103);
      const leader = physics.getLeader();
      const progress = (leader?.progressIndex ?? 0) / (physics.course.samples.length - 1);
      const diagnostics = physics.getRanked().slice(0, 8).map((marble) => ({
        progress: Number((marble.progressIndex / (physics.course.samples.length - 1)).toFixed(3)),
        speed: Number(marble.body.velocity.length().toFixed(2)),
        stuckFor: Number(marble.stuckFor.toFixed(2)),
      }));

      expect(winnerTimeMs, `leader progress ${progress.toFixed(3)} ${JSON.stringify(diagnostics)}`).not.toBeNull();
      expect(winnerTimeMs ?? Number.POSITIVE_INFINITY).toBeLessThan(100_000);
    } finally {
      physics.dispose();
    }
  }, 75_000);
});
