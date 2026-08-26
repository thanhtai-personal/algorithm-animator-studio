import * as CANNON from "cannon-es";
import { describe, expect, it } from "vitest";
import { createStudioStructureBodies } from "../features/marble-tower-video/physics/buildTowerCoursePhysics";
import { STUDIO_SOLIDS } from "../features/marble-tower-video/race/studioStructure";

describe("Marble Tower studio structure collisions", () => {
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
    const marble = new CANNON.Body({
      mass: 5.2,
      material,
      shape: new CANNON.Sphere(0.48),
      position: new CANNON.Vec3(-1.2, 18, 18),
      velocity: new CANNON.Vec3(25, 0, 0),
    });
    world.addBody(marble);

    for (let index = 0; index < 24; index += 1) world.step(1 / 120);

    expect(marble.position.x).toBeLessThan(-0.4);
    expect(marble.velocity.x).toBeLessThanOrEqual(0);
  });
});
