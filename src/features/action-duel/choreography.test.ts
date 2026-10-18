import { describe, expect, it } from "vitest";
import {
  DRAGON_CHARGE_END, DRAGON_END, DRAGON_FLIGHT_END,
  DRAGON_WRAP_END, DUEL_ATTACKS, sampleDuelPose,
} from "./choreography";

describe("Kháng Long Hữu Hối animation", () => {
  const attack = DUEL_ATTACKS[0];
  const frameAt = (phase: number) => attack.at + attack.duration * phase;

  it("keeps the robot planted while dragon energy coils at the palms", () => {
    const resting = sampleDuelPose(0);
    const charging = sampleDuelPose(frameAt(.15));
    expect(charging.chargePower).toBeGreaterThan(.5);
    expect(charging.dragonStage).toBe("coil");
    expect(charging.dragonPower).toBeGreaterThan(0);
    expect(Math.abs(charging.heroX - resting.heroX)).toBeLessThan(12);
  });

  it("launches the dragon head-first in a fast horizontal line", () => {
    const start = sampleDuelPose(frameAt(DRAGON_CHARGE_END + .02));
    const middle = sampleDuelPose(frameAt((DRAGON_CHARGE_END + DRAGON_FLIGHT_END) / 2));
    const near = sampleDuelPose(frameAt(DRAGON_FLIGHT_END - .01));
    expect(start.dragonStage).toBe("flight");
    expect(middle.dragonX).toBeGreaterThan(start.dragonX + 45);
    expect(near.dragonX).toBeGreaterThan(middle.dragonX + 45);
    expect(Math.abs(near.dragonY - start.dragonY)).toBeLessThan(20);
  });

  it("coils around the skeleton and knocks it back with a lean and lift", () => {
    const before = sampleDuelPose(frameAt(DRAGON_FLIGHT_END - .01));
    const hit = sampleDuelPose(frameAt((DRAGON_FLIGHT_END + DRAGON_WRAP_END) / 2));
    expect(hit.dragonStage).toBe("wrap");
    expect(hit.dragonWrap).toBeGreaterThan(.2);
    expect(hit.hits).toBe(before.hits + 1);
    expect(hit.enemyX).toBeGreaterThan(before.enemyX + 10);
    expect(hit.enemyY).toBeLessThan(before.enemyY - 5);
    expect(hit.enemyTilt).toBeGreaterThan(.1);
  });

  it("fades qi after the impact and counts all ten hits", () => {
    expect(sampleDuelPose(frameAt(DRAGON_END + .01)).dragonPower).toBe(0);
    expect(sampleDuelPose(15.15).hits).toBe(DUEL_ATTACKS.length);
  });

  it("is deterministic when scrubbing the same frame", () => {
    expect(sampleDuelPose(8.46)).toEqual(sampleDuelPose(8.46));
  });
});
