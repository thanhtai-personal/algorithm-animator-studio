import { describe, expect, it } from "vitest";
import { OLYMPIC_ROAD_COURSE, RACE_MAPS, raceCourseForMap } from "../features/marble-tower-video/track/raceCourse";
import { OLYMPIC_ROAD_MAP_ID, OLYMPIC_ROAD_POINTS, OLYMPIC_ROAD_SAMPLES } from "../features/marble-tower-video/track/olympicRoadCourse";

 describe("Marble Tower Map 2 Olympic Road", () => {
  it("adds a distinct long road map without replacing the original tower", () => {
    expect(RACE_MAPS.map((map) => map.id)).toContain(OLYMPIC_ROAD_MAP_ID);
    expect(raceCourseForMap(OLYMPIC_ROAD_MAP_ID)).toBe(OLYMPIC_ROAD_COURSE);
    expect(OLYMPIC_ROAD_POINTS.length).toBeGreaterThan(30);
    expect(OLYMPIC_ROAD_SAMPLES.length).toBeGreaterThan(200);
  });

  it("keeps the road gravity-driven from the high launch chute to the low finish", () => {
    const start = OLYMPIC_ROAD_SAMPLES[0].point;
    const finish = OLYMPIC_ROAD_SAMPLES.at(-1)!.point;
    expect(start.y - finish.y).toBeGreaterThan(25);
    expect(OLYMPIC_ROAD_COURSE.specials.finish).toBeGreaterThan(0.97);
    expect(OLYMPIC_ROAD_COURSE.towerInstruments).toBe(false);
  });

  it("contains the reference-inspired hairpin, spiral, S-curve and hazard sectors", () => {
    const labels = OLYMPIC_ROAD_SAMPLES.map((sample) => sample.section.id);
    expect(labels).toContain("road-hairpin");
    expect(labels).toContain("road-spiral");
    expect(labels).toContain("road-s");
    expect(labels).toContain("road-hazard");
  });
});
