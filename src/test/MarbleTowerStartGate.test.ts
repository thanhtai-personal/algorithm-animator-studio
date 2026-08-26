import { afterEach, describe, expect, it } from "vitest";
import { RacePhysics } from "../features/marble-tower-video/physics/RacePhysics";
import { COURSE_SAMPLES } from "../features/marble-tower-video/track/towerCourseSampler";
import { SPECIALS } from "../features/marble-tower-video/track/towerCourse";
import { OLYMPIC_ROAD_MAP_ID, OLYMPIC_ROAD_SAMPLES } from "../features/marble-tower-video/track/olympicRoadCourse";

describe("Marble Tower start gate", () => {
  let physics: RacePhysics | null = null;

  afterEach(() => {
    physics?.dispose();
    physics = null;
  });

  it("waits after 3-2-1 until the spoken cue releases the start", () => {
    physics = new RacePhysics(() => undefined);

    physics.advanceTo(3.05);
    expect(physics.startGate.collisionResponse).toBe(true);

    expect(physics.releaseStart()).toBe(true);
    expect(physics.startGate.collisionResponse).toBe(false);
  });

  it("launches the heavier field forward when the start is released", () => {
    physics = new RacePhysics(() => undefined, 6);

    physics.advanceTo(3.05);
    physics.releaseStart();
    physics.advanceTo(5.5);

    const gateIndex = Math.round(SPECIALS.startGate * (COURSE_SAMPLES.length - 1));
    const frontRunnerProgress = Math.max(...[...physics.marbles.values()].map((marble) => marble.progressIndex));
    expect(frontRunnerProgress).toBeGreaterThan(gateIndex + 2);
  });

  it("keeps the map 2 gate attached to the Olympic launch chute", () => {
    physics = new RacePhysics(() => undefined, 6, undefined, 24, OLYMPIC_ROAD_MAP_ID);

    physics.advanceTo(1);

    const gateSample = OLYMPIC_ROAD_SAMPLES[Math.round(physics.course.specials.startGate * (OLYMPIC_ROAD_SAMPLES.length - 1))];
    const distance = gateSample.point.distanceTo(physics.startGate.position);
    expect(distance).toBeLessThan(3);
  });
});
