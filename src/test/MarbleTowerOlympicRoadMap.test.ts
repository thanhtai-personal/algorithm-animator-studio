import { describe, expect, it } from "vitest";
import * as CANNON from "cannon-es";
import { createCourseObstacleBodies } from "../features/marble-tower-video/physics/buildTowerCoursePhysics";
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
    expect(OLYMPIC_ROAD_POINTS.length).toBeGreaterThan(45);
    expect(OLYMPIC_ROAD_SAMPLES.length).toBeGreaterThanOrEqual(300);
  });

  it("keeps the road gravity-driven from the high launch chute to the low finish", () => {
    const start = OLYMPIC_ROAD_SAMPLES[0].point;
    const finish = OLYMPIC_ROAD_SAMPLES.at(-1)!.point;
    expect(start.y - finish.y).toBeGreaterThan(25);
    expect(OLYMPIC_ROAD_COURSE.specials.finish).toBeGreaterThan(0.97);
    expect(OLYMPIC_ROAD_COURSE.towerInstruments).toBe(false);
  });

  it("contains every major module visible in the reference toy track", () => {
    const sectionIds = OLYMPIC_ROAD_SECTIONS.map((section) => section.id);
    expect(sectionIds).toEqual([
      "road-launch",
      "road-showcase-hairpin",
      "road-spiral-bowl",
      "road-choice-gates",
      "road-switchbacks",
      "road-slalom",
      "road-final-chute",
      "road-finish-podium",
    ]);
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

  it("selects the hollow plastic impact profile for the reference toy road", () => {
    expect(OLYMPIC_ROAD_COURSE.obstacleSoundVariant).toBe(1);
  });
});
