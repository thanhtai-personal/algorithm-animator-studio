import { afterEach, describe, expect, it } from "vitest";
import { RacePhysics } from "../features/marble-tower-video/physics/RacePhysics";
import { START_GATE_Z } from "../features/marble-tower-video/track/trackLayout";

describe("Marble Tower start gate", () => {
  let physics: RacePhysics | null = null;

  afterEach(() => {
    physics?.dispose();
    physics = null;
  });

  it("stops colliding as soon as the countdown reaches GO", () => {
    physics = new RacePhysics("blue", () => undefined);

    physics.advanceTo(3.05);

    expect(physics.obstacles.startGate.collisionResponse).toBe(false);
  });

  it("lets the field pass the start line after GO", () => {
    physics = new RacePhysics("blue", () => undefined);

    physics.advanceTo(5.5);

    const frontRunnerZ = Math.max(...[...physics.marbles.values()].map((marble) => marble.body.position.z));
    expect(frontRunnerZ).toBeGreaterThan(START_GATE_Z + 1);
  });
});
