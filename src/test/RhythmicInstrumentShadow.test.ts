import { describe, expect, it } from "vitest";
import {
  instrumentShadowGeometry2D,
  projectPointToShadowPlane,
} from "../features/rhythmic-studio/lib/instrumentShadow";

describe("rhythmic instrument shadows", () => {
  it("keeps a contact point fixed when it already lies on the receiver", () => {
    const receiverZ = -4.02;
    const foot = { x: 1.25, y: -7.5, z: receiverZ };

    expect(projectPointToShadowPlane(foot, receiverZ, { x: -2.4, y: 3.2, z: 14 })).toEqual(foot);
  });

  it("lengthens and skews only the part lifted away from the receiver", () => {
    const light = { x: -2.4, y: 3.2, z: 14 };
    const shallow = projectPointToShadowPlane({ x: 0, y: 0, z: -3 }, -4, light);
    const tall = projectPointToShadowPlane({ x: 0, y: 0, z: 0 }, -4, light);

    expect(tall.x).toBeGreaterThan(shallow.x);
    expect(tall.y).toBeLessThan(shallow.y);
    expect(Math.hypot(tall.x, tall.y)).toBeGreaterThan(Math.hypot(shallow.x, shallow.y));
  });

  it("starts a deformed 2D shadow at the instrument foot after rotation", () => {
    const geometry = instrumentShadowGeometry2D({
      width: 120,
      thickness: 20,
      tiltRad: Math.PI / 5,
      style: "instrument-key",
    });

    expect(geometry.nearLeft.y).toBe(geometry.contactY);
    expect(geometry.nearRight.y).toBe(geometry.contactY);
    expect(geometry.farLeft.y).not.toBe(geometry.nearLeft.y);
    expect(geometry.farWidth).not.toBe(geometry.nearWidth);
  });
});
