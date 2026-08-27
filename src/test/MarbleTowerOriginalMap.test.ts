import { describe, expect, it } from "vitest";
import {
  COURSE_SECTIONS,
  CUTS,
  SAMPLE_COUNT,
  SPECIALS,
  TOWER_POINTS,
} from "../features/marble-tower-video/track/towerCourse";
import { COURSE_SAMPLES } from "../features/marble-tower-video/track/towerCourseSampler";

describe("Marble Tower original map parity", () => {
  it("keeps the 31-point tower route while opening its vertical spacing", () => {
    expect(TOWER_POINTS).toHaveLength(31);
    expect(TOWER_POINTS[0]).toEqual([0, 65.285, -8]);
    expect(TOWER_POINTS.at(-1)).toEqual([18, 1.35, 28]);
    expect(SAMPLE_COUNT).toBe(184);
    expect(COURSE_SAMPLES).toHaveLength(184);
  });

  it("keeps the original ten-section race rhythm", () => {
    expect(COURSE_SECTIONS.map((section) => section.id)).toEqual([
      "start",
      "switchback",
      "spinner",
      "hairpin",
      "chimes",
      "piano",
      "spiral",
      "tunnel",
      "chaos",
      "finish",
    ]);
  });

  it("keeps the original cuts and obstacle landmarks", () => {
    expect(CUTS.map(({ progress, keep }) => [progress, keep])).toEqual([
      [0.38, 6],
      [0.66, 4],
      [0.86, 2],
    ]);
    expect(SPECIALS).toMatchObject({
      spinnerA: 0.245,
      spinnerB: 0.292,
      pianoStart: 0.545,
      pianoEnd: 0.635,
      jump: 0.715,
      finalCross: 0.885,
      finish: 0.985,
    });
  });
});
