import { afterEach, describe, expect, it } from "vitest";
import { RacePhysics } from "../features/marble-tower-video/physics/RacePhysics";

function throwMarbleOffTrack(physics: RacePhysics) {
  const marble = physics.getRanked().find((candidate) => candidate.alive)!;
  const sample = physics.course.samples[marble.progressIndex];
  marble.body.position.set(
    sample.point.x + sample.right.x * (physics.course.trackWidth / 2 + 4),
    sample.point.y + sample.right.y * (physics.course.trackWidth / 2 + 4),
    sample.point.z + sample.right.z * (physics.course.trackWidth / 2 + 4),
  );
  return marble;
}

describe("Marble Tower fall elimination", () => {
  let physics: RacePhysics | null = null;

  afterEach(() => {
    physics?.dispose();
    physics = null;
  });

  it("eliminates a marble that falls outside the race road instead of teleporting it back", () => {
    physics = new RacePhysics(() => undefined, 1.05, undefined, 10);
    physics.advanceTo(3.05);
    physics.releaseStart();
    const marble = throwMarbleOffTrack(physics);
    const aliveBefore = physics.getRanked().filter((candidate) => candidate.alive).length;

    physics.step(1 / 30, false);

    expect(marble.alive).toBe(false);
    expect(marble.finalPosition).toBe(aliveBefore);
    expect(marble.body.collisionResponse).toBe(false);
    expect(marble.body.position.y).toBeLessThan(-100);
    expect(physics.getLeader()?.id).not.toBe(marble.id);
  });
});
