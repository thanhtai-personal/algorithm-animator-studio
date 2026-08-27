import { afterEach, describe, expect, it } from "vitest";
import { RacePhysics } from "../features/marble-tower-video/physics/RacePhysics";
import { launchImpulse, rollingSphereAcceleration } from "../features/marble-tower-video/physics/marbleForces";
import { COURSE_SAMPLES } from "../features/marble-tower-video/track/towerCourseSampler";
import { TOWER_DRIVE_BELTS, TRACK_WIDTH } from "../features/marble-tower-video/track/towerCourse";

function minimumDeckClearance() {
  const minimumIndexGap = Math.round(COURSE_SAMPLES.length * 0.1);
  const overlapRadius = TRACK_WIDTH / 2;
  let clearance = Number.POSITIVE_INFINITY;

  for (let first = 0; first < COURSE_SAMPLES.length; first += 1) {
    for (let second = first + minimumIndexGap; second < COURSE_SAMPLES.length; second += 1) {
      const a = COURSE_SAMPLES[first].point;
      const b = COURSE_SAMPLES[second].point;
      if (Math.hypot(a.x - b.x, a.z - b.z) > overlapRadius) continue;
      clearance = Math.min(clearance, Math.abs(a.y - b.y));
    }
  }

  return clearance;
}

describe("Marble Tower natural course", () => {
  let physics: RacePhysics | null = null;

  afterEach(() => {
    physics?.dispose();
    physics = null;
  });

  it("leaves enough height between overlapping Map 1 floors for a race camera", () => {
    expect(minimumDeckClearance()).toBeGreaterThanOrEqual(6);
  });

  it("uses the launch only as a gate nudge instead of the main source of speed", () => {
    const impulse = launchImpulse(COURSE_SAMPLES[4], 5.2, 8.25);
    const launchDeltaV = impulse.length() / 5.2;

    expect(launchDeltaV).toBeGreaterThanOrEqual(0.6);
    expect(launchDeltaV).toBeLessThanOrEqual(1.501);
  });

  it("derives rolling acceleration from gravity, slope and rolling resistance", () => {
    const slopeSin = Math.sin(12 * Math.PI / 180);
    const rollingResistance = 0.012;
    const expected = (5 / 7) * 9.81 * (
      slopeSin - rollingResistance * Math.sqrt(1 - slopeSin ** 2)
    );

    expect(rollingSphereAcceleration(slopeSin, rollingResistance, 9.81)).toBeCloseTo(expected, 8);
    expect(rollingSphereAcceleration(Math.sin(18 * Math.PI / 180), rollingResistance, 9.81)).toBeGreaterThan(expected);
  });

  it("leaves bypass lanes around the final speed-reduction cross", () => {
    physics = new RacePhysics(() => undefined, 1.05, undefined, 24);
    const armHalfLengths = physics.finalCross.body.shapes.map((shape) => {
      const box = shape as { halfExtents?: { x: number; z: number } };
      return Math.max(box.halfExtents?.x ?? 0, box.halfExtents?.z ?? 0);
    });

    expect(Math.max(...armHalfLengths)).toBeLessThanOrEqual(TRACK_WIDTH * 0.31);
  });

  it("places a powered belt on the shallow final run", () => {
    const finalBelt = TOWER_DRIVE_BELTS.find((belt) => belt.from <= 0.94 && belt.to >= 0.97);

    expect(finalBelt).toMatchObject({ targetSpeed: 7, maxAcceleration: 4.2 });
  });

  it("lets gravity carry a 24-marble field through Map 1 without a total stall", () => {
    let winnerTimeMs: number | null = null;
    physics = new RacePhysics((result) => { winnerTimeMs = result.timeMs; }, 8.25, undefined, 24);
    physics.advanceTo(3.05);
    physics.releaseStart();
    const checkpoints: Array<{ time: number; progress: number; speed: number }> = [];
    for (let time = 8; time <= 63; time += 5) {
      physics.advanceTo(time);
      const leader = physics.getLeader();
      checkpoints.push({
        time,
        progress: Number(((leader?.progressIndex ?? 0) / (physics.course.samples.length - 1)).toFixed(3)),
        speed: Number((leader?.body.velocity.length() ?? 0).toFixed(2)),
      });
    }

    const diagnostics = physics.getRanked().slice(0, 8).map((marble) => ({
      progress: Number((marble.progressIndex / (physics!.course.samples.length - 1)).toFixed(3)),
      speed: Number(marble.body.velocity.length().toFixed(2)),
      stuckFor: Number(marble.stuckFor.toFixed(2)),
    }));
    expect(winnerTimeMs, JSON.stringify({ checkpoints, diagnostics })).not.toBeNull();
    expect(winnerTimeMs ?? Number.POSITIVE_INFINITY).toBeLessThan(60_000);
  }, 40_000);
});
