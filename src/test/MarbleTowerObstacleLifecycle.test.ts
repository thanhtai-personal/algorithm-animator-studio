import { describe, expect, it } from "vitest";
import * as CANNON from "cannon-es";
import {
  canCullCourseObject,
  CourseObjectLifecycle,
} from "../features/marble-tower-video/physics/CourseObjectLifecycle";

describe("Marble Tower obstacle lifecycle", () => {
  it("keeps an obstacle while even one marble can still reach it", () => {
    expect(canCullCourseObject({
      rangeEnd: 0.3,
      marbleProgress: [0.7, 0.55, 0.31],
      cameraProgress: 0.7,
    })).toBe(false);
  });

  it("keeps an obstacle until the camera has moved safely beyond it", () => {
    expect(canCullCourseObject({
      rangeEnd: 0.3,
      marbleProgress: [0.42, 0.4, 0.39],
      cameraProgress: 0.34,
    })).toBe(false);
  });

  it("culls only after every marble and the camera are safely ahead", () => {
    expect(canCullCourseObject({
      rangeEnd: 0.3,
      marbleProgress: [0.58, 0.49, 0.42],
      cameraProgress: 0.58,
    })).toBe(true);
  });

  it("removes retired collider bodies from the physics world once", () => {
    const world = new CANNON.World();
    const body = new CANNON.Body({ mass: 0 });
    world.addBody(body);
    const lifecycle = new CourseObjectLifecycle();
    lifecycle.register("spinner-a", 0.3, [body]);
    lifecycle.setInView("spinner-a", false);

    lifecycle.update([0.58, 0.49, 0.42], 0.58, world);
    lifecycle.update([0.6, 0.55, 0.5], 0.6, world);

    expect(lifecycle.isVisible("spinner-a")).toBe(false);
    expect(world.bodies).not.toContain(body);
  });

  it("does not retire an object that is still inside the real camera frustum", () => {
    const world = new CANNON.World();
    const body = new CANNON.Body({ mass: 0 });
    world.addBody(body);
    const lifecycle = new CourseObjectLifecycle();
    lifecycle.register("spinner-a", 0.3, [body]);
    lifecycle.setInView("spinner-a", true);

    lifecycle.update([0.58, 0.49, 0.42], 0.58, world);

    expect(lifecycle.isVisible("spinner-a")).toBe(true);
    expect(world.bodies).toContain(body);
  });
});
