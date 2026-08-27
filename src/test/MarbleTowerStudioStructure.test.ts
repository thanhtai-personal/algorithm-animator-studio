import * as CANNON from "cannon-es";
import { describe, expect, it } from "vitest";
import { createStudioStructureBodies } from "../features/marble-tower-video/physics/buildTowerCoursePhysics";
import { STUDIO_SOLIDS } from "../features/marble-tower-video/race/studioStructure";
import { COURSE_SAMPLES } from "../features/marble-tower-video/track/towerCourseSampler";
import { MARBLE_RADIUS, TRACK_WIDTH } from "../features/marble-tower-video/track/towerCourse";

describe("Marble Tower studio structure collisions", () => {
  it("keeps decorative columns outside the complete marble lane envelope", () => {
    const requiredClearance = TRACK_WIDTH / 2 + MARBLE_RADIUS;
    STUDIO_SOLIDS.forEach((solid) => {
      const clearance = Math.min(...COURSE_SAMPLES.map((sample) => {
        const dx = Math.abs(sample.point.x - solid.position[0]);
        const dz = Math.abs(sample.point.z - solid.position[2]);
        if (solid.kind === "cylinder") return Math.hypot(dx, dz) - solid.radiusBottom;
        return Math.hypot(
          Math.max(0, dx - solid.size[0] / 2),
          Math.max(0, dz - solid.size[2] / 2),
        );
      }));

      expect(clearance, solid.id).toBeGreaterThan(requiredClearance);
    });
  });

  it("builds a physics body for every solid column rendered in the studio", () => {
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, 0) });
    const bodies = createStudioStructureBodies(world, new CANNON.Material("structure"));

    expect(bodies).toHaveLength(STUDIO_SOLIDS.length);
    STUDIO_SOLIDS.forEach((solid, index) => {
      expect(bodies[index].position.x).toBeCloseTo(solid.position[0]);
      expect(bodies[index].position.y).toBeCloseTo(solid.position[1]);
      expect(bodies[index].position.z).toBeCloseTo(solid.position[2]);
      expect(bodies[index].collisionResponse).toBe(true);
    });
  });

  it("stops a fast marble instead of letting it cross a visible column", () => {
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, 0) });
    const material = new CANNON.Material("structure");
    createStudioStructureBodies(world, material);
    const column = STUDIO_SOLIDS.find((solid) => solid.kind === "box");
    if (!column || column.kind !== "box") throw new Error("Expected a box studio column");
    const marble = new CANNON.Body({
      mass: 5.2,
      material,
      shape: new CANNON.Sphere(0.48),
      position: new CANNON.Vec3(column.position[0] - 1.2, column.position[1], column.position[2]),
      velocity: new CANNON.Vec3(25, 0, 0),
    });
    world.addBody(marble);

    for (let index = 0; index < 24; index += 1) world.step(1 / 120);

    expect(marble.position.x).toBeLessThan(column.position[0] - 0.4);
    expect(marble.velocity.x).toBeLessThanOrEqual(0);
  });
});
