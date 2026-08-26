import * as CANNON from "cannon-es";
import { describe, expect, it } from "vitest";
import { COURSE_SAMPLES } from "../features/marble-tower-video/track/towerCourseSampler";
import { chimeBounceImpulse, pianoBoostImpulse } from "../features/marble-tower-video/physics/marbleForces";
import {
  PIANO_TRAIL_SECONDS,
  pianoTrailStrength,
} from "../features/marble-tower-video/physics/marbleBoostTrail";
import { createRaceMaterials } from "../features/marble-tower-video/physics/createRaceMaterials";

describe("Marble Tower instrument responses", () => {
  it("boosts from a piano key only along the course, not into the air", () => {
    const sample = COURSE_SAMPLES[106];
    const impulse = pianoBoostImpulse(sample, 5.2, 2.4);

    expect(impulse.dot(sample.tangent)).toBeGreaterThan(0);
    expect(Math.abs(impulse.dot(sample.normal))).toBeLessThan(1e-6);
  });

  it("gives a chime column a small outward deflection without a sky launch", () => {
    const sample = COURSE_SAMPLES[91];
    const body = new CANNON.Body({ mass: 5.2 });
    const contactPosition = sample.point.clone()
      .addScaledVector(sample.right, 1)
      .addScaledVector(sample.normal, 0.8);
    body.position.set(contactPosition.x, contactPosition.y, contactPosition.z);
    body.velocity.set(sample.tangent.x * 8, sample.tangent.y * 8, sample.tangent.z * 8);
    const chime = new CANNON.Vec3(sample.point.x, sample.point.y, sample.point.z);
    const deltaV = chimeBounceImpulse(sample, body, chime, 5.2, 0).multiplyScalar(1 / 5.2);

    expect(deltaV.dot(sample.right)).toBeGreaterThan(0.45);
    expect(deltaV.dot(sample.right)).toBeLessThan(1.4);
    expect(deltaV.dot(sample.tangent)).toBeLessThan(1.5);
    expect(Math.abs(deltaV.dot(sample.normal))).toBeLessThan(0.14);
  });

  it("fades a piano-triggered trail over a short deterministic window", () => {
    const hitAt = 7;
    const until = hitAt + PIANO_TRAIL_SECONDS;

    expect(pianoTrailStrength(until, hitAt)).toBe(1);
    expect(pianoTrailStrength(until, hitAt + PIANO_TRAIL_SECONDS / 2)).toBeCloseTo(0.5);
    expect(pianoTrailStrength(until, until + 0.01)).toBe(0);
  });

  it("keeps piano restitution lower than chime restitution", () => {
    const world = new CANNON.World();
    const materials = createRaceMaterials(world);
    const pianoContact = world.getContactMaterial(materials.marble, materials.piano);
    const chimeContact = world.getContactMaterial(materials.marble, materials.chime);

    expect(pianoContact.restitution).toBeLessThanOrEqual(0.08);
    expect(chimeContact.restitution).toBeGreaterThan(pianoContact.restitution);
    expect(chimeContact.restitution).toBeLessThanOrEqual(0.3);
  });
});
