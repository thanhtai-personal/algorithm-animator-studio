import { describe, expect, it } from "vitest";
import {
  DRAGON_END, DRAGON_HIT, DRAGON_RELEASE, DUEL_ATTACKS, sampleDuelPose,
} from "./choreography";

describe("Action Duel dragon palm attack", () => {
  const attack = DUEL_ATTACKS[0];
  const frameAt = (phase: number) => attack.at + attack.duration * phase;

  it("charges energy at the robot's palms before launching", () => {
    const resting = sampleDuelPose(0);
    const charging = sampleDuelPose(frameAt(.15));
    expect(charging.chargePower).toBeGreaterThan(.5);
    expect(charging.dragonPower).toBe(0);
    expect(Math.abs(charging.heroX - resting.heroX)).toBeLessThan(20);
  });

  it("projects a moving visible dragon from robot toward skeleton", () => {
    const start = sampleDuelPose(frameAt(DRAGON_RELEASE + .025));
    const mid = sampleDuelPose(frameAt((DRAGON_RELEASE + DRAGON_HIT) / 2));
    const nearTarget = sampleDuelPose(frameAt(DRAGON_HIT - .012));
    expect(start.dragonPower).toBeGreaterThan(0);
    expect(mid.dragonPower).toBeGreaterThan(.3);
    expect(mid.dragonX).toBeGreaterThan(start.dragonX + 45);
    expect(nearTarget.dragonX).toBeGreaterThan(mid.dragonX + 45);
    expect(mid.palmExtension).toBeGreaterThan(.4);
  });

  it("scores a hit only when the dragon reaches the skeleton", () => {
    const before = sampleDuelPose(frameAt(DRAGON_HIT - .001));
    const hit = sampleDuelPose(frameAt(DRAGON_HIT + .01));
    expect(hit.hits).toBe(before.hits + 1);
    expect(hit.enemyStagger).toBeGreaterThan(.3);
    expect(hit.impact).toBeGreaterThan(0);
  });

  it("fades the dragon before the next attack", () => {
    expect(sampleDuelPose(frameAt(DRAGON_END + .01)).dragonPower).toBe(0);
  });

  it("repeats exact frames on seek and records ten impacts", () => {
    expect(sampleDuelPose(8.46)).toEqual(sampleDuelPose(8.46));
    expect(sampleDuelPose(15.15).hits).toBe(DUEL_ATTACKS.length);
  });
});
