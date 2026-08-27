import { describe, expect, it } from "vitest";
import { cameraAnchorProgress, cameraShotForSection } from "../features/marble-tower-video/camera/raceCameraPlan";

const SECTION_IDS = [
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
];

describe("Marble Tower camera plan", () => {
  it("keeps every gameplay shot close enough to read the marbles", () => {
    SECTION_IDS.forEach((section) => {
      const shot = cameraShotForSection(section, 12, true);
      const distance = Math.hypot(shot.behind, shot.lift, shot.side);

      expect(distance, section).toBeGreaterThanOrEqual(7);
      expect(distance, section).toBeLessThanOrEqual(20);
      expect(shot.fov, section).toBeGreaterThanOrEqual(46);
      expect(shot.fov, section).toBeLessThanOrEqual(60);
    });
  });

  it("holds one camera anchor while the marbles cross a section", () => {
    const section = { from: 0.32, to: 0.45 };

    expect(cameraAnchorProgress(section)).toBeCloseTo(0.3876, 4);
    expect(cameraAnchorProgress(section)).toBeGreaterThan(section.from);
    expect(cameraAnchorProgress(section)).toBeLessThan(section.to);
  });

  it("moves the opening shot during the countdown without a camera jump", () => {
    const start = cameraShotForSection("start", 0, false);
    const middle = cameraShotForSection("start", 1.5, false);
    const end = cameraShotForSection("start", 3, false);

    expect(middle.side).not.toBe(start.side);
    expect(end.side).not.toBe(middle.side);
    expect(Math.abs(end.side - start.side)).toBeLessThan(2.5);
    expect(Math.abs(end.lift - start.lift)).toBeLessThan(1.2);
  });

  it("does not flip from one side of the track on consecutive sections", () => {
    const shots = SECTION_IDS.map((section) => cameraShotForSection(section, 12, true));

    for (let index = 1; index < shots.length; index += 1) {
      expect(Math.abs(shots[index].side - shots[index - 1].side), SECTION_IDS[index]).toBeLessThan(10);
    }
  });

  it("keeps the finish shot on the clear outside line instead of crossing behind the tower columns", () => {
    const chaos = cameraShotForSection("chaos", 12, true);
    const finish = cameraShotForSection("finish", 12, true);

    expect(Math.sign(finish.side)).toBe(Math.sign(chaos.side));
    expect(finish.side).toBeGreaterThanOrEqual(7);
    expect(finish.behind).toBeLessThanOrEqual(8);
  });
});
