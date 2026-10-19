import { describe, expect, it } from "vitest";
import { cosDeg, normalAngle, project, sinDeg, sinePath, tanPaths, frameWindow } from "../mathGeometry";
import { MATH_CHAPTERS, MATH_FRAMES, chapterAt } from "../mathTimeline";

describe("math geometry", () => {
  it("calculates quadrant signs correctly", () => {
    expect(sinDeg(120)).toBeCloseTo(Math.sqrt(3) / 2);
    expect(cosDeg(120)).toBeCloseTo(-0.5);
    for (const a of [0, 30, 90, 180, 270, 360]) {
      expect(sinDeg(a) ** 2 + cosDeg(a) ** 2).toBeCloseTo(1);
    }
  });
  it("maps y-up math to y-down SVG", () => {
    expect(project(100, 100, 50, 90).y).toBeCloseTo(50);
    expect(project(100, 100, 50, 0).x).toBeCloseTo(150);
    expect(normalAngle(-90)).toBe(270);
  });
  it("never emits invalid coordinates or bridges tan asymptotes", () => {
    expect(sinePath(0, 200, 500, 40, 2)).not.toMatch(/NaN|Infinity/);
    const paths = tanPaths(0, 200, 500, 40, 2);
    expect(paths.length).toBeGreaterThan(1);
    expect(paths.join(" ")).not.toMatch(/NaN|Infinity/);
  });
  it("uses stable frame-only windows", () => {
    expect(frameWindow(25, 0, 100)).toBe(0.25);
    expect(frameWindow(25, 0, 100)).toBe(frameWindow(25, 0, 100));
  });
});

describe("math chapter timeline", () => {
  it("covers every frame without a gap", () => {
    expect(MATH_CHAPTERS[0].start).toBe(0);
    expect(MATH_CHAPTERS[MATH_CHAPTERS.length - 1].end).toBe(MATH_FRAMES);
    for (let i = 1; i < MATH_CHAPTERS.length; i++) expect(MATH_CHAPTERS[i].start).toBe(MATH_CHAPTERS[i - 1].end);
    for (let f = 0; f < MATH_FRAMES; f++) expect(chapterAt(f)).toBeDefined();
  });
});
