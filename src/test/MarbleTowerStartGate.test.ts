import { afterEach, describe, expect, it } from "vitest";
import { RacePhysics } from "../features/marble-tower-video/physics/RacePhysics";
import { COURSE_SAMPLES } from "../features/marble-tower-video/track/towerCourseSampler";
import { SPECIALS } from "../features/marble-tower-video/track/towerCourse";

describe("Marble Tower start gate", () => {
  let physics: RacePhysics | null = null;

  afterEach(() => {
    physics?.dispose();
    physics = null;
  });

  it("stops colliding as soon as the countdown reaches GO", () => {
    physics = new RacePhysics(() => undefined);

    physics.advanceTo(3.05);

    expect(physics.startGate.collisionResponse).toBe(false);
  });

  it("launches the field forward along the curved tower course", () => {
    physics = new RacePhysics(() => undefined, 1.8);

    physics.advanceTo(5.5);

    const gateIndex = Math.round(SPECIALS.startGate * (COURSE_SAMPLES.length - 1));
    const frontRunnerProgress = Math.max(...[...physics.marbles.values()].map((marble) => marble.progressIndex));
    expect(frontRunnerProgress).toBeGreaterThan(gateIndex + 2);
  });
});
