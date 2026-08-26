import { describe, expect, it } from "vitest";
import { marbleImpactProfile } from "../features/rhythmic-studio/lib/marbleImpactProfile";

describe("Marble Tower Map 2 toy-road audio", () => {
  it("gives static map 2 obstacles a shorter hollow-plastic clack", () => {
    const normal = marbleImpactProfile("obstacle", 0.7, 0);
    const toyRoad = marbleImpactProfile("obstacle", 0.7, 1);

    expect(toyRoad.duration).toBeLessThan(normal.duration);
    expect(toyRoad.fundamentalType).toBe("triangle");
    expect(toyRoad.baseFrequency).toBeGreaterThan(normal.baseFrequency);
    expect(toyRoad.metallicGain).toBeLessThan(normal.metallicGain);
  });

  it("keeps rolling, marble, wall and moving-sweeper sounds distinct", () => {
    const wall = marbleImpactProfile("wall", 0.6, 0);
    const marble = marbleImpactProfile("marble", 0.6, 0);
    const sweeper = marbleImpactProfile("obstacle-strike", 0.6, 0);

    expect(new Set([wall.duration, marble.duration, sweeper.duration]).size).toBe(3);
    expect(marble.baseFrequency).toBeGreaterThan(wall.baseFrequency);
    expect(sweeper.fundamentalType).toBe("triangle");
  });
});
